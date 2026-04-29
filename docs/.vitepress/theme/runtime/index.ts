import { bindImageFallbackPanel } from "./image-error-panel";
import { setupCodeWrapToggle } from "./code-wrap-toggle";
import { setupDownloadCaptcha } from "./download-captcha";
import { setupCopyButtonI18n } from "./copy-i18n";
import { setupImageLightbox } from "./image-lightbox";

export function cleanupContinuousReadingArtifacts() {
  document.querySelectorAll(".vp-continuous-card").forEach((el) => el.remove());
  document.body.classList.remove("vp-continuous-reading");
  document.querySelector(".vp-doc")?.classList.remove("vp-continuous-current");
}

export function setupImageFallbackPanel() {
  window.__VP_REBIND_IMAGE_PANEL__ = bindImageFallbackPanel;
  bindImageFallbackPanel();
}

export function setupCodeBlocksEnhancements() {
  setupCodeWrapToggle();
  setupCopyButtonI18n();
}

export function setupDownloadGuards() {
  setupDownloadCaptcha();
}

export function setupImageEnhancements() {
  setupImageLightbox();
}
