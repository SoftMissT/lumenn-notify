# Lumenn Notify

![Foundry VTT](https://img.shields.io/badge/Foundry_VTT-14-blueviolet)
![Foundry VTT](https://img.shields.io/badge/Foundry_VTT-13.350-blueviolet)
![Version](https://img.shields.io/github/v/release/SoftMissT/lumenn-notify?label=release)
![License](https://img.shields.io/github/license/SoftMissT/lumenn-notify)
![GitHub last commit](https://img.shields.io/github/last-commit/SoftMissT/lumenn-notify)
![Downloads](https://img.shields.io/github/downloads/SoftMissT/lumenn-notify/total)

> Mensagens narrativas, perfis e canais para **Foundry VTT v14+**.

O GM cria, edita e envia cartões de Sistema, quests, perigos e mensagens de
Constelação para todos, para um jogador ou para grupos salvos. O mundo escolhe
uma identidade visual global em Game Settings e a mesma marcação é usada no
gerenciador, preview, chat e overlay.

## Recursos

- **Gerenciador de perfis** (ApplicationV2): criar, duplicar, renomear, salvar,
  excluir, importar e exportar perfis.
- **Presets nativos protegidos**: `system`, `quest`, `alert`, `danger`, `skill`,
  `levelup`, `constellation` somente leitura; duplique para editar.
- **Destinatários**: todos, só GM, um jogador ou um grupo salvo.
- **Temas**: `system`, `manhwa`, `fantasy`, `cyberpunk` e `horror`, configurados em **Configurações → Configurar módulos → Lumenn Notify**.
- **Envio**: overlay + cartão no chat, com snapshot do perfil gravado na mensagem.
- **Prévia confiável**: o botão **Usar** envia exatamente o rascunho mostrado na prévia, incluindo texto, stats e destinatário; o tema vem da configuração global.
- **Compatibilidade**: `window.SLS.send(...)` e `window.SLS.abrir()` continuam
  funcionando.

## Instalação

URL do manifesto (a partir da release):

```
https://github.com/SoftMissT/lumenn-notify/releases/latest/download/module.json
```

### Manual

1. Baixe o `module.zip` da [última release](https://github.com/SoftMissT/lumenn-notify/releases).
2. Extraia em `Data/modules/lumenn-notify/`.
3. Ative em **Configurações → Gerenciar Módulos**.

## Uso

1. Ative o módulo em **Configurações → Gerenciar Módulos**.
2. Abra o console (somente GM):
   - Macro `sls-open-manager`, ou
   - `game.lumennNotify.openManager()` no console.
3. Escolha um perfil, ajuste texto/destinatário, confira a prévia e clique
   em **Enviar agora**.

### API

```js
game.lumennNotify.openManager(); // abre o gerenciador (GM)
game.lumennNotify.send({ profile: "quest", destination: "all" });
game.lumennNotify.getProfiles(); // nativos + campanha
game.lumennNotify.saveProfile(profile); // custom (GM)
game.lumennNotify.deleteProfile(id); // custom (GM)
game.lumennNotify.getGroups();
game.lumennNotify.saveGroups(groups);
```

### Compatibilidade legada

```js
window.SLS.abrir();
window.SLS.send({ perfil: "quest", corpo: "Mate 10 lobos." });
window.SLS.send("perigo", "Presença hostil detectada.");
```

## Temas

| Tema      | Direção |
| :-------- | :------ |
| `system`    | Sala de controle azul-marinho e cyan, com moldura técnica |
| `manhwa`    | Sistema dark de manhwa, obsidiana, violeta e halo elétrico |
| `fantasy`   | Fantasia épica, pergaminho, azul-noite e bronze heráldico |
| `cyberpunk` | Terminal grafite, grid, ciano e magenta neon |
| `horror`    | Arquivo em decomposição, carvão, verde mofo e ferrugem |

O tema ativo é uma configuração do mundo. Mensagens novas usam o tema atual;
mensagens já enviadas preservam o tema salvo no snapshot, mesmo depois de uma
troca de configuração. Perfis legados com `orv` são lidos como `manhwa`.

## Desenvolvimento

```powershell
node tests/static-check.mjs    # valida manifesto, sintaxe, temas e API
node tests/runtime-harness.mjs # boot simulado (settings, hooks, chat, overlay)
```

Gate final: teste manual no Foundry v14 com GM + jogador (CT-001..CT-020).

## Estrutura

```
scripts/lumenn-notify.js          dados, presets, migração, envio, render, hook
scripts/lumenn-notify-manager.js  gerenciador (ApplicationV2)
styles/lumenn-notify.css          estrutura e variáveis
styles/themes/{system,manhwa,fantasy,cyberpunk,horror}.css
macros/sls-open-manager.js        wrapper de abertura
tests/                            checks estáticos + harness
```

## Changelog

Ver [CHANGELOG.md](CHANGELOG.md).

## Licença

MIT © 2026 Nelson Antonio Silva Leme Gonçalves.
