import { openManager } from "./lumenn-notify-manager.js";

const NS = "lumenn-notify";
const KEY = "library";
const GROUPS_KEY = "groups";
const THEME_KEY = "theme";
const SCHEMA = 1;
const OVERLAY_MAX = 5;
const THEME_CHOICES = {
  system: "System · Azul técnico",
  manhwa: "Manhwa dark · ORV",
  fantasy: "Fantasia épica · Grimório",
  cyberpunk: "Cyberpunk · Neon",
  horror: "Terror · Ruína",
};

const BUILTINS = {
  system: { name: "Sistema", type: "system", theme: "system", icon: "fa-solid fa-bell", title: "SISTEMA", body: "Requisitos ocultos cumpridos. Recompensa liberada.", emitter: "Sistema", tag: "", footer: "SISTEMA", stats: [], duration: 7000, mode: "both", sound: true },
  quest: { name: "Quest", type: "quest", theme: "system", icon: "fa-solid fa-scroll", title: "NOVA MISSÃO", body: "Sobreviva à Masmorra Dupla.", emitter: "Janela de Quest", tag: "QUEST REGISTRADA", footer: "JANELA DE QUEST", stats: [], duration: 9000, mode: "both", sound: true },
  alert: { name: "Aviso", type: "alert", theme: "system", icon: "fa-solid fa-triangle-exclamation", title: "ATENÇÃO", body: "Tome uma atitude antes do próximo ciclo.", emitter: "Sistema", tag: "ALERTA", footer: "SISTEMA", stats: [], duration: 7000, mode: "both", sound: true },
  danger: { name: "Perigo", type: "danger", theme: "system", icon: "fa-solid fa-skull", title: "AMEAÇA DETECTADA", body: "Presença hostil fixou os olhos em você.", emitter: "Protocolo de Defesa", tag: "PERIGO", footer: "PROTOCOLO DE DEFESA", stats: [], duration: 8000, mode: "both", sound: true },
  skill: { name: "Habilidade", type: "skill", theme: "system", icon: "fa-solid fa-bolt", title: "HABILIDADE ADQUIRIDA", body: "Uma nova habilidade foi registrada.", emitter: "Sistema", tag: "HABILIDADE", footer: "STATUS", stats: [], duration: 8000, mode: "both", sound: true },
  levelup: { name: "Level Up", type: "levelup", theme: "system", icon: "fa-solid fa-angles-up", title: "NÍVEL AUMENTADO", body: "Você ficou mais forte.", emitter: "Sistema", tag: "LEVEL UP", footer: "STATUS", stats: [{ label: "Nível", value: "2" }], duration: 10000, mode: "both", sound: true },
  constellation: { name: "Constelação", type: "constellation", theme: "orv", icon: "fa-solid fa-star", title: "UMA CONSTELAÇÃO OBSERVA", body: "A constelação aguarda o próximo movimento da encarnação.", emitter: "Constelação sem nome", tag: "MENSAGEM INDIRETA", footer: "CANAL CELESTIAL", stats: [], duration: 9000, mode: "both", sound: true }
};

const uid = (prefix = "profile") => `${prefix}-${foundry.utils.randomID(8)}`;
const isGM = () => Boolean(game.user?.isGM);
const configuredTheme = () => {
  try { return normalizeTheme(game.settings.get(NS, THEME_KEY)); } catch { return "system"; }
};
const normalizeTheme = (theme) => ({ orv: "manhwa", "manhwa-dark": "manhwa" }[String(theme ?? "")] ?? (THEME_CHOICES[theme] ? theme : "system"));

const CONTROL_NAME = "lumenn-notify";
const CONTROL_TOOL = "open-manager";

function registerSceneControl(controls) {
  if (game.user?.isGM !== true) return;
  controls[CONTROL_NAME] = {
    name: CONTROL_NAME,
    order: 90,
    title: "Lumenn Notify",
    icon: "fa-solid fa-satellite-dish",
    visible: true,
    tools: {
      [CONTROL_TOOL]: {
        name: CONTROL_TOOL,
        order: 0,
        title: "Abrir gerenciador de mensagens",
        icon: "fa-solid fa-comment-dots",
        button: true,
        onChange: () => game.lumennNotify?.openManager(),
      },
    },
  };
}

function normalizeIcon(icon) {
  const value = String(icon ?? "");
  if (!value) return "fa-solid fa-satellite-dish";
  const match = value.match(/class="([^"]+)"/);
  return match ? match[1] : value;
}

function normalizeProfile(raw, id = uid()) {
  const p = raw ?? {};
  return {
    id: p.id ?? id,
    name: String(p.name ?? p.rotulo ?? id),
    builtin: Boolean(p.builtin),
    type: p.type ?? p.tipo ?? "custom",
    theme: normalizeTheme(p.theme ?? "system"),
    icon: normalizeIcon(p.icon ?? p.icone ?? "fa-solid fa-satellite-dish"),
    title: p.title ?? p.titulo ?? "NOVA MENSAGEM",
    body: p.body ?? p.corpo ?? "",
    emitter: p.emitter ?? p.emissor ?? "Sistema",
    tag: p.tag ?? "",
    footer: p.footer ?? p.rodape ?? "SISTEMA",
    stats: Array.isArray(p.stats) ? p.stats : [],
    duration: Math.max(1500, Number(p.duration ?? p.duracao ?? 7000) || 7000),
    mode: p.mode ?? (p.modo === "ambos" ? "both" : p.modo ?? "both"),
    sound: p.sound ?? p.som !== false
  };
}

