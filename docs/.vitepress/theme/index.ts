import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "./custom.css";
import {
  cleanupContinuousReadingArtifacts,
  setupCodeBlocksEnhancements,
  setupDownloadGuards,
  setupImageEnhancements,
  setupImageFallbackPanel,
} from "./runtime";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window !== "undefined") {
      const mount = () =>
        setTimeout(() => {
          setTimeout(() => cleanupContinuousReadingArtifacts(), 0);
          setTimeout(() => setupImageFallbackPanel(), 0);
          setTimeout(() => setupImageEnhancements(), 0);
          setTimeout(() => setupCodeBlocksEnhancements(), 0);
          setTimeout(() => setupDownloadGuards(), 0);
        }, 0);
      const previous = router.onAfterRouteChanged;
      router.onAfterRouteChanged = (...args) => {
        if (typeof previous === "function") previous(...args);
        mount();
      };
      mount();
    }
  },
};

export default theme;
