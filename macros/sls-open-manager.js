(async () => {
  const t0 = performance.now();

  if (!game.lumennNotify) {
    return ui.notifications.warn(
      "Lumenn Notify não está ativo. Ative o módulo nas Configurações antes de usar.",
    );
  }

  game.lumennNotify.openManager();

  console.log(`[Lumenn Notify] manager aberto em ${(performance.now() - t0).toFixed(2)}ms`);
})();