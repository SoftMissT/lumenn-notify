// Empacota dist/ com os arquivos de runtime e gera module.zip + module.json solto.
// Sem dependências externas: usa Compress-Archive (Windows) se disponível.
import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";

const exec = promisify(execFile);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, "dist");

const RUNTIME_FILES = ["module.json", "scripts", "styles", "macros", "LICENSE", "README.md", "CHANGELOG.md"];

async function patchManifestVersion() {
  const tag = process.env.GITHUB_REF_NAME;
  if (!tag) return;
  const version = tag.replace(/^v/, "");
  const manifestPath = path.join(dist, "module.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  manifest.version = version;
  if (manifest.download) manifest.download = manifest.download.replace(/download\/(?:v[^/]+\/)?[^/]+\.zip/, `download/${tag}/module.zip`);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`module.json ajustado para a tag ${tag} (version ${version})`);
}

async function createZip(sourceDir, zipPath) {
  try {
    await exec("zip", ["-rq", zipPath, "."], { cwd: sourceDir });
    return;
  } catch {
    /* zip CLI ausente — tenta Compress-Archive (Windows) */
  }
  await exec("powershell", ["-NoProfile", "-Command", `Compress-Archive -Path '${path.join(sourceDir, "*")}' -DestinationPath '${zipPath}' -Force`]);
}

async function main() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  for (const entry of RUNTIME_FILES) {
    await cp(path.join(root, entry), path.join(dist, entry), { recursive: true });
  }
  await patchManifestVersion();

  const zipPath = path.join(dist, "module.zip");
  await rm(zipPath, { force: true });
  await createZip(dist, zipPath);
  console.log(`Empacotado: ${zipPath}`);
  console.log(`Manifesto solto: ${path.join(dist, "module.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});