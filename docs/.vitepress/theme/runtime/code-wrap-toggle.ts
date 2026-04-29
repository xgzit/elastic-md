const STORAGE_KEY = "vp-code-wrap-enabled";

function isEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

function applyWrap(enabled: boolean) {
  document
    .querySelectorAll<HTMLElement>(".vp-doc div[class*='language-']")
    .forEach((block) => block.classList.toggle("code-wrap-on", enabled));
}

function ensureButton(block: HTMLElement) {
  if (block.querySelector(".vp-code-wrap-toggle")) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "vp-code-wrap-toggle";
  button.textContent = "自动换行";
  button.addEventListener("click", () => {
    const next = !isEnabled();
    setEnabled(next);
    applyWrap(next);
    refreshButtons();
  });
  block.appendChild(button);
}

function refreshButtons() {
  const enabled = isEnabled();
  document
    .querySelectorAll<HTMLElement>(".vp-doc .vp-code-wrap-toggle")
    .forEach((button) => {
      button.classList.toggle("is-on", enabled);
      button.setAttribute("aria-pressed", enabled ? "true" : "false");
    });
}

export function setupCodeWrapToggle() {
  document
    .querySelectorAll<HTMLElement>(".vp-doc div[class*='language-']")
    .forEach(ensureButton);
  applyWrap(isEnabled());
  refreshButtons();
}

