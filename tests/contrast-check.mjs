import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const themes = ["system", "fantasy", "cyberpunk", "horror"];
const hex = (value) => {
  const match = String(value).trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return null;
  const raw = match[1];
  return [0, 2, 4].map((i) => Number.parseInt(raw.slice(i, i + 2), 16) / 255);
};
const luminance = ([r, g, b]) => {
  const linear = (channel) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
};
const contrast = (foreground, background) => {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const composite = (foreground, alpha, background) => foreground.map((channel, i) => channel * alpha + background[i] * (1 - alpha));
const worstBackdrop = hex("#F2F2F2");
let failed = 0;

for (const theme of themes) {
  const css = readFileSync(join(ROOT, "styles", "themes", `${theme}.css`), "utf8");
  const token = (name) => css.match(new RegExp(`--lm-${name}:\\s*([^;]+)`))?.[1]?.trim();
  const surface = hex(token("surface"));
  const foreground = hex(token("fg"));
  const dim = hex(token("dim"));
  if (!surface || !foreground || !dim) throw new Error(`${theme}: tokens fg/surface/dim precisam ser hex resolvível`);
  const panel = composite(surface, 0.86, worstBackdrop);
  for (const [label, color, minimum] of [["fg", foreground, 4.5], ["dim", dim, 4.5]]) {
    const ratio = contrast(color, panel);
    if (ratio < minimum) {
      failed += 1;
      console.error(`✗ ${theme}/${label}: contraste ${ratio.toFixed(2)} < ${minimum}`);
    } else console.log(`✓ ${theme}/${label}: contraste ${ratio.toFixed(2)}`);
  }
  for (const severity of ["info", "success", "warning", "error"]) {
    const text = hex(token(`${severity}-text`));
    if (!text) throw new Error(`${theme}: ${severity}-text precisa ser hex resolvível`);
    const ratio = contrast(text, panel);
    if (ratio < 4.5) {
      failed += 1;
      console.error(`✗ ${theme}/${severity}: contraste ${ratio.toFixed(2)} < 4.5`);
    }
  }
}

const core = readFileSync(join(ROOT, "styles", "lumenn-notify.css"), "utf8");
for (const theme of themes) {
  const block = core.match(new RegExp(`\\.lumenn-notify-manager\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  const value = (name) => block.match(new RegExp(`--lm-manager-${name}:\\s*([^;]+)`))?.[1]?.trim();
  const panel = hex(value("panel"));
  const text = hex(value("text"));
  const warning = hex(value("warning"));
  const error = hex(value("error"));
  if (!panel || !text || !warning || !error) throw new Error(`${theme}: manager tokens de contraste ausentes`);
  for (const [label, color] of [["text", text], ["warning", warning], ["error", error]]) {
    const ratio = contrast(color, panel);
    if (ratio < 4.5) {
      failed += 1;
      console.error(`✗ manager ${theme}/${label}: contraste ${ratio.toFixed(2)} < 4.5`);
    }
  }
}

if (failed) process.exit(1);
