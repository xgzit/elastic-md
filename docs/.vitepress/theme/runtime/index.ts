import { bindImageFallbackPanel } from "./image-error-panel";

export function setupImageFallbackPanel() {
  window.__VP_REBIND_IMAGE_PANEL__ = bindImageFallbackPanel;
  bindImageFallbackPanel();
}
