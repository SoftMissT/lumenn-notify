import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let failed = 0;
const ok = (name) => console.log(`  ✓ ${name}`);
const bad = (name, why) => {
  failed += 1;
  console.error(`  ✗ ${name}\n    ${why}`);
};

function read(p) {
  const abs = join(ROOT, p);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, "utf8");
}

console.log("Lumenn Notify · static-check");

console.log("\n[manifesto]");
const manifestRaw = read("module.json");
if (!manifestRaw) bad("module.json existe", "arquivo ausente");
else {
  let manifest;
  try {
    manifest = JSON.parse(manifestRaw);
    ok("module.json é JSON válido");
  } catch (e) {
    bad("module.json é JSON válido", e.message);
  }
  if (manifest) {
    if (manifest.id === "lumenn-notify") ok("id = lumenn-notify");
    else bad("id = lumenn-notify", `recebido ${manifest.id}`);
    if (manifest.version) ok(`version = ${manifest.version}`);
    else bad("version presente", "vazio");
    for (const f of manifest.esmodules ?? []) {
      if (read(f)) ok(`esmodule ${f}`);
      else bad(`esmodule ${f} existe`, "arquivo ausente");
    }
    for (const f of manifest.styles ?? []) {
      if (read(f)) ok(`style ${f}`);
      else bad(`style ${f} existe`, "arquivo ausente");
    }
    const themeStyles = (manifest.styles ?? []).filter((f) => f.startsWith("styles/themes/"));
    if (themeStyles.length === 4 && !themeStyles.some((f) => /manhwa|orv/.test(f))) ok("manifesto contém exatamente quatro temas");
    else bad("manifesto contém exatamente quatro temas", JSON.stringify(themeStyles));
  }
}

console.log("\n[sintaxe .js]");
for (const f of [
  "scripts/lumenn-notify.js",
  "scripts/lumenn-notify-manager.js",
  "macros/sls-open-manager.js",
]) {
  try {
    execFileSync(process.execPath, ["--check", join(ROOT, f)], { stdio: "pipe" });
    ok(`node --check ${f}`);
  } catch (e) {
    bad(`node --check ${f}`, e.stderr?.toString() ?? e.message);
  }
}

console.log("\n[imports]");
const main = read("scripts/lumenn-notify.js") ?? "";
const managerImport = main.match(/from\s+["']([^"']+)["']/g) ?? [];
for (const imp of managerImport) {
  const target = imp.match(/["']([^"']+)["']/)?.[1];
  if (target && target.startsWith("./")) {
    const file = join(ROOT, "scripts", target.replace("./", ""));
    if (existsSync(file)) ok(`import ${target}`);
    else bad(`import ${target} existe`, "arquivo ausente");
  }
}

console.log("\n[temas isolados]");
const themes = ["system", "fantasy", "cyberpunk", "horror"];
for (const theme of themes) {
  const css = read(`styles/themes/${theme}.css`) ?? "";
  if (!css) {
    bad(`styles/themes/${theme}.css existe`, "arquivo ausente");
    continue;
  }
  if (css.includes(`[data-theme="${theme}"]`)) ok(`tema ${theme} escopado`);
  else bad(`tema ${theme} escopado`, "sem seletor [data-theme]");
  const firstScoped = css.indexOf(`[data-theme="${theme}"]`);
  const unscopedTokens = firstScoped < 0 ? css : css.slice(0, firstScoped);
  if (!unscopedTokens.match(/--lm-[\w-]+\s*:/)) ok(`tokens ${theme} vivem no escopo`);
  else bad(`tokens ${theme} vivem no escopo`, "token declarado antes do seletor data-theme");
  if (css.includes("--lm-font-display:") && css.includes("--lm-font-ui:")) ok(`tipografia ${theme} definida`);
  else bad(`tipografia ${theme} definida`, "tokens --lm-font-display/--lm-font-ui ausentes");
  const others = themes.filter((t) => t !== theme);
  const leaked = others.filter((t) => css.includes(`[data-theme="${t}"]`));
  if (!leaked.length) ok(`tema ${theme} não vaza para outros`);
  else bad(`tema ${theme} não vaza`, `seletores de ${leaked.join(", ")}`);
}

console.log("\n[estrutura do cartão]");
const coreCss = read("styles/lumenn-notify.css") ?? "";
for (const cls of [".ln-message", ".ln-frame", ".lm-manager"]) {
  if (coreCss.includes(cls)) ok(`core define ${cls}`);
  else bad(`core define ${cls}`, "seletor ausente");
}
if (coreCss.includes('.lumenn-notify-manager[data-theme="cyberpunk"]')) ok("temas alcançam a janela inteira");
else bad("temas alcançam a janela inteira", "root da ApplicationV2 sem tokens temáticos");
if (coreCss.includes('.lumenn-notify-manager[data-light="true"] .ln-frame')) ok("lightMode cobre a prévia");
else bad("lightMode cobre a prévia", "o frame interno do manager mantém textura/filtro");
if (!coreCss.includes(":root")) ok("tokens não vazam para :root");
else bad("tokens não vazam para :root", "há tokens globais fora do data-theme");
if (main.includes('data-theme=') && main.includes('data-severity=')) ok("eixos theme/type-severity independentes");
else bad("eixos theme/type-severity independentes", "atributos data-theme/data-severity ausentes");
const choicesBlock = main.slice(main.indexOf("const THEME_CHOICES"), main.indexOf("const BUILTINS"));
if (!choicesBlock.match(/manhwa|orv/)) ok("choices não expõem temas legados");
else bad("choices não expõem temas legados", "manhwa/orv ainda aparece como escolha canônica");

console.log("\n[api mínima]");
for (const m of ["openManager", "send", "getProfiles", "saveProfile", "deleteProfile", "getGroups", "saveGroups"]) {
  if (main.includes(m)) ok(`lumenn-notify.js expõe ${m}`);
  else bad(`lumenn-notify.js expõe ${m}`, "símbolo ausente");
}
for (const key of ["defaultDuration", "defaultMode", "defaultSound", "maxOverlays", "lightMode"]) {
  if (main.includes(`"${key}"`)) ok(`setting GM ${key} declarado`);
  else bad(`setting GM ${key} declarado`, "chave ausente");
}

if (main.includes("renderChatMessageHTML")) ok("hook renderChatMessageHTML registrado");
else bad("hook renderChatMessageHTML registrado", "ausente");
if (!coreCss.includes(":has(.ln-message)")) ok("CSS do ChatLog não usa :has");
else bad("CSS do ChatLog não usa :has", "seletor estrutural frágil");

if (failed) {
  console.error(`\nFAIL · ${failed} check(s) falharam`);
  process.exit(1);
}
console.log("\nPASS · todos os checks passaram");
