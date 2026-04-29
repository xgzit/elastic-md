export function setupCopyButtonI18n() {
  document
    .querySelectorAll<HTMLButtonElement>(".vp-doc div[class*='language-'] button.copy")
    .forEach((btn) => {
      btn.setAttribute("title", "复制");
      btn.setAttribute("aria-label", "复制");
      const span = btn.querySelector("span");
      if (span) span.textContent = "复制";

      if (btn.dataset.i18nBound === "1") return;
      btn.dataset.i18nBound = "1";

      const observer = new MutationObserver(() => {
        const copied = btn.classList.contains("copied");
        btn.setAttribute("title", copied ? "已复制" : "复制");
        btn.setAttribute("aria-label", copied ? "已复制" : "复制");
        if (span) span.textContent = copied ? "已复制" : "复制";
      });
      observer.observe(btn, { attributes: true, attributeFilter: ["class"] });
    });
}
