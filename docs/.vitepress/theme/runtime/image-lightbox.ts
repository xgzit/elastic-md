const LIGHTBOX_ID = "vp-image-lightbox";

function ensureLightbox(): HTMLElement {
  let el = document.getElementById(LIGHTBOX_ID);
  if (el) return el;
  el = document.createElement("div");
  el.id = LIGHTBOX_ID;
  el.className = "vp-image-lightbox";
  el.innerHTML = `
    <button type="button" class="vp-image-lightbox-close" aria-label="关闭">×</button>
    <img alt="" />
  `;
  document.body.appendChild(el);
  return el;
}

export function setupImageLightbox() {
  const lightbox = ensureLightbox();
  const viewer = lightbox.querySelector("img") as HTMLImageElement;
  const closeBtn = lightbox.querySelector(".vp-image-lightbox-close") as HTMLButtonElement;

  const open = (src: string, alt = "") => {
    viewer.src = src;
    viewer.alt = alt;
    lightbox.classList.add("open");
  };
  const close = () => lightbox.classList.remove("open");

  closeBtn.onclick = close;
  lightbox.onclick = (e) => {
    if (e.target === lightbox) close();
  };

  if ((window as any).__VP_LIGHTBOX_ESC_BOUND__ !== true) {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    (window as any).__VP_LIGHTBOX_ESC_BOUND__ = true;
  }

  document.querySelectorAll<HTMLImageElement>(".vp-doc img").forEach((img) => {
    if (img.classList.contains("no-zoom")) return;
    if (img.dataset.zoomBound === "1") return;
    img.dataset.zoomBound = "1";
    img.classList.add("vp-zoomable");
    img.addEventListener("click", () => {
      const src = img.currentSrc || img.src;
      if (!src) return;
      open(src, img.alt || "");
    });
  });
}

