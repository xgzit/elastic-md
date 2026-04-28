import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import "./custom.css";
import { setupImageFallbackPanel } from "./runtime";

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window !== "undefined") {
      const mount = () =>
        setTimeout(() => {
          setTimeout(() => setupImageFallbackPanel(), 0);
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
