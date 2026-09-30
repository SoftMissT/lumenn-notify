const MODULE_ID = "lumenn-notify";
const NS = "lumenn-notify";
const { ApplicationV2, DialogV2 } = foundry.applications.api;

const esc = (value) => foundry.utils.escapeHTML(String(value ?? ""));

function selectOptions(values, selected, labelFn) {
  return values
    .map(
      (v) =>
        `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(labelFn ? labelFn(v) : v)}</option>`,
    )
    .join("");
}

function userOptions(users, selectedIds = []) {
  const selected = new Set(selectedIds);
  return users
    .map(
      (u) =>
        `<option value="${esc(u.id)}"${selected.has(u.id) ? " selected" : ""}>${esc(u.name)}${u.isGM ? " · GM" : ""}</option>`,
    )
    .join("");
}

function statsToText(stats) {
  return (stats ?? []).map((s) => `${s.label ?? s.rotulo ?? ""}: ${s.value ?? s.valor ?? ""}`).join("\n");
}

function parseStats(text) {
  const out = String(text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      return idx === -1
        ? { label: line, value: "" }
        : { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    })
    .filter((s) => s.label);
  return out.length ? out : [];
}

export function openManager(api) {
  if (!game.user?.isGM) {
    ui.notifications.warn("Lumenn Notify: somente o GM pode abrir o gerenciador.");
    return;
  }
  new LumennNotifyManager(api).render(true);
}

