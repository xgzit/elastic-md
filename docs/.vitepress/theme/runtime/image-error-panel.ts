const PANEL_ID = "vp-image-error-panel";
const AUTO_HIDE_MS = 5000;
let hideTimer: number | undefined;

function createPanel() {
  const panel = document.createElement("aside");
  panel.id = PANEL_ID;
  panel.className = "vp-img-panel";
  panel.innerHTML = `
    <button type="button" class="vp-img-toggle" aria-expanded="false">图片异常 0</button>
    <div class="vp-img-body">
      <p>暂无异常</p>
      <ul></ul>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

function getPanelElements() {
  const panel = document.getElementById(PANEL_ID) || createPanel();
  const toggle = panel.querySelector(".vp-img-toggle") as HTMLButtonElement;
  const body = panel.querySelector(".vp-img-body") as HTMLDivElement;
  const tip = body.querySelector("p") as HTMLParagraphElement;
  const list = body.querySelector("ul") as HTMLUListElement;
  return { panel, toggle, body, tip, list };
}

export function bindImageFallbackPanel() {
  const { panel, toggle, tip, list } = getPanelElements();
  const failed = new Map<string, string>();
  const fallbackSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="440" viewBox="0 0 800 440"><rect width="800" height="440" fill="#f4f5f7"/><rect x="20" y="20" width="760" height="400" rx="16" fill="#fff" stroke="#d6d9df"/><text x="400" y="205" font-size="28" text-anchor="middle" fill="#49586a" font-family="Arial,Microsoft YaHei">图片加载失败</text><text x="400" y="250" font-size="18" text-anchor="middle" fill="#7a8794" font-family="Arial,Microsoft YaHei">Image unavailable</text></svg>'
    );

  if (!toggle.dataset.bound) {
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", () => {
      if (panel.classList.contains("is-hidden")) return;
      const open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Default hidden. Only show when there are image errors.
  panel.classList.add("is-hidden");
  panel.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");

  document.querySelectorAll<HTMLImageElement>(".vp-doc img").forEach((img) => {
    if (img.dataset.fallbackBound === "1") return;
    img.dataset.fallbackBound = "1";
    img.dataset.originalSrc = img.getAttribute("src") || "";
    img.addEventListener(
      "error",
      () => {
        const src = img.dataset.originalSrc || img.src || "unknown";
        failed.set(src, `图片资源加载失败：${src}`);
        renderFailureList(failed, panel, toggle, tip, list);
        img.src = fallbackSvg;
      },
      { once: true }
    );
  });
}

function renderFailureList(
  failed: Map<string, string>,
  panel: HTMLElement,
  toggle: HTMLButtonElement,
  tip: HTMLParagraphElement,
  list: HTMLUListElement
) {
  toggle.textContent = `图片异常 ${failed.size}`;
  panel.classList.toggle("has-error", failed.size > 0);
  tip.style.display = failed.size ? "none" : "";
  list.innerHTML = "";

  for (const [src, msg] of failed.entries()) {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = msg;
    const a = document.createElement("a");
    a.href = src;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "打开原图";
    li.append(text, a);
    list.appendChild(li);
  }

  if (failed.size > 0) {
    panel.classList.remove("is-hidden");
    panel.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      panel.classList.remove("open");
      panel.classList.add("is-hidden");
      toggle.setAttribute("aria-expanded", "false");
    }, AUTO_HIDE_MS);
  } else {
    panel.classList.remove("open");
    panel.classList.add("is-hidden");
    toggle.setAttribute("aria-expanded", "false");
  }
}
