/* Preserve volume through the host's isolated storage, without autoplay. */
(() => {
  const host = window.CanvasTTYPlugin;
  if (!host) return;
  let restored = false;
  const bind = async () => {
    const audio = document.querySelector("audio");
    if (!audio || audio.dataset.hostBound) return;
    if (!Object.keys(audio).some((key) => key.startsWith("__reactProps$"))) return;
    audio.dataset.hostBound = "true";
    try {
      const value = await host.storage.get("volume");
      if (Number.isFinite(value) && value >= 0 && value <= 1) {
        const slider = document.querySelector('input[aria-label="Громкость"]');
        if (slider) {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
          setter.call(slider, String(value));
          slider.dispatchEvent(new Event("input", { bubbles: true }));
          slider.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    } catch (error) {
      console.warn("Deploychan Music: volume could not be restored", error);
    }
    restored = true;
    audio.addEventListener("volumechange", () => {
      if (restored) host.storage.set("volume", audio.volume).catch(() => {});
    });
  };
  // The upstream React application hydrates asynchronously.
  const observer = new MutationObserver(() => { void bind(); });
  observer.observe(document.body, { childList: true, subtree: true });
  void bind();
  let attempts = 0;
  const hydration = setInterval(() => {
    void bind();
    if (document.querySelector("audio")?.dataset.hostBound || ++attempts >= 100) clearInterval(hydration);
  }, 100);
  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
})();