class LumennNotifyManager extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-manager`,
    classes: ["lumenn-notify-manager"],
    position: { width: 1280, height: 720 },
    window: { title: "Lumenn Notify · Console de Mensagens", icon: "fa-solid fa-satellite-dish", resizable: true },
    actions: {
      selectProfile: LumennNotifyManager.#selectProfile,
      selectGroup: LumennNotifyManager.#selectGroup,
      newProfile: LumennNotifyManager.#newProfile,
      newGroup: LumennNotifyManager.#newGroup,
      duplicateProfile: LumennNotifyManager.#duplicateProfile,
      saveProfile: LumennNotifyManager.#saveProfile,
      deleteProfile: LumennNotifyManager.#deleteProfile,
      useProfile: LumennNotifyManager.#useProfile,
      importProfiles: LumennNotifyManager.#importProfiles,
      exportProfiles: LumennNotifyManager.#exportProfiles,
      saveGroup: LumennNotifyManager.#saveGroup,
      deleteGroup: LumennNotifyManager.#deleteGroup,
    },
    form: { handler: null, submitOnChange: false, closeOnSubmit: false },
  };

  constructor(api, options) {
    super(options);
    this.api = api;
    this._lumennState = { selectedId: null, selectedGroupId: null, query: "", tab: "profiles", error: "", recipient: "all" };
  }

  get state() {
    return this._lumennState;
  }

  get title() {
    return "Lumenn Notify · Console de Mensagens";
  }

  async _renderHTML(contents) {
    return this.state.tab === "groups" ? this.#buildGroupsHTML() : this.#buildProfilesHTML();
  }

  _replaceHTML(result, content) {
    content.innerHTML = String(result ?? "");
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const search = this.element.querySelector("#lm-search");
    if (search) search.addEventListener("input", (event) => {
      this.state.query = event.target.value;
      this.render(true);
    });
    this.element.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        this.state.tab = event.currentTarget.dataset.tab;
        this.state.error = "";
        this.render(true);
      });
    });
    this.element.querySelectorAll("[data-theme-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const select = this.element.querySelector('[data-lm-field="theme"]');
        if (!select) return;
        select.value = btn.dataset.themeOption;
        this.element.querySelector(".lm-manager")?.setAttribute("data-lm-manager-theme", btn.dataset.themeOption);
        this.element.querySelectorAll("[data-theme-option]").forEach((option) => {
          const active = option === btn;
          option.classList.toggle("active", active);
          option.setAttribute("aria-checked", String(active));
        });
        select.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    this.element.querySelectorAll("[data-lm-field]").forEach((el) => {
      el.addEventListener("input", () => this.#refreshPreview());
      el.addEventListener("change", () => {
        if (el.dataset.lmField === "recipient") {
          this.state.recipient = el.value;
          this.#syncRecipientVisibility();
        }
        this.#refreshPreview();
      });
    });
    this.#syncRecipientVisibility();
    this.#refreshPreview();
  }

  #draft() {
    const all = this.api.getProfiles();
    const p = Object.values(all).find((x) => x.id === this.state.selectedId);
    if (!p) return this.api.normalizeProfile({});
    const root = this.element;
    const value = (f) => root.querySelector(`[data-lm-field="${f}"]`)?.value ?? "";
    const stats = parseStats(value("stats"));
    return {
      ...p,
      name: value("name") || p.name,
      type: value("type") || p.type,
      theme: value("theme") || p.theme,
      icon: value("icon") || p.icon,
      title: value("title") || p.title,
      body: value("body") || p.body,
      emitter: value("emitter") || p.emitter,
      tag: value("tag") || p.tag,
      footer: value("footer") || p.footer,
      narrative: value("narrative") || p.narrative || "",
      duration: Math.max(0, Number(value("duration")) * 1000 || 0),
      mode: value("mode") || p.mode,
      sound: Boolean(root.querySelector('[data-lm-field="sound"]')?.checked),
      stats,
    };
  }

  #syncRecipientVisibility() {
    const recipient = this.element.querySelector('[data-lm-field="recipient"]')?.value ?? "all";
    this.state.recipient = recipient;
    this.element.querySelectorAll("[data-lm-recipient-select]").forEach((label) => {
      label.style.display = label.dataset.lmRecipientSelect === recipient ? "" : "none";
    });
  }

  #refreshPreview() {
    const target = this.element.querySelector("[data-el='preview']");
    if (!target) return;
    const p = this.#draft();
    this.element.querySelector(".lm-manager")?.setAttribute("data-lm-manager-theme", p.theme);
    target.dataset.lmTheme = p.theme;
    target.innerHTML = this.api.renderMessage({ ...p, builtin: false });
  }

  #profileContext() {
    const profiles = Object.values(this.api.getProfiles()).sort((a, b) =>
      a.builtin === b.builtin ? String(a.name).localeCompare(String(b.name)) : a.builtin ? -1 : 1,
    );
    const query = this.state.query.toLowerCase();
    const filtered = query
      ? profiles.filter(
          (p) =>
            String(p.name).toLowerCase().includes(query) ||
            String(p.type).toLowerCase().includes(query) ||
            String(p.theme).toLowerCase().includes(query),
        )
      : profiles;
    const selected = profiles.find((p) => p.id === this.state.selectedId) ?? profiles[0] ?? null;
    if (selected && selected.id !== this.state.selectedId) this.state.selectedId = selected.id;
    return {
      profiles: filtered,
      selected,
      groups: Object.values(this.api.getGroups()).sort((a, b) => String(a.name).localeCompare(String(b.name))),
      users: Array.from(game.users ?? []),
      themes: ["system", "orv", "fantasy"],
      types: ["system", "quest", "alert", "danger", "skill", "levelup", "constellation", "custom"],
      narratives: ["", "observa", "mensagem_indireta", "bencao", "interesse", "rejeita"],
      modes: ["overlay", "chat", "both"],
      recipients: ["all", "gm", "user", "group"],
    };
  }

  #buildProfilesHTML() {
    const { profiles, selected, groups, users, themes, types, narratives, modes, recipients } = this.#profileContext();
    const list = profiles
      .map(
        (p) => `
        <li>
          <button type="button" data-action="selectProfile" data-profile-id="${esc(p.id)}"
            class="lm-profile${p.id === selected?.id ? " active" : ""}">
            <i class="${esc(p.icon)}"></i>
            <span class="lm-profile-name">${esc(p.name)}</span>
            ${p.builtin ? '<span class="lm-badge lm-badge-native">Nativo</span>' : ""}
            <span class="lm-badge lm-theme-${esc(p.theme)}">${esc(p.theme)}</span>
          </button>
        </li>`,
      )
      .join("");

    const s = selected ?? {};
    const themeLabels = { system: "Sistema", orv: "Constelação", fantasy: "Grimório" };
    const userSel = recipients.includes(this.state.recipient ?? "all") ? (this.state.recipient ?? "all") : "all";

    return `
    <div class="lm-manager" data-lm-manager-theme="${esc(s.theme ?? "system")}">
      <div class="lm-sidebar">
        <div class="lm-sidebar-heading"><span>Perfis da campanha</span><b>${profiles.length}</b></div>
        <div class="lm-search-wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input id="lm-search" type="search" placeholder="Buscar perfil..." value="${esc(this.state.query)}">
        </div>
        <div class="lm-tabs">
          <button type="button" class="lm-tab${this.state.tab === "profiles" ? " active" : ""}" data-tab="profiles">Perfis</button>
          <button type="button" class="lm-tab${this.state.tab === "groups" ? " active" : ""}" data-tab="groups">Grupos</button>
        </div>
        <ul class="lm-list">${list}</ul>
      </div>
      <div class="lm-main">
        <div class="lm-command-header">
          <div>
            <span class="lm-kicker">SISTEMA DE MENSAGENS // GM</span>
            <h1>Console do Monarca</h1>
            <span class="lm-profile-context">Perfil ativo: ${esc(s.name ?? "Nenhum perfil")}</span>
          </div>
          <span class="lm-online"><i class="fa-solid fa-circle"></i> canal seguro</span>
        </div>
        <div class="lm-toolbar">
          <button type="button" data-action="newProfile"><i class="fa-solid fa-plus"></i> Novo</button>
          <button type="button" data-action="duplicateProfile"><i class="fa-solid fa-copy"></i> Duplicar</button>
          <button type="button" data-action="saveProfile"><i class="fa-solid fa-floppy-disk"></i> Salvar</button>
          <button type="button" data-action="deleteProfile" ${s.builtin ? "disabled" : ""}><i class="fa-solid fa-trash"></i> Excluir</button>
          <span class="lm-spacer"></span>
          <button type="button" data-action="importProfiles"><i class="fa-solid fa-file-import"></i> Importar</button>
          <button type="button" data-action="exportProfiles"><i class="fa-solid fa-file-export"></i> Exportar</button>
          <button type="button" data-action="useProfile" class="lm-primary"><i class="fa-solid fa-paper-plane"></i> Usar</button>
        </div>
        <div class="lm-body">
          <div class="lm-editor">
            <div class="lm-theme-picker">
              <div class="lm-field-heading">
                <span>Tema da mensagem</span>
                <small>Escolha a identidade visual do cartão</small>
              </div>
              <div class="lm-theme-options" role="radiogroup" aria-label="Tema da mensagem">
                ${themes.map((theme) => `<button type="button" class="lm-theme-option lm-theme-option-${esc(theme)}${s.theme === theme ? " active" : ""}" data-theme-option="${esc(theme)}" role="radio" aria-checked="${s.theme === theme}"><span class="lm-theme-swatch"></span><span>${esc(themeLabels[theme] ?? theme)}</span><small>${esc(theme)}</small></button>`).join("")}
              </div>
            </div>
            <div class="lm-grid">
              <label>Nome<input type="text" data-lm-field="name" value="${esc(s.name ?? "")}"></label>
              <label>Tipo
                <select data-lm-field="type">${selectOptions(types, s.type)}</select>
              </label>
              <label>Tema
                <select data-lm-field="theme">${selectOptions(themes, s.theme)}</select>
              </label>
              ${s.type === "constellation" ? `<label>Tipo narrativo
                <select data-lm-field="narrative">${selectOptions(narratives, s.narrative)}</select>
              </label>` : ""}
              <label>Ícone<input type="text" data-lm-field="icon" value="${esc(s.icon ?? "")}"></label>
              <label>Título<input type="text" data-lm-field="title" value="${esc(s.title ?? "")}"></label>
              <label class="lm-full">Emissor<input type="text" data-lm-field="emitter" value="${esc(s.emitter ?? "")}"></label>
              <label class="lm-full">Mensagem<textarea data-lm-field="body" rows="3">${esc(s.body ?? "")}</textarea></label>
              <label>Tag<input type="text" data-lm-field="tag" value="${esc(s.tag ?? "")}"></label>
              <label>Rodapé<input type="text" data-lm-field="footer" value="${esc(s.footer ?? "")}"></label>
              <label>Stats (Rótulo: valor)<textarea data-lm-field="stats" rows="2">${esc(statsToText(s.stats))}</textarea></label>
              <label>Modo
                <select data-lm-field="mode">${selectOptions(modes, s.mode)}</select>
              </label>
              <label>Duração (s)<input type="number" min="0" max="60" step="1" data-lm-field="duration" value="${esc(Math.round((Number(s.duration) || 0) / 1000))}"></label>
              <label class="lm-check"><input type="checkbox" data-lm-field="sound"${s.sound ? " checked" : ""}> Tocar som</label>
            </div>
            <div class="lm-send">
              <label>Destino
                <select data-lm-field="recipient">${selectOptions(recipients, userSel)}</select>
              </label>
              <label data-lm-recipient-select="user">Jogador
                <select data-lm-field="recipientUser"><option value="">Selecione</option>${userOptions(users)}</select>
              </label>
              <label data-lm-recipient-select="group">Grupo
                <select data-lm-field="recipientGroup"><option value="">Selecione</option>${groups.map((g) => `<option value="${esc(g.id)}">${esc(g.name)}</option>`).join("")}</select>
              </label>
            </div>
            ${this.state.error ? `<div class="lm-error">${esc(this.state.error)}</div>` : ""}
          </div>
          <div class="lm-preview">
            <div class="lm-preview-label">Prévia real</div>
            <div class="lm-preview-box" data-el="preview" data-lm-theme="${esc(s.theme ?? "system")}">${this.api.renderMessage({ ...s, builtin: false })}</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  #groupContext() {
    const groups = Object.values(this.api.getGroups()).sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const selected = groups.find((g) => g.id === this.state.selectedGroupId) ?? groups[0] ?? null;
    if (selected && selected.id !== this.state.selectedGroupId) this.state.selectedGroupId = selected.id;
    return { groups, selectedGroup: selected, users: Array.from(game.users ?? []) };
  }

  #buildGroupsHTML() {
    const { groups, selectedGroup, users } = this.#groupContext();
    const rows = groups
      .map(
        (g) => `
        <li>
          <button type="button" data-action="selectGroup" data-group-id="${esc(g.id)}"
            class="lm-profile${g.id === selectedGroup?.id ? " active" : ""}">
            <i class="fa-solid fa-users"></i>
            <span class="lm-profile-name">${esc(g.name)}</span>
            <span class="lm-badge">${g.userIds.length} usuário(s)</span>
          </button>
        </li>`,
      )
      .join("");
    const g = selectedGroup ?? {};
    return `
    <div class="lm-manager">
      <div class="lm-sidebar">
        <div class="lm-search-wrap">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input id="lm-search" type="search" placeholder="Buscar grupo..." value="${esc(this.state.query)}">
        </div>
        <div class="lm-tabs">
          <button type="button" class="lm-tab${this.state.tab === "profiles" ? "" : " active"}" data-tab="profiles">Perfis</button>
          <button type="button" class="lm-tab${this.state.tab === "groups" ? " active" : ""}" data-tab="groups">Grupos</button>
        </div>
        <ul class="lm-list">${rows || '<li class="lm-empty">Nenhum grupo ainda.</li>'}</ul>
      </div>
      <div class="lm-main">
        <div class="lm-toolbar">
          <button type="button" data-action="newGroup"><i class="fa-solid fa-plus"></i> Novo grupo</button>
          <button type="button" data-action="saveGroup"><i class="fa-solid fa-floppy-disk"></i> Salvar grupo</button>
          <button type="button" data-action="deleteGroup" ${g.id ? "" : "disabled"}><i class="fa-solid fa-trash"></i> Excluir</button>
        </div>
        <div class="lm-body lm-body-groups">
          <div class="lm-editor">
            <label class="lm-full">Nome do grupo<input type="text" data-lm-field="groupName" value="${esc(g.name ?? "")}" placeholder="Ex.: Mesa 1"></label>
            <label class="lm-full">Usuários
              <select data-lm-field="groupUsers" multiple size="6">${userOptions(users, g.userIds ?? [])}</select>
            </label>
            ${this.state.error ? `<div class="lm-error">${esc(this.state.error)}</div>` : ""}
          </div>
        </div>
      </div>
    </div>`;
  }

  #selectedProfile() {
    const id = this.state.selectedId;
    const all = this.api.getProfiles();
    if (id && all[id]) return all[id];
    return Object.values(all)[0] ?? null;
  }

  static async #selectProfile(event, target) {
    const id = target.dataset.profileId;
    if (!id) return;
    this.state.selectedId = id;
    this.state.error = "";
    await this.render(true);
  }

  static async #selectGroup(event, target) {
    const id = target.dataset.groupId;
    if (!id) return;
    this.state.selectedGroupId = id;
    this.state.error = "";
    await this.render(true);
  }

  static async #newGroup(event, target) {
    const id = `group-${foundry.utils.randomID(8)}`;
    const groups = { ...this.api.getGroups(), [id]: { id, name: "Novo grupo", userIds: [] } };
    await this.api.saveGroups(groups);
    this.state.selectedGroupId = id;
    this.state.error = "";
    this.render(true);
  }

  static async #newProfile(event, target) {
    const id = `profile-${foundry.utils.randomID(8)}`;
    await this.api.saveProfile({ id, name: "Novo perfil", type: "custom", theme: "system", body: "", builtin: false });
    this.state.selectedId = id;
    this.state.error = "";
    this.render(true);
  }

  static async #duplicateProfile(event, target) {
    const base = this.#selectedProfile();
    if (!base) return;
    const id = `profile-${foundry.utils.randomID(8)}`;
    await this.api.saveProfile({ ...base, id, name: `${base.name} (cópia)`, builtin: false });
    this.state.selectedId = id;
    this.state.error = "";
    this.render(true);
  }

  static async #saveProfile(event, target) {
    const p = this.#draft();
    if (!p.id) {
      this.state.error = "Selecione um perfil antes de salvar.";
      this.render(true);
      return;
    }
    if (p.builtin || this.api.BUILTINS[p.id]) {
      this.state.error = "Presets nativos são protegidos. Duplique para editar.";
      this.render(true);
      return;
    }
    if (!String(p.name || "").trim()) {
      this.state.error = "Dê um nome ao perfil.";
      this.render(true);
      return;
    }
    const clean = { ...p, builtin: false, name: String(p.name).trim() };
    delete clean.recipient;
    delete clean.recipientId;
    await this.api.saveProfile(clean);
    this.state.error = "";
    ui.notifications.info(`Perfil "${clean.name}" salvo.`);
    this.render(true);
  }

  static async #deleteProfile(event, target) {
    const p = this.#selectedProfile();
    if (!p) return;
    if (p.builtin || this.api.BUILTINS[p.id]) {
      this.state.error = "Presets nativos são protegidos.";
      this.render(true);
      return;
    }
    const confirmed = await DialogV2.confirm({
      window: { title: "Excluir perfil" },
      content: `<p>Excluir o perfil <b>${esc(p.name)}</b>?</p>`,
    });
    if (!confirmed) return;
    await this.api.deleteProfile(p.id);
    this.state.selectedId = null;
    this.state.error = "";
    this.render(true);
  }

  static async #useProfile(event, target) {
    const p = this.#draft();
    if (!p) return;
    const root = this.element;
    const recipient = root.querySelector('[data-lm-field="recipient"]')?.value ?? "all";
    const userId = root.querySelector('[data-lm-field="recipientUser"]')?.value;
    const groupId = root.querySelector('[data-lm-field="recipientGroup"]')?.value;
    if (recipient === "user" && !userId) {
      this.state.error = "Selecione um jogador válido.";
      this.render(true);
      return;
    }
    if (recipient === "group" && !groupId) {
      this.state.error = "Selecione um grupo válido.";
      this.render(true);
      return;
    }
    this.state.error = "";
    const msg = await this.api.send({
      ...p,
      profile: p.id,
      destination: recipient,
      userId,
      groupId,
    });
    if (msg) ui.notifications.info("Mensagem enviada.");
  }

  static async #importProfiles(event, target) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const items = Array.isArray(data) ? data : data.profiles ?? data.items ?? [];
        if (!Array.isArray(items)) throw new Error("formato inválido");
        let count = 0;
        for (const raw of items) {
          const id = `profile-${foundry.utils.randomID(8)}`;
          const normalized = this.api.normalizeProfile({ ...raw, id, builtin: false });
          if (!String(normalized.name || "").trim()) normalized.name = `Importado ${count + 1}`;
          await this.api.saveProfile(normalized);
          count += 1;
        }
        ui.notifications.info(`${count} perfil(is) importado(s).`);
        this.render(true);
      } catch (error) {
        ui.notifications.error("Lumenn Notify: JSON inválido. Importação rejeitada.");
      }
    });
    input.click();
  }

  static async #exportProfiles(event, target) {
    const all = this.api.getProfiles();
    const custom = Object.values(all).filter((p) => !p.builtin && !this.api.BUILTINS[p.id]);
    const payload = { format: "lumenn-notify-profiles", schemaVersion: 1, profiles: custom };
    const json = JSON.stringify(payload, null, 2);
    foundry.utils.saveDataToFile(json, "text/json", "lumenn-notify-profiles.json");
  }

  #selectedGroup() {
    return Object.values(this.api.getGroups()).find((g) => g.id === this.state.selectedGroupId) ?? null;
  }

  static async #saveGroup(event, target) {
    const root = this.element;
    const name = (root.querySelector('[data-lm-field="groupName"]')?.value ?? "").trim();
    const userIds = Array.from(root.querySelectorAll('[data-lm-field="groupUsers"] option:checked')).map((o) => o.value);
    if (!name) {
      this.state.error = "Dê um nome ao grupo.";
      this.render(true);
      return;
    }
    const existing = this.#selectedGroup();
    const id = existing?.id ?? `group-${foundry.utils.randomID(8)}`;
    const groups = { ...this.api.getGroups(), [id]: { id, name, userIds } };
    await this.api.saveGroups(groups);
    this.state.selectedGroupId = id;
    this.state.error = "";
    ui.notifications.info(`Grupo "${name}" salvo.`);
    this.render(true);
  }

  static async #deleteGroup(event, target) {
    const g = this.#selectedGroup();
    if (!g) return;
    const confirmed = await DialogV2.confirm({
      window: { title: "Excluir grupo" },
      content: `<p>Excluir o grupo <b>${esc(g.name)}</b>?</p>`,
    });
    if (!confirmed) return;
    const groups = { ...this.api.getGroups() };
    delete groups[g.id];
    await this.api.saveGroups(groups);
    this.state.selectedGroupId = null;
    this.state.error = "";
    this.render(true);
  }
}
