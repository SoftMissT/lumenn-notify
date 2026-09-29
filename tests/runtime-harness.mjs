import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let failed = 0;
const ok = (name) => console.log(`  ✓ ${name}`);
const bad = (name, why) => {
  failed += 1;
  console.error(`  ✗ ${name}\n    ${why}`);
};

const hooks = { list: {} };
const settings = new Map();
const createdMessages = [];

const userList = [
  { id: "gm-1", name: "GM", isGM: true },
  { id: "p1", name: "Jogador 1", isGM: false },
  { id: "p2", name: "Jogador 2", isGM: false },
];

globalThis.game = {
  user: { id: "gm-1", isGM: true },
  users: new Proxy(userList, {
    get(target, prop) {
      if (prop === "get") return (id) => target.find((u) => u.id === id);
      return Reflect.get(target, prop);
    },
  }),
  settings: {
    settings: { has: (key) => settings.has(key) },
    register: (ns, key, config) => settings.set(`${ns}.${key}`, config.default),
    get: (ns, key) => settings.get(`${ns}.${key}`),
    set: (ns, key, value) => settings.set(`${ns}.${key}`, value),
  },
};

globalThis.foundry = {
  utils: {
    deepClone: (v) => JSON.parse(JSON.stringify(v)),
    randomID: (n = 8) => "r" + Math.random().toString(36).slice(2, 2 + n),
    escapeHTML: (s) =>
      String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    saveDataToFile: () => {},
  },
  applications: {
    api: {
      ApplicationV2: class {},
      DialogV2: {
        confirm: async () => true,
      },
    },
  },
};

globalThis.Hooks = {
  once: (name, fn) => {
    hooks.list[name] = fn;
  },
  on: (name, fn) => {
    hooks.list[name] = hooks.list[name] ?? [];
    if (typeof hooks.list[name] === "function") hooks.list[name] = [hooks.list[name]];
    hooks.list[name].push(fn);
  },
};

globalThis.window = globalThis;

const overlayBodies = [];
globalThis.document = {
  createElement: () => {
    const el = {
      className: "",
      dataset: {},
      innerHTML: "",
      listeners: {},
      addEventListener: (name, fn) => {
        el.listeners[name] = fn;
      },
      remove: () => {
        el.removed = true;
      },
    };
    return el;
  },
  body: {
    appendChild: (el) => {
      overlayBodies.push(el);
    },
    querySelectorAll: () => [],
  },
};
globalThis.matchMedia = () => ({ matches: false });
globalThis.CONFIG = { sounds: { notification: "sounds/notify.ogg" } };
globalThis.foundry.audio = { AudioHelper: { play: () => {} } };

globalThis.ui = {
  notifications: {
    warn: (m) => undefined,
    info: (m) => undefined,
    error: (m) => undefined,
  },
};

globalThis.ChatMessage = {
  getWhisperRecipients: (who) => (who === "GM" ? [globalThis.game.users[0]] : []),
  create: async (data) => {
    const msg = { ...data, id: "msg-" + createdMessages.length, getFlag: () => undefined };
    createdMessages.push(msg);
    return msg;
  },
};

console.log("Lumenn Notify · runtime harness");

console.log("\n[boot do módulo]");
await import(pathToFileURL(join(ROOT, "scripts", "lumenn-notify.js")).href);

if (hooks.list.init) {
  hooks.list.init();
  ok("hook init disparado");
} else bad("hook init registrado", "não registrado");

if (hooks.list.ready) {
  await hooks.list.ready();
  ok("hook ready disparado");
} else bad("hook ready registrado", "não registrado");

if (globalThis.game.lumennNotify?.openManager) ok("game.lumennNotify exposto");
else bad("game.lumennNotify exposto", "api ausente após ready");

console.log("\n[presets nativos]");
const profiles = globalThis.game.lumennNotify.getProfiles();
const builtinIds = ["system", "quest", "alert", "danger", "skill", "levelup", "constellation"];
for (const id of builtinIds) {
  if (profiles[id]?.builtin) ok(`preset nativo ${id}`);
  else bad(`preset nativo ${id}`, "ausente ou não marcado builtin");
}