function migrateLegacy() {
  try {
    if (!game.settings.settings.has("gondolin-sls.biblioteca")) return {};
    const legacy = game.settings.get("gondolin-sls", "biblioteca") ?? {};
    return Object.fromEntries(Object.entries(legacy).map(([id, p]) => [id, normalizeProfile({ ...p, name: p.name ?? p.rotulo, type: "custom" }, id)]));
  } catch (error) {
    console.warn(`[${NS}] legacy migration skipped`, error);
    return {};
  }
}

function registerSettings() {
  if (!game.settings.settings.has(`${NS}.${KEY}`)) game.settings.register(NS, KEY, { scope: "world", config: false, type: Object, default: {} });
  if (!game.settings.settings.has(`${NS}.${GROUPS_KEY}`)) game.settings.register(NS, GROUPS_KEY, { scope: "world", config: false, type: Object, default: {} });
  const themeConfig = {
    name: "Tema global das mensagens",
    hint: "Define a identidade visual usada pelo Lumenn Notify no chat, overlay e prévia.",
    scope: "world",
    config: true,
    requiresReload: false,
    type: String,
    choices: THEME_CHOICES,
    default: "system",
    onChange: (theme) => Hooks.callAll("lumennNotifyThemeChanged", normalizeTheme(theme)),
  };
  const themeSettingKey = `${NS}.${THEME_KEY}`;
  if (!game.settings.settings.has(themeSettingKey)) game.settings.register(NS, THEME_KEY, themeConfig);
  else {
    const existing = game.settings.settings.get?.(themeSettingKey);
    if (existing && typeof existing === "object") Object.assign(existing, themeConfig);
  }
}

function getProfiles() {
  const saved = game.settings.get(NS, KEY) ?? {};
  return { ...Object.fromEntries(Object.entries(BUILTINS).map(([id, p]) => [id, normalizeProfile({ ...p, id, builtin: true }, id)])), ...saved };
}

function getGroups() {
  const groups = game.settings.get(NS, GROUPS_KEY) ?? {};
  const active = new Set(Array.from(game.users ?? []).map((u) => u.id));
  return Object.fromEntries(Object.entries(groups).map(([id, group]) => [id, { id, name: group.name, userIds: (group.userIds ?? []).filter((userId) => active.has(userId)) }]));
}

async function saveProfiles(profiles) { return game.settings.set(NS, KEY, profiles); }
async function saveGroups(groups) { return game.settings.set(NS, GROUPS_KEY, groups); }

function findProfile(id) { return getProfiles()[id] ?? null; }

async function saveProfile(profile) {
  if (!isGM()) return ui.notifications.warn("Lumenn Notify: somente o GM pode salvar perfis.");
  const p = normalizeProfile(profile, profile.id ?? uid());
  if (p.builtin || BUILTINS[p.id]) return ui.notifications.warn("Lumenn Notify: presets nativos são protegidos.");
  const profiles = game.settings.get(NS, KEY) ?? {};
  profiles[p.id] = p;
  await saveProfiles(profiles);
  return p;
}

async function deleteProfile(id) {
  if (!isGM()) return ui.notifications.warn("Lumenn Notify: somente o GM pode excluir perfis.");
  if (BUILTINS[id]) return ui.notifications.warn("Lumenn Notify: presets nativos são protegidos.");
  const profiles = game.settings.get(NS, KEY) ?? {};
  delete profiles[id];
  return saveProfiles(profiles);
}

function renderMessage(profile, data = {}) {
  const p = normalizeProfile({ ...profile, ...data });
  p.theme = normalizeTheme(p.theme);
  const stats = (p.stats ?? []).map((s) => `<div class="ln-stat"><span>${foundry.utils.escapeHTML(s.label ?? s.rotulo ?? "")}</span><b>${foundry.utils.escapeHTML(s.value ?? s.valor ?? "")}</b></div>`).join("");
  return `<div class="ln-message" data-lm-theme="${foundry.utils.escapeHTML(p.theme)}" data-lm-type="${foundry.utils.escapeHTML(p.type)}"><div class="ln-frame"><div class="ln-tag">${foundry.utils.escapeHTML(p.tag)}</div><header><i class="${foundry.utils.escapeHTML(p.icon)}"></i><h2>${foundry.utils.escapeHTML(p.title)}</h2></header><div class="ln-origin"><i class="fa-solid fa-satellite-dish"></i>${foundry.utils.escapeHTML(p.emitter)}</div><p>${foundry.utils.escapeHTML(p.body).replace(/\n/g, "<br>")}</p>${stats ? `<div class="ln-stats">${stats}</div>` : ""}<footer><span>◆</span>${foundry.utils.escapeHTML(p.footer)}</footer></div></div>`;
}

