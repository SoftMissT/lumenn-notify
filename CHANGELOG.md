# Changelog

Todas as mudanças relevantes do módulo **Lumenn Notify** são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento é [SemVer](https://semver.org/lang/pt-BR/).

## [0.1.0] — 2026-09-29

### Adicionado
- Módulo Foundry VTT `lumenn-notify` v0.1.0 (manifesto `minimum/verified: 14`).
- API pública `game.lumennNotify` (`openManager`, `send`, `getProfiles`,
  `saveProfile`, `deleteProfile`, `getGroups`, `saveGroups`, `renderMessage`,
  `normalizeProfile`).
- Gerenciador de perfis em ApplicationV2 (`scripts/lumenn-notify-manager.js`):
  lista lateral, busca, criar, duplicar, renomear, salvar, excluir (com
  confirmação), importar e exportar JSON.
- Presets nativos protegidos: `system`, `quest`, `alert`, `danger`, `skill`,
  `levelup`, `constellation`.
- Destinatários: todos, GM, jogador individual e grupos salvos; envio inválido
  bloqueado com aviso.
- Grupos: criar, nomear, selecionar usuários, salvar, excluir e poda automática
  de User IDs inexistentes.
- Cartão de chat pré-renderizado com snapshot do perfil no flag da mensagem.
- Overlay no receptor via hook `createChatMessage` (RF-009), com fila (máx. 5),
  som opcional e respeito a `prefers-reduced-motion`.
- Três temas CSS isolados por `[data-lm-theme]`: `system`, `orv`, `fantasy`.
- Migração da biblioteca legada `gondolin-sls.biblioteca` para o novo schema.
- Compatibilidade `window.SLS.send(...)` e `window.SLS.abrir()`.
- Testes: `tests/static-check.mjs` (manifesto, sintaxe, temas, API) e
  `tests/runtime-harness.mjs` (boot simulado, presets, CRUD, envio, overlay).
- Workflow de release GitHub Actions (tag `v*` → `module.json` + `module.zip`).

## [Não publicado]

- Gate Foundry v14 real (GM + jogador) pendente — CT-001 a CT-020.