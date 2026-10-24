const button = document.getElementById("open");
button.addEventListener("click", async () => {
  button.disabled = true;
  document.getElementById("status").textContent = "";
  try {
    if (!window.CanvasTTYPlugin) throw new Error("Откройте плагин внутри CanvasTTY.");
    await window.CanvasTTYPlugin.request("canvas.open", { contributionId: "player" });
  } catch (error) {
    document.getElementById("status").textContent = error.message || "Не удалось открыть плеер.";
  } finally {
    button.disabled = false;
  }
});
