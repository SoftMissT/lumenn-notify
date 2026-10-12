# Lumenn Notify

Mensagens narrativas para Foundry VTT 14: o GM escolhe um perfil, define quem recebe e envia a mesma mensagem para o overlay e o chat.

![Foundry VTT 14](https://img.shields.io/badge/Foundry_VTT-14-243b53)
![Versão](https://img.shields.io/github/v/release/SoftMissT/lumenn-notify?label=vers%C3%A3o)
![Licença](https://img.shields.io/github/license/SoftMissT/lumenn-notify)

## O que o módulo resolve

- Perfis para sistema, missão, alerta, perigo, habilidade, evolução e constelação.
- Presets nativos protegidos: duplique um preset para criar sua versão.
- Destinatários: todos, GM, jogador específico ou grupo salvo.
- Envio em overlay, chat ou nos dois canais.
- Quatro temas globais: `system`, `fantasy`, `cyberpunk` e `horror`.
- Importação e exportação de perfis em JSON.
- Compatibilidade com `window.SLS.send(...)` e `window.SLS.abrir()`.

O tema é escolhido em **Configurações de jogo → Lumenn Notify**. Mensagens já enviadas guardam o tema usado no momento do envio.

## Instalação

No Foundry, instale pelo manifesto:

```text
https://github.com/SoftMissT/lumenn-notify/releases/latest/download/module.json
```

Ou baixe o ZIP da [última release](https://github.com/SoftMissT/lumenn-notify/releases) e extraia em `Data/modules/lumenn-notify/`. Depois, ative o módulo em **Configurações → Gerenciar módulos**.

## Primeiro uso

1. Entre no mundo como GM e ative o módulo.
2. Abra o gerenciador pela macro `sls-open-manager` ou pelo console:

   ```js
   game.lumennNotify.openManager();
   ```

3. Escolha um perfil ou clique em **Novo**.
4. Edite a mensagem, o destino e o modo de exibição.
5. Confira a prévia e clique em **Usar**.

Presets nativos não podem ser sobrescritos. Use **Duplicar para editar** quando quiser alterar um deles.

## API

```js
game.lumennNotify.openManager();
game.lumennNotify.send({ profile: "quest", destination: "all" });
game.lumennNotify.getProfiles();
game.lumennNotify.saveProfile(profile);
game.lumennNotify.deleteProfile(id);
game.lumennNotify.getGroups();
game.lumennNotify.saveGroups(groups);
```

### API legada

```js
window.SLS.abrir();
window.SLS.send({ perfil: "quest", corpo: "Mate 10 lobos." });
window.SLS.send("perigo", "Presença hostil detectada.");
```

## Temas

| Tema | Uso |
| --- | --- |
| `system` | Interface de sistema, aço e azul |
| `fantasy` | Pergaminho, tinta e selo |
| `cyberpunk` | HUD angular e amarelo de alerta |
| `horror` | Sobrevivência analógica, carvão e musgo |

Valores antigos (`manhwa`, `orv` e `manhwa-dark`) migram para `system`.

## Desenvolvimento

```powershell
npm test                 # checks estáticos, contraste e harness de runtime
npm run check            # sintaxe JavaScript
npm run package          # gera o ZIP de distribuição
npm run release          # gate completo + ZIP
```

O gate local não substitui o teste manual no Foundry 14 com GM e jogador. O roteiro de aceitação é CT-001..CT-020.

## Estrutura

```text
scripts/lumenn-notify.js          dados, presets, envio, render e hooks
scripts/lumenn-notify-manager.js  gerenciador ApplicationV2
styles/lumenn-notify.css          layout e tokens compartilhados
styles/themes/*.css                temas visuais
macros/sls-open-manager.js         atalho de abertura
tests/                             checks estáticos e harness
```

## Licença

MIT © 2026 Nelson Antonio Silva Leme Gonçalves.