async function send(data = {}) {
  if (!isGM()) return ui.notifications.warn("Lumenn Notify: somente o GM pode enviar mensagens.");
  const p = findProfile(data.profile ?? data.perfil ?? "system") ?? normalizeProfile(data);
  const destination = data.destination ?? data.destino ?? "all";
  const groups = getGroups();
  let whisper = [];
  if (destination === "gm") whisper = ChatMessage.getWhisperRecipients("GM").map((u) => u.id);
  if (destination === "user") whisper = [data.userId ?? data.jogador].filter((id) => game.users.get(id));
  if (destination === "group") whisper = (groups[data.groupId]?.userIds ?? []).filter((id) => game.users.get(id));
  if (["user", "group"].includes(destination) && !whisper.length) return ui.notifications.warn("Lumenn Notify: destinatário inválido ou grupo vazio.");
  const effective = normalizeProfile({ ...p, ...data, theme: configuredTheme() });
  const mode = effective.mode;
  const snapshot = { v: SCHEMA, profile: effective, sentAt: new Date().toISOString() };
  const message = await ChatMessage.create({
    content: renderMessage(effective),
    speaker: { alias: data.speaker ?? effective.emitter },
    whisper,
    sound: null,
    flags: { [NS]: { snapshot } }
  });
  return message;
}

function playOverlaySound() {
  try {
    const path = CONFIG.sounds?.notification ?? CONFIG.sounds?.ding;
    if (!path) return;
    foundry.audio.AudioHelper.play({ src: path, volume: 0.6 });
  } catch (error) {
    /* som é opcional */
  }
}

const activeOverlays = new Set();
function showOverlay(snapshot) {
  const p = snapshot?.profile;
  if (!p) return;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const el = document.createElement("div");
  el.className = "ln-overlay";
  el.dataset.lmTheme = normalizeTheme(p.theme);
  el.innerHTML = renderMessage(p);
  const remove = () => {
    if (!activeOverlays.delete(el)) return;
    el.remove();
  };
  el.addEventListener("click", remove);
  document.body.appendChild(el);
  activeOverlays.add(el);
  while (activeOverlays.size > OVERLAY_MAX) remove([...activeOverlays][0]);
  if (p.sound) playOverlaySound();
  const duration = Number(p.duration ?? 0);
  if (duration > 0 && !reduced) setTimeout(remove, duration);
}

Hooks.on("renderChatMessageHTML", (message, html) => {
  const snapshot = message.getFlag?.(NS, "snapshot");
  if (!snapshot || !html?.classList) return;
  const mode = snapshot.profile?.mode ?? "both";
  html.classList.add("lumenn-chat-message");
  html.dataset.lmTheme = normalizeTheme(snapshot.profile?.theme);
  html.dataset.lmMode = mode;
  if (mode === "overlay") html.classList.add("lumenn-chat-message--overlay-only");
});

Hooks.on("createChatMessage", (message) => {
  const snapshot = message.getFlag?.(NS, "snapshot");
  if (!snapshot) return;
  if (!message.visible) return;
  const mode = snapshot.profile?.mode ?? "both";
  if (mode === "chat") return;
  const isAuthor = message.author?.id === game.user.id;
  const isGmRecipient = Array.isArray(message.whisper) && message.whisper.some((id) => game.users.get(id)?.isGM) && message.whisper.length === game.users.filter((u) => u.isGM).length;
  if (isAuthor && !isGmRecipient) return;
  showOverlay(snapshot);
});

Hooks.once("init", () => {
  registerSettings();
  game.keybindings?.register(NS, "open-manager", {
    name: "Abrir gerenciador Lumenn Notify",
    hint: "Abre o console de mensagens (somente GM).",
    editable: [{ key: "KeyN", modifiers: ["Alt"] }],
    restricted: true,
    onDown: () => {
      game.lumennNotify?.openManager();
      return true;
    },
  });
});

Hooks.on("getSceneControlButtons", registerSceneControl);

Hooks.once("ready", async () => {
  const current = game.settings.get(NS, KEY) ?? {};
  if (!Object.keys(current).length) {
    const migrated = migrateLegacy();
    if (Object.keys(migrated).length) await saveProfiles(migrated);
  }
  const api = { openManager: () => openManager(api), send, getProfile: findProfile, getProfiles, saveProfile, deleteProfile, getGroups, saveGroups, renderMessage, normalizeProfile, BUILTINS, getTheme: configuredTheme };
  game.lumennNotify = api;
  window.SLS = { __v: "module-0.2.0", abrir: api.openManager, send: (data, body) => typeof data === "string" ? send({ profile: data, body }) : send(data), perfis: BUILTINS };
});

export { BUILTINS, getProfiles, getGroups, normalizeProfile, renderMessage, send, saveProfile, deleteProfile };
