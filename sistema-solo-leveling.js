(async () => {
  const t0 = performance.now();

  /* ============================================================
     SLS · SOLO LEVELING SYSTEM v1.2
     Macro de mensagens de sistema para Foundry VTT v12+
     Gondolin-macros · TANG-ROU
     ------------------------------------------------------------
     COMO USAR:
       1. Rode a macro → abre o Console de Mensagens.
       2. Escolha um PERFIL, edite título/corpo, clique Enviar.
       3. Todos os players veem (overlay na tela + cartão no chat).
     REUSO EM OUTRA MACRO:
       window.SLS.send({ perfil: "quest", corpo: "Mate 10 lobos." });
       window.SLS.send("perigo", "Você foi detectado.");
     ============================================================ */

  /* ---------- PERFIS PRE-SETADOS ---------- */
  const PERFIS = {
    sistema: {
      rotulo: "Notificação",
      icone: '<i class="fa-solid fa-bell"></i>',
      cor: "#4ABDFF",
      tag: "",
      titulo: "SISTEMA",
      corpo: "Requisitos ocultos cumpridos. Recompensa liberada.",
      stats: null,
      rodape: "SISTEMA",
      emissor: "Sistema",
      som: "notification",
      duracao: 7000,
    },
    quest: {
      rotulo: "Quest",
      icone: '<i class="fa-solid fa-scroll"></i>',
      cor: "#7FD4FF",
      tag: "QUEST REGISTRADA",
      titulo: "NOVA MISSÃO",
      corpo: "Sobreviva à Masmorra Dupla. Recompensa: 45 XP, AGI +3.",
      stats: null,
      rodape: "JANELA DE QUEST",
      emissor: "Janela de Quest",
      som: "notification",
      duracao: 9000,
    },
    aviso: {
      rotulo: "Aviso",
      icone: '<i class="fa-solid fa-triangle-exclamation"></i>',
      cor: "#FFB547",
      tag: "ALERTA",
      titulo: "ATENÇÃO",
      corpo: "Dormência detectada. Tome uma atitude antes do próximo ciclo.",
      stats: null,
      rodape: "SISTEMA",
      emissor: "Sistema",
      som: "lock",
      duracao: 7000,
    },
    perigo: {
      rotulo: "Perigo",
      icone: '<i class="fa-solid fa-skull"></i>',
      cor: "#FF4A6B",
      tag: "PERIGO",
      titulo: "AMEAÇA DETECTADA",
      corpo:
        "Presença hostil fixou os olhos em você. Recomenda-se recuo imediato.",
      stats: null,
      rodape: "PROTOCOLO DE DEFESA",
      emissor: "Protocolo de Defesa",
      som: "lock",
      duracao: 8000,
    },
    skill: {
      rotulo: "Habilidade",
      icone: '<i class="fa-solid fa-bolt"></i>',
      cor: "#4AFFB5",
      tag: "HABILIDADE",
      titulo: "HABILIDADE ADQUIRIDA",
      corpo: "Passo das Sombras Rank B. Custo: 12 MP.",
      stats: null,
      rodape: "STATUS",
      emissor: "Sistema",
      som: "notification",
      duracao: 8000,
    },
    nivel: {
      rotulo: "Level Up",
      icone: '<i class="fa-solid fa-angles-up"></i>',
      cor: "#FFD27A",
      tag: "LEVEL UP",
      titulo: "NÍVEL AUMENTADO",
      corpo: "Você ficou mais forte.",
      stats: [
        { rotulo: "Nível", valor: "2" },
        { rotulo: "Pontos livres", valor: "+5" },
      ],
      rodape: "STATUS",
      emissor: "Sistema",
      som: "coin",
      duracao: 10000,
    },
    constelacao: {
      rotulo: "Constelação",
      icone: '<i class="fa-solid fa-star"></i>',
      cor: "#D6B3FF",
      tag: "MENSAGEM INDIRETA",
      titulo: "UMA CONSTELAÇÃO OBSERVA",
      corpo: "A constelação aguarda o próximo movimento da encarnação.",
      stats: null,
      rodape: "CANAL CELESTIAL",
      emissor: "Constelação sem nome",
      som: "notification",
      duracao: 9000,
    },
  };

  /* ---------- ENVIO RÁPIDO (opcional, sem console) ----------
     Deixe null para abrir o Console. Ou preencha, ex.:
     { perfil: "aviso", corpo: "Chegou a hora." }              */
  const ENVIO_RAPIDO = null;

  /* ============================================================
     MOTOR · não precisa editar abaixo
     ============================================================ */

  const NS = "gondolin-sls";
  const KEY = "biblioteca";
  const SLS_KEY = "1.2";
  const DEBUG = false;

  const esc = (s) => foundry.utils.escapeHTML(String(s ?? ""));

  const rgba = (hex, a) => {
    const h = String(hex).replace("#", "");
    const full =
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  const varsDe = (cor) =>
    `--sls-accent:${cor};` +
    `--sls-accent-70:${rgba(cor, 0.7)};--sls-accent-55:${rgba(cor, 0.55)};` +
    `--sls-accent-40:${rgba(cor, 0.4)};--sls-accent-30:${rgba(cor, 0.3)};` +
    `--sls-accent-22:${rgba(cor, 0.22)};--sls-accent-15:${rgba(cor, 0.15)};` +
    `--sls-accent-12:${rgba(cor, 0.12)};--sls-accent-06:${rgba(cor, 0.06)};`;

  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

.sls-overlay{
  position:fixed;top:8%;left:50%;z-index:90;pointer-events:none;
  width:min(620px,92vw);transform:translateX(-50%);
  font-family:'Rajdhani','Segoe UI',sans-serif;
  animation:sls-in .5s cubic-bezier(.05,.7,.1,1) both,
            sls-out .6s ease-in calc(var(--sls-dur,7000ms) - .6s) forwards;
}
.sls-chat{padding:4px 2px;font-family:'Rajdhani','Segoe UI',sans-serif}

.sls-frame{
  --sls-void:#05070a;--sls-surface:#0f1620;--sls-surface-2:#131c28;
  --sls-outline:#3a4757;--sls-text:#e6f1ff;--sls-dim:#b8c5d8;
  --sls-mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Consolas,monospace;
  --sls-ui:'Rajdhani','Segoe UI',sans-serif;
  --sls-display:'Orbitron','Rajdhani',sans-serif;
  --sls-accent:#4abdff;
  position:relative;padding:1px;border-radius:2px;
  background:linear-gradient(180deg,var(--sls-accent) 0%,var(--sls-accent-55) 55%,var(--sls-accent-40) 100%);
  box-shadow:0 0 30px var(--sls-accent-22),0 0 6px var(--sls-accent-40),0 20px 55px rgba(0,0,0,.72);
}
.sls-panel{
  position:relative;overflow:hidden;border-radius:1px;
  padding:16px 20px 14px;color:var(--sls-text);font-family:var(--sls-ui);
  background:
    radial-gradient(120% 90% at 50% -18%,var(--sls-accent-22),transparent 62%),
    radial-gradient(110% 70% at 0% 112%,var(--sls-accent-15),transparent 58%),
    linear-gradient(168deg,rgba(26,36,50,.96) 0%,rgba(17,25,37,.97) 44%,rgba(9,13,22,.98) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    inset 0 0 40px rgba(0,0,0,.55),
    inset 0 0 26px var(--sls-accent-12);
  backdrop-filter:blur(14px) saturate(1.15);
  -webkit-backdrop-filter:blur(14px) saturate(1.15);
}
.sls-panel::before{
  content:'';position:absolute;inset:0;pointer-events:none;opacity:.75;
  background-image:linear-gradient(var(--sls-accent-06) 1px,transparent 1px),
                   linear-gradient(90deg,var(--sls-accent-06) 1px,transparent 1px);
  background-size:26px 26px;
  -webkit-mask-image:radial-gradient(130% 95% at 50% 0%,#000 0%,transparent 78%);
  mask-image:radial-gradient(130% 95% at 50% 0%,#000 0%,transparent 78%);
}
.sls-panel::after{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;z-index:4;
  background:linear-gradient(90deg,transparent 0%,var(--sls-accent) 22%,#ffffff 50%,var(--sls-accent) 78%,transparent 100%);
  box-shadow:0 0 14px var(--sls-accent);opacity:.92;
}
.sls-head{display:flex;align-items:center;gap:9px;position:relative;z-index:3}
.sls-ico{font-size:13px;color:var(--sls-accent);text-shadow:0 0 10px var(--sls-accent);display:inline-flex;align-items:center}
.sls-title{
  font-family:var(--sls-display);font-weight:800;font-size:13px;
  letter-spacing:.22em;text-transform:uppercase;color:var(--sls-accent);
  text-shadow:0 0 12px var(--sls-accent-55),0 0 3px var(--sls-accent);
  animation:sls-glitch .42s steps(2,end) 2;
}
.sls-tag{
  position:absolute;top:-9px;right:16px;z-index:7;line-height:1.5;
  font-family:var(--sls-ui);font-size:10px;font-weight:700;letter-spacing:.22em;
  text-transform:uppercase;color:var(--sls-accent);
  background:var(--sls-void);border:1px solid var(--sls-accent-40);border-radius:2px;
  padding:1px 7px;
  box-shadow:0 0 0 2px var(--sls-void),0 0 12px var(--sls-accent-22);
}
.sls-rule{
  position:relative;z-index:3;height:1px;margin:10px 0 12px;
  background:linear-gradient(90deg,var(--sls-accent) 0%,var(--sls-accent-55) 38%,var(--sls-accent-15) 78%,transparent 100%);
  box-shadow:0 0 6px var(--sls-accent-22);
}
.sls-body{
  position:relative;z-index:3;font-size:15px;font-weight:500;line-height:1.55;
  letter-spacing:.02em;color:#d9e8fa;text-shadow:0 0 10px rgba(74,189,255,.14);
}
.sls-stats{position:relative;z-index:3;display:grid;gap:5px;margin-top:13px}
.sls-stat{
  display:flex;justify-content:space-between;align-items:baseline;gap:14px;
  padding:6px 10px;border-left:2px solid var(--sls-accent);
  background:linear-gradient(90deg,var(--sls-accent-12),rgba(0,0,0,0) 85%);
}
.sls-stat span{
  font-size:12px;font-weight:600;letter-spacing:.20em;text-transform:uppercase;color:var(--sls-dim);
}
.sls-stat b{
  font-family:var(--sls-mono);font-weight:700;font-size:14px;
  font-variant-numeric:tabular-nums;color:var(--sls-accent);
  text-shadow:0 0 10px var(--sls-accent-40);
}
.sls-foot{
  position:relative;z-index:3;margin-top:13px;display:flex;align-items:center;gap:8px;
  font-family:var(--sls-mono);font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;
  color:var(--sls-dim);opacity:.72;
}
.sls-dot{width:5px;height:5px;background:var(--sls-accent);box-shadow:0 0 8px var(--sls-accent);transform:rotate(45deg)}
.sls-sweep{
  position:absolute;left:-10%;right:-10%;top:-35%;height:22%;pointer-events:none;z-index:6;opacity:0;
  mix-blend-mode:screen;
  background:linear-gradient(180deg,transparent,rgba(255,255,255,.34) 48%,var(--sls-accent-55) 50%,rgba(255,255,255,.34) 52%,transparent);
  animation:sls-sweep .85s cubic-bezier(.05,.7,.1,1) .1s 1 forwards;
}
.sls-scan{
  position:absolute;left:0;right:0;top:-25%;height:13%;pointer-events:none;z-index:2;opacity:0;
  background:linear-gradient(180deg,transparent,var(--sls-accent-06) 38%,var(--sls-accent-15) 50%,var(--sls-accent-06) 62%,transparent);
  animation:sls-ambient 9s ease-in-out 1.6s infinite;
}
.sls-c{
  position:absolute;width:14px;height:14px;pointer-events:none;z-index:5;opacity:.85;
  border:1.5px solid var(--sls-accent);
  filter:drop-shadow(0 0 4px var(--sls-accent-40));
}
.sls-c.tl{top:-3px;left:-3px;border-right:0;border-bottom:0}
.sls-c.tr{top:-3px;right:-3px;border-left:0;border-bottom:0}
.sls-c.bl{bottom:-3px;left:-3px;border-right:0;border-top:0}
.sls-c.br{bottom:-3px;right:-3px;border-left:0;border-top:0}

@keyframes sls-in{
  0%{opacity:0;transform:translateX(-50%) translateY(-10px) scale(.97);filter:blur(9px) brightness(1.7)}
  55%{opacity:1;filter:blur(0) brightness(1)}
  100%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
}
@keyframes sls-out{
  to{opacity:0;transform:translateX(-50%) translateY(-6px) scale(.99);filter:blur(5px);visibility:hidden}
}
@keyframes sls-sweep{0%{opacity:0;top:-35%}18%{opacity:.85}100%{opacity:0;top:120%}}
@keyframes sls-ambient{0%,100%{opacity:0;top:-25%}12%{opacity:.4}50%{opacity:.22;top:120%}51%{opacity:0;top:120%}}
@keyframes sls-glitch{
  0%{text-shadow:-2px 0 rgba(255,0,80,.85),2px 0 rgba(0,229,255,.85);transform:translateX(1px)}
  50%{text-shadow:2px 0 rgba(255,0,80,.6),-2px 0 rgba(0,229,255,.6);transform:translateX(-1px)}
  100%{text-shadow:0 0 12px var(--sls-accent-55);transform:none}
}

.chat-message:has(.sls-chat){background:none;border:0;box-shadow:none;padding:0}
.chat-message:has(.sls-chat) .message-header{display:none}
.chat-message:has(> .message-content > .sls-overlay){background:none;border:0;box-shadow:none;padding:0;margin:0}

@media (prefers-reduced-motion: reduce){
  .sls-sweep,.sls-scan{display:none}
  .sls-title{animation:none}
  .sls-overlay{animation:sls-appa .18s linear both,sls-out .18s linear calc(var(--sls-dur,7000ms) - .18s) forwards}
  .sls-panel{backdrop-filter:none;-webkit-backdrop-filter:none}
  @keyframes sls-appa{from{opacity:0}to{opacity:1}}
}
`;

  /* ---------- Biblioteca (persistência no mundo) ---------- */
  const registrarSetting = () => {
    try {
      if (!game.settings.settings.has(`${NS}.${KEY}`)) {
        game.settings.register(NS, KEY, {
          scope: "world",
          config: false,
          type: Object,
          default: {},
          name: "SLS · Biblioteca de Perfis",
        });
      }
    } catch (e) {
      /* já registrado */
    }
  };

  const biblioteca = () => {
    try {
      return game.settings.get(NS, KEY) ?? {};
    } catch (e) {
      return {};
    }
  };

  const salvarPerfil = async (nome, dados) => {
    const lib = { ...biblioteca() };
    lib[String(nome).toLowerCase().trim()] = dados;
    await game.settings.set(NS, KEY, lib);
    return lib;
  };

  const excluirPerfil = async (nome) => {
    const lib = { ...biblioteca() };
    delete lib[String(nome).toLowerCase().trim()];
    await game.settings.set(NS, KEY, lib);
    return lib;
  };

  const perfisTodos = () => ({ ...PERFIS, ...biblioteca() });

  const perfilDe = (id) => {
    const todos = perfisTodos();
    const base = todos[id] ?? PERFIS.sistema;
    const fallbackIcone =
      PERFIS[id]?.icone ?? '<i class="fa-solid fa-bell"></i>';
    const iconeValido =
      base.icone && base.icone !== "?" ? base.icone : fallbackIcone;

    return {
      rotulo: base.rotulo ?? id,
      icone: iconeValido,
      cor: base.cor ?? "#4fd8ff",
      tag: base.tag ?? "",
      titulo: base.titulo ?? "SISTEMA",
      corpo: base.corpo ?? "",
      stats: base.stats ?? null,
      rodape: base.rodape ?? "SISTEMA",
      emissor: base.emissor ?? base.rodape ?? "Sistema",
      som: base.som ?? "notification",
      duracao: base.duracao ?? 7000,
      speaker: base.speaker,
    };
  };

  /* ---------- Render ---------- */
  const frame = (p, o) => `
<div class="sls-frame" style="${varsDe(p.cor)}">
  <span class="sls-c tl"></span><span class="sls-c tr"></span>
  <span class="sls-c bl"></span><span class="sls-c br"></span>
  ${o.tag ? `<span class="sls-tag">${esc(o.tag)}</span>` : ""}
  <div class="sls-panel">
    <div class="sls-sweep"></div>
    <div class="sls-scan"></div>
    <div class="sls-head">
      <span class="sls-ico">${p.icone ?? '<i class="fa-solid fa-bell"></i>'}</span>
      <span class="sls-title">${esc(o.titulo)}</span>
    </div>
    <div class="sls-rule"></div>
    <div class="sls-origin"><i class="fa-solid fa-satellite-dish"></i><span>${esc(o.emissor ?? p.emissor ?? "Sistema")}</span></div>
    <div class="sls-body">${esc(o.corpo).replace(/\n/g, "<br>")}</div>
    ${
      o.stats?.length
        ? `<div class="sls-stats">${o.stats
            .map(
              (s) =>
                `<div class="sls-stat"><span>${esc(s.rotulo)}</span><b>${esc(s.valor)}</b></div>`,
            )
            .join("")}</div>`
        : ""
    }
    <div class="sls-foot"><span class="sls-dot"></span><span>${esc(o.rodape)}</span></div>
  </div>
</div>`;

  const montarConteudo = (p, o, modo) => {
    const dur = Number(o.duracao ?? p.duracao);
    const overlay =
      modo === "chat"
        ? ""
        : `<div class="sls-overlay" style="--sls-dur:${dur}ms">${frame(p, o)}</div>`;
    const chat =
      modo === "overlay" ? "" : `<div class="sls-chat">${frame(p, o)}</div>`;
    return `<style>${CSS}</style>${overlay}${chat}`;
  };

  const caminhoSom = (som) => {
    if (som === false || som == null) return null;
    const cfg = CONFIG.sounds ?? {};
    return (
      cfg[som] ??
      (typeof som === "string" && som.includes("/")
        ? som
        : (cfg.notification ?? null))
    );
  };

  /* ---------- Envio ---------- */
  const enviar = async (entrada) => {
    const t = performance.now();
    const o =
      typeof entrada === "string" ? { perfil: entrada } : { ...entrada };
    const p = perfilDe(o.perfil ?? "sistema");
    const modo = o.modo ?? "ambos";
    const corpo = o.corpo ?? p.corpo;
    const stats =
      typeof o.stats === "string" ? parseStats(o.stats) : (o.stats ?? p.stats);
    const dados = {
      titulo: o.titulo ?? p.titulo,
      corpo,
      tag: o.tag ?? p.tag,
      rodape: o.rodape ?? p.rodape,
      emissor: o.emissor ?? p.emissor,
      stats: stats?.length ? stats : null,
      duracao: Number(o.duracao ?? p.duracao),
    };
    const som = o.som === false ? null : caminhoSom(o.som ?? p.som);
    const soGM = (o.destino ?? "todos") === "gm";
    const destinatario = o.destino === "jogador" ? String(o.jogador ?? "") : "";
    if (o.destino === "jogador" && !game.users.get(destinatario)) {
      ui.notifications.warn(
        "SLS: selecione um jogador válido antes de enviar.",
      );
      return null;
    }
    const whisper = soGM
      ? ChatMessage.getWhisperRecipients("GM").map((u) => u.id)
      : destinatario && game.users.get(destinatario)
        ? [destinatario]
        : [];

    const msg = await ChatMessage.create({
      content: montarConteudo(p, dados, modo),
      speaker: { alias: o.speaker ?? p.speaker ?? p.emissor ?? "Sistema" },
      sound: som ?? undefined,
      whisper,
      flags: { [NS]: { sls: true, perfil: o.perfil ?? "sistema", modo } },
    });

    if (modo === "overlay" && !soGM && msg) {
      setTimeout(() => msg.delete().catch(() => {}), dados.duracao + 1200);
    }
    if (DEBUG)
      console.log(
        `[TANG-ROU] SLS enviado em ${(performance.now() - t).toFixed(2)}ms · modo=${modo}`,
      );
    return msg;
  };

  const parseStats = (texto) => {
    const linhas = String(texto ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const out = linhas
      .map((l) => {
        const [rotulo, ...resto] = l.split(":");
        return { rotulo: rotulo?.trim() ?? "", valor: resto.join(":").trim() };
      })
      .filter((s) => s.rotulo);
    return out.length ? out : null;
  };

  const statsParaTexto = (stats) =>
    (stats ?? []).map((s) => `${s.rotulo}: ${s.valor}`).join("\n");

  const usuariosParaSelect = () =>
    Array.from(game.users ?? [])
      .map(
        (u) =>
          `<option value="${esc(u.id)}">${esc(u.name)}${u.isGM ? " · GM" : ""}</option>`,
      )
      .join("");

  /* ---------- Console de Mensagens ---------- */
  const injetarEstilosDialogo = () => {
    const id = `${NS}-dialog-styles`;
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }
    style.textContent = UI_CSS;
  };

  const UI_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Rajdhani:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

.sls-console {
  --sls-accent:#4ABDFF;
  --sls-accent-70:rgba(74,189,255,.7);--sls-accent-55:rgba(74,189,255,.55);
  --sls-accent-40:rgba(74,189,255,.4);--sls-accent-30:rgba(74,189,255,.3);
  --sls-accent-22:rgba(74,189,255,.22);--sls-accent-15:rgba(74,189,255,.15);
  --sls-accent-12:rgba(74,189,255,.12);--sls-accent-06:rgba(74,189,255,.06);
  --sls-void:#05070a;--sls-surface:#0f1620;--sls-surface-2:#131c28;
  --sls-outline:#3a4757;--sls-text:#e6f1ff;--sls-dim:#b8c5d8;
  --sls-mono:'JetBrains Mono',ui-monospace,Consolas,monospace;
  --sls-ui:'Rajdhani','Segoe UI',sans-serif;
  --sls-display:'Orbitron','Rajdhani',sans-serif;

  max-height: calc(100vh - 120px) !important;
  max-width: min(680px, 95vw) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  border: 1px solid var(--sls-accent-40) !important;
  box-shadow: 0 0 30px rgba(0,0,0,.8), 0 0 15px var(--sls-accent-22) !important;
  border-radius: 4px !important;
  z-index: 85 !important;
}

.sls-ui{font-family:var(--sls-ui);color:var(--sls-text)}

.sls-console .window-content{
  background:var(--sls-void) !important;
  color:var(--sls-text) !important;
  font-family:var(--sls-ui) !important;
  border:0 !important;
  padding:0 !important;
  display:flex !important;
  flex-direction:column !important;
  flex:1 1 auto !important;
  min-height:0 !important;
  overflow-y:auto !important;
  overflow-x:hidden !important;
}

.sls-console .window-content::-webkit-scrollbar {
  width: 6px;
}
.sls-console .window-content::-webkit-scrollbar-track {
  background: rgba(5, 9, 16, 0.9);
}
.sls-console .window-content::-webkit-scrollbar-thumb {
  background: var(--sls-accent-40);
  border-radius: 3px;
}
.sls-console .window-content::-webkit-scrollbar-thumb:hover {
  background: var(--sls-accent);
}

.sls-console .standard-form{
  display:flex !important;
  flex-direction:column !important;
  flex:1 1 auto !important;
  min-height:0 !important;
  overflow:hidden !important;
  padding:0 !important;
  margin:0 !important;
}

.sls-console .dialog-content{
  flex:1 1 auto !important;
  min-height:0 !important;
  overflow-y:auto !important;
  overflow-x:hidden !important;
  padding:4px 6px !important;
  margin:0 !important;
}

.sls-console .window-header{
  background:linear-gradient(90deg,var(--sls-surface-2),var(--sls-surface));
  border-bottom:1px solid var(--sls-outline);color:var(--sls-accent);
  font-family:var(--sls-display);text-transform:uppercase;letter-spacing:.16em;font-size:12px;
  flex-shrink:0 !important;
}
.sls-console .window-header .window-title{text-shadow:0 0 10px var(--sls-accent-40)}
.sls-console .window-header .header-control{color:var(--sls-dim)}
.sls-console .window-header .header-control:hover{color:var(--sls-accent);text-shadow:0 0 8px var(--sls-accent-40)}

.sls-ui-shell{
  position:relative;margin:6px 6px 8px;padding:1px;border-radius:2px;
  background:linear-gradient(180deg,var(--sls-accent) 0%,var(--sls-accent-55) 55%,var(--sls-accent-40) 100%);
  box-shadow:0 0 20px var(--sls-accent-22),0 0 5px var(--sls-accent-30),0 12px 30px rgba(0,0,0,.7);
}
.sls-ui-c{
  position:absolute;width:12px;height:12px;pointer-events:none;z-index:5;opacity:.85;
  border:1.5px solid var(--sls-accent);filter:drop-shadow(0 0 4px var(--sls-accent-40));
}
.sls-ui-c.tl{top:-3px;left:-3px;border-right:0;border-bottom:0}
.sls-ui-c.tr{top:-3px;right:-3px;border-left:0;border-bottom:0}
.sls-ui-c.bl{bottom:-3px;left:-3px;border-right:0;border-top:0}
.sls-ui-c.br{bottom:-3px;right:-3px;border-left:0;border-top:0}

.sls-ui-panel{
  position:relative;overflow:hidden;border-radius:1px;padding:12px 14px 10px;
  background:
    radial-gradient(120% 90% at 50% -18%,var(--sls-accent-22),transparent 62%),
    radial-gradient(110% 70% at 0% 112%,var(--sls-accent-15),transparent 58%),
    linear-gradient(168deg,rgba(26,36,50,.96) 0%,rgba(17,25,37,.97) 44%,rgba(9,13,22,.98) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.06),
    inset 0 0 40px rgba(0,0,0,.55),
    inset 0 0 26px var(--sls-accent-12);
  backdrop-filter:blur(14px) saturate(1.15);
  -webkit-backdrop-filter:blur(14px) saturate(1.15);
}
.sls-ui-panel::before{
  content:'';position:absolute;inset:0;pointer-events:none;opacity:.75;
  background-image:linear-gradient(var(--sls-accent-06) 1px,transparent 1px),
                   linear-gradient(90deg,var(--sls-accent-06) 1px,transparent 1px);
  background-size:24px 24px;
  -webkit-mask-image:radial-gradient(130% 95% at 50% 0%,#000 0%,transparent 78%);
  mask-image:radial-gradient(130% 95% at 50% 0%,#000 0%,transparent 78%);
}
.sls-ui-panel::after{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;z-index:4;
  background:linear-gradient(90deg,transparent 0%,var(--sls-accent) 22%,#ffffff 50%,var(--sls-accent) 78%,transparent 100%);
  box-shadow:0 0 12px var(--sls-accent);opacity:.92;
}

.sls-ui-head{display:flex;align-items:center;gap:8px;position:relative;z-index:3;margin-bottom:2px}
.sls-ui-ico{font-size:13px;color:var(--sls-accent);text-shadow:0 0 10px var(--sls-accent);display:inline-flex;align-items:center}
.sls-ui-title{font-family:var(--sls-display);font-weight:800;font-size:12.5px;letter-spacing:.20em;text-transform:uppercase;color:var(--sls-accent);text-shadow:0 0 12px var(--sls-accent-55)}
.sls-ui-id{margin-left:auto;font-family:var(--sls-mono);font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--sls-dim);opacity:.7}

.sls-ui-rule{position:relative;z-index:3;height:1px;margin:8px 0 10px;background:linear-gradient(90deg,var(--sls-accent) 0%,var(--sls-accent-55) 38%,var(--sls-accent-15) 78%,transparent 100%);box-shadow:0 0 6px var(--sls-accent-22)}

.sls-ui-body{position:relative;z-index:3}

.sls-ui label{display:block;font-family:var(--sls-ui);font-size:9.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--sls-dim);margin-bottom:2px}
.sls-ui .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 10px}
.sls-ui .full{grid-column:1/-1}
.sls-ui input,.sls-ui select,.sls-ui textarea{
  width:100%;background:rgba(5,9,16,.85);border:1px solid var(--sls-outline);
  color:var(--sls-text);padding:5px 8px;font-family:var(--sls-ui);font-size:13px;border-radius:1px;
  box-shadow:inset 0 0 10px rgba(0,0,0,.45);transition:border-color .12s,box-shadow .12s;box-sizing:border-box;
}
.sls-ui input:focus,.sls-ui select:focus,.sls-ui textarea:focus{
  outline:0;border-color:var(--sls-accent);box-shadow:0 0 10px var(--sls-accent-22),inset 0 0 8px rgba(0,0,0,.35);
}
.sls-ui textarea{resize:vertical;min-height:38px}

.sls-ui .chips{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 10px}
.sls-ui .chip{
  border:1px solid color-mix(in srgb,var(--chip) 45%,transparent);
  background:rgba(8,18,38,.75);color:var(--chip);
  font-family:var(--sls-ui);font-weight:700;font-size:11px;letter-spacing:.12em;text-transform:uppercase;
  padding:4px 9px;cursor:pointer;border-radius:1px;box-shadow:inset 0 0 10px rgba(0,0,0,.35);transition:.12s;
  display:inline-flex;align-items:center;gap:6px;
}
.sls-ui .chip:hover,.sls-ui .chip.active{
  background:var(--chip);color:#04101f;
  box-shadow:0 0 14px color-mix(in srgb,var(--chip) 60%,transparent),inset 0 0 8px rgba(255,255,255,.15);
  border-color:var(--chip);
}

.sls-ui .prev{margin:0 0 10px;padding:8px 10px;background:var(--sls-void);border:1px solid var(--sls-outline);border-radius:1px;box-shadow:inset 0 0 20px rgba(0,0,0,.55)}
.sls-ui .prev .sls-chat{transform-origin:top center}
.sls-ui .prev .sls-overlay,.sls-ui .prev .sls-sweep,.sls-ui .prev .sls-scan,.sls-ui .prev .sls-title{animation:none}
.sls-ui .prev .sls-frame{position:relative;padding:1px;border-radius:2px;background:linear-gradient(180deg,var(--sls-accent) 0%,var(--sls-accent-55) 55%,var(--sls-accent-40) 100%);box-shadow:0 0 20px var(--sls-accent-22),0 0 5px var(--sls-accent-40),0 12px 35px rgba(0,0,0,.7)}
.sls-ui .prev .sls-panel{position:relative;overflow:hidden;border-radius:1px;padding:10px 14px 8px;color:var(--sls-text);background:radial-gradient(120% 90% at 50% -18%,var(--sls-accent-22),transparent 62%),radial-gradient(110% 70% at 0% 112%,var(--sls-accent-15),transparent 58%),linear-gradient(168deg,rgba(26,36,50,.96) 0%,rgba(17,25,37,.97) 44%,rgba(9,13,22,.98) 100%);box-shadow:inset 0 1px 0 rgba(255,255,255,.06),inset 0 0 30px rgba(0,0,0,.55),inset 0 0 20px var(--sls-accent-12)}
.sls-ui .prev .sls-head{display:flex;align-items:center;gap:8px;position:relative;z-index:3}
.sls-ui .prev .sls-ico{font-size:13px;color:var(--sls-accent);text-shadow:0 0 10px var(--sls-accent);display:inline-flex;align-items:center}
.sls-ui .prev .sls-title{font-family:var(--sls-display);font-weight:800;font-size:12.5px;letter-spacing:.20em;text-transform:uppercase;color:var(--sls-accent);text-shadow:0 0 12px var(--sls-accent-55)}
.sls-ui .prev .sls-rule{position:relative;z-index:3;height:1px;margin:6px 0 8px;background:linear-gradient(90deg,var(--sls-accent) 0%,var(--sls-accent-55) 38%,var(--sls-accent-15) 78%,transparent 100%);box-shadow:0 0 6px var(--sls-accent-22)}
.sls-origin{position:relative;z-index:3;display:flex;align-items:center;gap:7px;margin:-4px 0 8px;font-family:var(--sls-mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--sls-accent);opacity:.86}
.sls-origin i{font-size:10px}
.sls-ui .prev .sls-body{position:relative;z-index:3;font-size:13.5px;font-weight:500;line-height:1.45;letter-spacing:.02em;color:#d9e8fa}
.sls-ui .prev .sls-origin{position:relative;z-index:3;display:flex;align-items:center;gap:7px;margin:-4px 0 8px;font-family:var(--sls-mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--sls-accent);opacity:.86}
.sls-ui .prev .sls-stats{position:relative;z-index:3;display:grid;gap:4px;margin-top:8px}
.sls-ui .prev .sls-stat{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:4px 8px;border-left:2px solid var(--sls-accent);background:linear-gradient(90deg,var(--sls-accent-12),rgba(0,0,0,0) 85%)}
.sls-ui .prev .sls-stat span{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--sls-dim)}
.sls-ui .prev .sls-stat b{font-family:var(--sls-mono);font-weight:700;font-size:13px;font-variant-numeric:tabular-nums;color:var(--sls-accent);text-shadow:0 0 8px var(--sls-accent-40)}
.sls-ui .prev .sls-foot{position:relative;z-index:3;margin-top:8px;display:flex;align-items:center;gap:6px;font-family:var(--sls-mono);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--sls-dim);opacity:.72}
.sls-ui .prev .sls-dot{width:5px;height:5px;background:var(--sls-accent);box-shadow:0 0 8px var(--sls-accent);transform:rotate(45deg)}
.sls-ui .prev .sls-c{position:absolute;width:12px;height:12px;pointer-events:none;z-index:5;opacity:.85;border:1.5px solid var(--sls-accent);filter:drop-shadow(0 0 4px var(--sls-accent-40))}
.sls-ui .prev .sls-c.tl{top:-3px;left:-3px;border-right:0;border-bottom:0}
.sls-ui .prev .sls-c.tr{top:-3px;right:-3px;border-left:0;border-bottom:0}
.sls-ui .prev .sls-c.bl{bottom:-3px;left:-3px;border-right:0;border-top:0}
.sls-ui .prev .sls-c.br{bottom:-3px;right:-3px;border-left:0;border-top:0}

/* Barra de Ações Integrada (Display Flex) */
.sls-ui .tools{
  display:flex !important;
  flex-direction:row !important;
  flex-wrap:wrap !important;
  gap:8px !important;
  align-items:center !important;
  margin-top:10px !important;
  padding-top:8px !important;
  border-top:1px dashed var(--sls-outline) !important;
}

.sls-ui .btn-sls{
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  gap:6px !important;
  border:1px solid var(--sls-accent-40) !important;
  background:rgba(10,22,44,.85) !important;
  color:#bfe3ff !important;
  font-family:var(--sls-ui) !important;
  font-weight:700 !important;
  font-size:11.5px !important;
  letter-spacing:.12em !important;
  text-transform:uppercase !important;
  padding:5px 12px !important;
  cursor:pointer !important;
  border-radius:1px !important;
  box-shadow:inset 0 0 10px rgba(0,0,0,.35) !important;
  transition:all .15s ease !important;
}
.sls-ui .btn-sls:hover{
  border-color:var(--sls-accent) !important;
  color:var(--sls-accent) !important;
  box-shadow:0 0 12px var(--sls-accent-22),inset 0 0 12px rgba(0,0,0,.35) !important;
  transform:translateY(-1px);
}
.sls-ui .btn-sls.btn-enviar{
  background:linear-gradient(135deg,rgba(74,189,255,.28) 0%,rgba(20,80,140,.5) 100%) !important;
  border-color:var(--sls-accent) !important;
  color:#ffffff !important;
  box-shadow:0 0 12px var(--sls-accent-30) !important;
  text-shadow:0 0 8px var(--sls-accent-55) !important;
}
.sls-ui .btn-sls.btn-enviar:hover{
  background:linear-gradient(135deg,rgba(74,189,255,.45) 0%,rgba(30,110,180,.7) 100%) !important;
  box-shadow:0 0 18px var(--sls-accent-55) !important;
}

.sls-ui .chk{display:flex;align-items:center;gap:7px;font-size:12px;letter-spacing:.08em;color:var(--sls-dim)}
.sls-ui .chk input{width:auto;margin:0;cursor:pointer}

/* Footer e Botões do Dialog - DISPLAY FLEX OBRIGATÓRIO */
.sls-console .form-footer,
.sls-console footer.form-footer,
.sls-console footer,
.sls-console .dialog-buttons{
  display:flex !important;
  flex-direction:row !important;
  align-items:center !important;
  justify-content:flex-end !important;
  gap:10px !important;
  padding:8px 12px 10px !important;
  margin:0 !important;
  border:0 !important;
  border-top:1px solid var(--sls-accent-30) !important;
  background:rgba(5,7,10,.98) !important;
  box-shadow:0 -4px 14px rgba(0,0,0,.6) !important;
  flex-shrink:0 !important;
}

.sls-console .form-footer button,
.sls-console footer button,
.sls-console .dialog-button{
  display:inline-flex !important;
  align-items:center !important;
  justify-content:center !important;
  gap:8px !important;
  flex:1 !important;
  max-width:none !important;
  height:36px !important;
  background:var(--sls-surface) !important;
  color:var(--sls-text) !important;
  border:1px solid var(--sls-outline) !important;
  font-family:var(--sls-display) !important;
  font-weight:700 !important;
  font-size:11.5px !important;
  letter-spacing:.14em !important;
  text-transform:uppercase !important;
  padding:0 14px !important;
  border-radius:2px !important;
  cursor:pointer !important;
  box-shadow:inset 0 0 14px rgba(0,0,0,.4) !important;
  transition:all .15s ease !important;
}

.sls-console .form-footer button:hover,
.sls-console footer button:hover,
.sls-console .dialog-button:hover{
  border-color:var(--sls-accent) !important;
  color:var(--sls-accent) !important;
  box-shadow:inset 0 0 18px var(--sls-accent-12),0 0 12px var(--sls-accent-22) !important;
}

.sls-console button[data-action="enviar"],
.sls-console button.default{
  background:linear-gradient(135deg,rgba(74,189,255,.28) 0%,rgba(20,80,140,.5) 100%) !important;
  border-color:var(--sls-accent) !important;
  color:#ffffff !important;
  box-shadow:0 0 14px var(--sls-accent-30),inset 0 0 10px var(--sls-accent-22) !important;
  text-shadow:0 0 8px var(--sls-accent-55) !important;
}

.sls-console button[data-action="enviar"]:hover,
.sls-console button.default:hover{
  background:linear-gradient(135deg,rgba(74,189,255,.45) 0%,rgba(30,110,180,.7) 100%) !important;
  box-shadow:0 0 22px var(--sls-accent-55),inset 0 0 14px var(--sls-accent-40) !important;
  color:#ffffff !important;
  transform:translateY(-1px);
}

.sls-console button[data-action="fechar"]{
  background:rgba(15,22,32,.7) !important;
  border-color:var(--sls-outline) !important;
  color:var(--sls-dim) !important;
}

.sls-console button[data-action="fechar"]:hover{
  border-color:#ff4a6b !important;
  color:#ff859b !important;
  box-shadow:0 0 12px rgba(255,74,107,.3) !important;
  transform:translateY(-1px);
}

@media (prefers-reduced-motion:reduce){
  .sls-ui .chip,.sls-ui .btn-sls,.sls-console .dialog-button{transition:none}
  .sls-ui-panel{backdrop-filter:none;-webkit-backdrop-filter:none}
}
`;

  const UI_HTML = () => {
    const todos = perfisTodos();
    const primeiro = todos.sistema ?? Object.values(todos)[0];
    const chips = Object.entries(todos)
      .map(
        ([k, p]) =>
          `<button type="button" class="chip" data-perfil="${esc(k)}" style="--chip:${esc(p.cor ?? "#4ABDFF")}">${perfilDe(k).icone} ${esc(p.rotulo ?? k)}</button>`,
      )
      .join("");

    return `
<div class="sls-ui">
  <div class="sls-ui-shell">
    <span class="sls-ui-c tl"></span><span class="sls-ui-c tr"></span>
    <span class="sls-ui-c bl"></span><span class="sls-ui-c br"></span>
    <div class="sls-ui-panel">
      <div class="sls-ui-head">
        <span class="sls-ui-ico"><i class="fa-solid fa-satellite-dish"></i></span>
        <span class="sls-ui-title">CONSOLE DE MENSAGENS</span>
        <span class="sls-ui-id">SLS v${SLS_KEY}</span>
      </div>
      <div class="sls-ui-rule"></div>
      <div class="sls-ui-body">
        <div class="chips" data-el="chips">${chips}</div>
        <div class="prev" data-el="prev"></div>
        <div class="grid">
          <div class="full"><label>Título</label><input data-f="titulo" value="${esc(primeiro.titulo ?? "SISTEMA")}"></div>
          <div class="full"><label>Mensagem</label><textarea data-f="corpo" rows="2">${esc(primeiro.corpo ?? "")}</textarea></div>
          <div><label>Tag (canto)</label><input data-f="tag" value="${esc(primeiro.tag ?? "")}"></div>
          <div><label>Rodapé</label><input data-f="rodape" value="${esc(primeiro.rodape ?? "SISTEMA")}"></div>
          <div class="full"><label>Emissor / Constelação</label><input data-f="emissor" value="${esc(primeiro.emissor ?? "Sistema")}" placeholder="Ex.: A Constelação do Lobo Branco"></div>
          <div class="full"><label>Stats (uma por linha "Rótulo: valor")</label><textarea data-f="stats" rows="2">${esc(statsParaTexto(primeiro.stats))}</textarea></div>
          <div><label>Destino</label>
            <select data-f="destino"><option value="todos">Todos os players</option><option value="gm">Só GM</option><option value="jogador">Jogador específico</option></select>
          </div>
          <div><label>Jogador</label>
            <select data-f="jogador" class="sls-recipient-player"><option value="">Selecione um jogador</option>${usuariosParaSelect()}</select>
          </div>
          <div><label>Exibição</label>
            <select data-f="modo">
              <option value="ambos">Overlay + Chat</option>
              <option value="overlay">Só overlay</option>
              <option value="chat">Só chat</option>
            </select>
          </div>
          <div><label>Duração (ms)</label><input type="number" step="500" min="1500" data-f="duracao" value="${esc(primeiro.duracao ?? 7000)}"></div>
          <div><label>Nome do perfil</label><input data-f="nome" placeholder="meu-perfil"></div>
          <div class="full chk"><input type="checkbox" data-f="som" checked><span>Tocar som</span></div>
        </div>
        <div class="tools">
          <button type="button" class="btn-sls btn-testar" data-acao="testar">
            <i class="fa-solid fa-eye"></i> Testar (só GM)
          </button>
          <button type="button" class="btn-sls btn-salvar" data-acao="salvar">
            <i class="fa-solid fa-floppy-disk"></i> Salvar perfil
          </button>
          <button type="button" class="btn-sls btn-novo" data-acao="novo"><i class="fa-solid fa-plus"></i> Novo</button>
          <button type="button" class="btn-sls btn-excluir" data-acao="excluir"><i class="fa-solid fa-trash"></i> Excluir</button>
          <span data-el="status" style="font-size:12px;letter-spacing:.08em;color:var(--sls-dim);margin-left:auto"></span>
        </div>
      </div>
    </div>
  </div>
</div>`;
  };

  const abrirConsole = () => {
    const DialogV2 = foundry.applications?.api?.DialogV2;
    if (!DialogV2)
      return ui.notifications.error(
        "SLS: DialogV2 indisponível (Foundry v12+).",
      );

    injetarEstilosDialogo();

    let perfilAtivo = "sistema";
    let root = null;

    const ler = () => {
      const q = (f) => root.querySelector(`[data-f="${f}"]`);
      return {
        perfil: perfilAtivo,
        titulo: q("titulo").value,
        corpo: q("corpo").value,
        tag: q("tag").value,
        rodape: q("rodape").value,
        emissor: q("emissor").value,
        stats: q("stats").value,
        destino: q("destino").value,
        jogador: q("jogador").value,
        modo: q("modo").value,
        duracao: Number(q("duracao").value) || 7000,
        som: q("som").checked,
      };
    };

    const pintarPreview = () => {
      const d = ler();
      const p = perfilDe(perfilAtivo);
      const stats = parseStats(d.stats) ?? p.stats;
      root.querySelector('[data-el="prev"]').innerHTML =
        `<div class="sls-chat">${frame(p, {
          titulo: d.titulo || p.titulo,
          corpo: d.corpo || "",
          tag: d.tag,
          rodape: d.rodape || p.rodape,
          emissor: d.emissor || p.emissor,
          stats: stats?.length ? stats : null,
        })}</div>`;
      root.style.setProperty("--c", p.cor);
    };

    const carregarPerfil = (id) => {
      perfilAtivo = id;
      const p = perfilDe(id);
      root
        .querySelectorAll(".chip")
        .forEach((c) => c.classList.toggle("active", c.dataset.perfil === id));
      root.querySelector('[data-f="titulo"]').value = p.titulo ?? "";
      root.querySelector('[data-f="corpo"]').value = p.corpo ?? "";
      root.querySelector('[data-f="tag"]').value = p.tag ?? "";
      root.querySelector('[data-f="rodape"]').value = p.rodape ?? "";
      root.querySelector('[data-f="emissor"]').value = p.emissor ?? "Sistema";
      root.querySelector('[data-f="stats"]').value = statsParaTexto(p.stats);
      root.querySelector('[data-f="duracao"]').value = p.duracao ?? 7000;
      root.querySelector('[data-f="nome"]').value = id;
      root.querySelector('[data-f="destino"]').value = "todos";
      root.querySelector('[data-f="jogador"]').value = "";
      atualizarDestinatario();
      pintarPreview();
    };

    const atualizarDestinatario = () => {
      const select = root.querySelector('[data-f="jogador"]');
      const ativo =
        root.querySelector('[data-f="destino"]').value === "jogador";
      select.disabled = !ativo;
      select.style.opacity = ativo ? "1" : ".45";
    };

    const ligar = () => {
      root
        .querySelector('[data-el="chips"]')
        .addEventListener("click", (ev) => {
          const chip = ev.target.closest(".chip");
          if (chip) carregarPerfil(chip.dataset.perfil);
        });

      root.querySelectorAll("[data-f]").forEach((el) => {
        el.addEventListener("input", pintarPreview);
        el.addEventListener("change", pintarPreview);
      });
      root
        .querySelector('[data-f="destino"]')
        .addEventListener("change", atualizarDestinatario);

      root
        .querySelector('[data-acao="testar"]')
        .addEventListener("click", async () => {
          const d = { ...ler(), destino: "gm" };
          await enviar(d);
          const st = root.querySelector('[data-el="status"]');
          if (st) {
            st.textContent = "enviado só para o GM";
            st.style.color = "var(--sls-dim)";
          }
        });

      root
        .querySelector('[data-acao="salvar"]')
        .addEventListener("click", async () => {
          const d = ler();
          const nome = (
            root.querySelector('[data-f="nome"]').value || ""
          ).trim();
          if (!nome) return ui.notifications.warn("SLS: dê um nome ao perfil.");
          const p = perfilDe(perfilAtivo);
          await salvarPerfil(nome, {
            rotulo: p.rotulo,
            icone: p.icone,
            cor: p.cor,
            titulo: d.titulo,
            corpo: d.corpo,
            tag: d.tag,
            rodape: d.rodape,
            emissor: d.emissor,
            stats: parseStats(d.stats),
            som: p.som,
            duracao: d.duracao,
          });
          const st = root.querySelector('[data-el="status"]');
          if (st) {
            st.textContent = `perfil "${nome}" salvo no mundo`;
            st.style.color = "var(--sls-accent)";
          }
        });

      root.querySelector('[data-acao="novo"]').addEventListener("click", () => {
        perfilAtivo = "sistema";
        ["titulo", "corpo", "tag", "rodape", "emissor", "stats"].forEach(
          (f) => {
            const el = root.querySelector(`[data-f="${f}"]`);
            el.value = f === "emissor" ? "Sistema" : "";
          },
        );
        root.querySelector('[data-f="nome"]').value = "";
        pintarPreview();
      });

      root
        .querySelector('[data-acao="excluir"]')
        .addEventListener("click", async () => {
          const nome = root
            .querySelector('[data-f="nome"]')
            .value.trim()
            .toLowerCase();
          if (!nome || PERFIS[nome])
            return ui.notifications.warn(
              "SLS: só perfis personalizados podem ser excluídos.",
            );
          await excluirPerfil(nome);
          root.querySelector('[data-el="status"]').textContent =
            `perfil "${nome}" excluído`;
          carregarPerfil("sistema");
        });

      carregarPerfil("sistema");
    };

    const dlg = new DialogV2({
      classes: ["sls-console"],
      window: {
        title: "SISTEMA · Console de Mensagens",
        icon: "fa-solid fa-satellite-dish",
        resizable: true,
      },
      position: {
        width: 680,
        height: "auto",
        top: Math.max(20, Math.floor((window.innerHeight - 660) / 2)),
      },
      modal: false,
      content: UI_HTML(),
      buttons: [
        {
          action: "enviar",
          label: "Enviar",
          icon: "fa-solid fa-paper-plane",
          default: true,
          callback: async () => {
            await enviar(ler());
          },
        },
        { action: "fechar", label: "Fechar", icon: "fa-solid fa-xmark" },
      ],
    });

    dlg.render({ force: true }).then((app) => {
      root = app.element;
      root.classList.add("sls-console");
      ligar();
      if (DEBUG)
        console.log(
          `[TANG-ROU] SLS console aberto em ${(performance.now() - t0).toFixed(2)}ms`,
        );
    });
  };

  /* ---------- API pública ---------- */
  registrarSetting();

  window.SLS = {
    __v: SLS_KEY,
    perfis: PERFIS,
    send: (a, b) =>
      enviar(
        typeof a === "string" && b === undefined
          ? { perfil: a }
          : typeof a === "string"
            ? { perfil: a, corpo: b }
            : a,
      ),
    abrir: abrirConsole,
    biblioteca,
    salvarPerfil,
  };

  if (ENVIO_RAPIDO) await enviar(ENVIO_RAPIDO);
  else abrirConsole();

  if (DEBUG) console.log(`[TANG-ROU] ${(performance.now() - t0).toFixed(2)}ms`);
})();