console.log("\n[CRUD custom]");
const saved = await globalThis.game.lumennNotify.saveProfile({
  id: "custom-1",
  name: "Mesa Secreta",
  type: "custom",
  theme: "orv",
  body: "A constelação observa.",
});
if (saved && saved.id === "custom-1") ok("saveProfile persiste");
else bad("saveProfile persiste", JSON.stringify(saved));

const found = globalThis.game.lumennNotify.getProfile("custom-1");
if (found?.name === "Mesa Secreta") ok("getProfile lê custom");
else bad("getProfile lê custom", JSON.stringify(found));

const nativeDelete = await globalThis.game.lumennNotify.deleteProfile("system");
if (nativeDelete === undefined) ok("deleteProfile bloqueia nativo");
else bad("deleteProfile bloqueia nativo", "não bloqueou");

const customDelete = await globalThis.game.lumennNotify.deleteProfile("custom-1");
if (customDelete !== undefined && !globalThis.game.lumennNotify.getProfile("custom-1")) ok("deleteProfile remove custom");
else bad("deleteProfile remove custom", "não removeu");

console.log("\n[envio]");
const msg = await globalThis.game.lumennNotify.send({ profile: "quest", destination: "all" });
if (msg && msg.content.includes("NOVA MISSÃO")) ok("send cria mensagem pública com cartão");
else bad("send cria mensagem pública com cartão", JSON.stringify(msg));

await globalThis.game.lumennNotify.send({ profile: "quest", destination: "user", userId: "p1" });
const whisper = createdMessages.find((m) => Array.isArray(m.whisper) && m.whisper.includes("p1"));
if (whisper) ok("send para user gera whisper");
else bad("send para user gera whisper", "whisper ausente");

const invalidBefore = createdMessages.length;
await globalThis.game.lumennNotify.send({ profile: "quest", destination: "user", userId: "ghost" });
if (createdMessages.length === invalidBefore) ok("send inválido bloqueado");
else bad("send inválido bloqueado", "criou mensagem");

console.log("\n[grupos]");
await globalThis.game.lumennNotify.saveGroups({ "g-1": { id: "g-1", name: "Mesa 1", userIds: ["p1", "p2"] } });
if (globalThis.game.lumennNotify.getGroups()["g-1"]?.userIds.length === 2) ok("saveGroups + getGroups");
else bad("saveGroups + getGroups", "grupo não persistiu");

await globalThis.game.lumennNotify.saveGroups({ "g-1": { id: "g-1", name: "Mesa 1", userIds: ["p1", "ghost"] } });
const pruned = globalThis.game.lumennNotify.getGroups()["g-1"].userIds;
if (pruned.length === 1 && !pruned.includes("ghost")) ok("grupo poda IDs inexistentes");
else bad("grupo poda IDs inexistentes", JSON.stringify(pruned));

console.log("\n[render]");
const html = globalThis.game.lumennNotify.renderMessage(globalThis.game.lumennNotify.getProfile("constellation"));
if (html.includes('data-lm-theme="orv"')) ok("renderMessage aplica tema");
else bad("renderMessage aplica tema", "data-lm-theme ausente");

console.log("\n[overlay hook]");
const createHooks = hooks.list.createChatMessage ?? [];
if (createHooks.length) ok("hook createChatMessage registrado");
else bad("hook createChatMessage registrado", "ausente");

const snapMsg = {
  visible: true,
  author: { id: "p1" },
  whisper: [],
  getFlag: () => ({ v: 1, profile: { mode: "both", theme: "orv", sound: true, duration: 0, title: "Teste" } }),
};
for (const fn of createHooks) fn(snapMsg);
if (overlayBodies.length && overlayBodies[0].className === "ln-overlay" && overlayBodies[0].innerHTML.includes("ln-message"))
  ok("overlay exibido no receptor");
else bad("overlay exibido no receptor", JSON.stringify(overlayBodies.map((e) => ({ className: e.className, html: e.innerHTML }))));

if (failed) {
  console.error(`\nFAIL · ${failed} check(s) falharam`);
  process.exit(1);
}
console.log("\nPASS · todos os checks do harness passaram");