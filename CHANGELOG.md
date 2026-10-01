# Changelog

Todas as mudanças relevantes do módulo **Lumenn Notify** são registradas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento é [SemVer](https://semver.org/lang/pt-BR/).

## [0.3.1] - 2026-10-01

- Consolida os temas em `system`, `fantasy`, `cyberpunk` e `horror`, com tokens
  escopados por `data-theme` e severidade visual `info/success/warning/error`.
- Migra `manhwa`, `orv` e `manhwa-dark` para SYSTEM sem recarregar o mundo.
- Adiciona modo leve, orçamento de dez overlays e verificações de contraste AA.

## [0.3.0] - 2026-09-30

- Faz o tema global alcançar toda a janela `ApplicationV2` (chrome do Foundry,
  header, conteúdo, sidebar, toolbar e editor), não apenas a prévia/cartão.
- Registra configurações de GM para duração, modo, som padrão e limite de
  overlays simultâneos.
- Preserva duração `0` como "até clicar" e usa os defaults configurados em
  perfis novos.

## [0.2.9] - 2026-09-30

- Publica a correção do ChatLog e os cinco temas globais implementados na versão 0.2.8 local.
- Atualiza o pacote para instalação pelo manifesto `v0.2.9`.

## [0.2.5] - 2026-09-29

- Inclui fundo holográfico 16:9 no gerenciador, com moldura angular e constelações.
- Empacota os assets visuais no módulo para que a instalação do Foundry receba o novo design.

## [0.2.6] - 2026-09-30

- Corrige o botão **Usar** para enviar o rascunho atual da prévia, incluindo texto, tema e stats editados.
- Mantém a seleção de destinatário e jogador/grupo no mesmo envio.

## [0.2.7] - 2026-09-30

- Move o controle de tema para Configurações → Configurar módulos → Lumenn Notify.
- Renomeia a interface para Lumenn Notify e remove a marcação “Console do Monarca”.
- Corrige a busca da aba Grupos e adiciona contexto visual para destinatários salvos.

## [0.2.8] - 2026-09-30

- Usa `renderChatMessageHTML` para marcar cartões sem alterar a estrutura global do ChatLog.
- Remove `:has` e a exclusão automática de ChatMessages no modo overlay.
- Corrige clique, limite e limpeza de overlays.
- Adiciona os temas Manhwa dark, Fantasia épica, Cyberpunk e Terror com tokens próprios de cor, forma, tipografia e VFX.
- Mantém o tema salvo no snapshot de cada mensagem; perfis legados `orv` migram para `manhwa`.
- Atualiza a prévia aberta quando o tema global muda em Game Settings.

## [0.2.4] - 2026-09-29

- Adiciona fundo atmosférico holográfico ao gerenciador.
- Melhora contraste, profundidade e legibilidade dos campos e do preview.
- Mantém a identidade visual dos temas sem sacrificar a leitura.

## [0.2.3] - 2026-09-29

- Atualiza o gerenciador para uma janela 16:9 com preview mais amplo e legível.
- Adiciona preview inicial e atualização ao vivo para campos, tema e tipo.
- Reforça as molduras SYSTEM, ORV e FANTASY no preview, chat e overlay.

## [0.2.2.1] - 2026-09-29

- Refina a HUD do gerenciador com identidade visual do Monarca e seleção visual de tema.

## [0.2.2] - 2026-09-29

- Implementa `_replaceHTML` para tornar o gerenciador compatível com o ciclo de renderização do `ApplicationV2` no Foundry v14.

## [0.2.1] - 2026-09-29

- Corrige a abertura do gerenciador no Foundry v14: o estado interno não tenta mais escrever na propriedade somente leitura de `ApplicationV2`.

## [0.1.0] - 2026-09-29

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

- Gate Foundry v14 real (GM + jogador) pendente: CT-001 a CT-020.

## [0.2.0] - 2026-09-29

### Adicionado

- **Ponto de entrada na UI (GM)**: botão na paleta de Scene Controls
  (`getSceneControlButtons`) que abre o gerenciador de mensagens.
- Keybinding `Alt+N` (GM) para abrir o gerenciador.
- Correção: campo de duração no editor agora converte segundos ↔ ms.
- Correção: estado do checkbox de som lido corretamente no manager.
- Manager: métodos de seleção viraram de instância; handlers assíncronos com `await`.

### Alterado

- Macro legada movida para `legacy/sistema-solo-leveling.js` (fora do pacote).

### Corrigido

- O módulo não tinha como ser aberto pela UI; agora há botão e keybinding.

## [0.1.1] - 2026-09-29

### Corrigido

- Manifesto `download` apontando para a tag correta (`v...`), corrigindo o 404
  do Foundry ao baixar o `module.zip`.
