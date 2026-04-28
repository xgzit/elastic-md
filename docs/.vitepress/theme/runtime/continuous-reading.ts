import { sidebar as staticSidebar } from "../../sidebar";

type RouteMeta = {
  path: string;
  text: string;
};

type ObserverEntry = {
  el: Element;
  path: string;
};

let activeObserver: IntersectionObserver | null = null;
let mountRetryTimer: number | null = null;
let sidebarNavBound = false;
let session: {
  routes: RouteMeta[];
  container: Element;
  loading: Set<number>;
  loaded: Set<number>;
} | null = null;
const STORAGE_KEY = "vp:continuous-reading:enabled";
const TOGGLE_ID = "vp-continuous-toggle";
const EMBED_PARAM = "vp_embed";

function crLog(...args: any[]) {
  // eslint-disable-next-line no-console
  console.info("[CR]", ...args);
}

declare global {
  interface Window {
    __VP_REBIND_IMAGE_PANEL__?: () => void;
  }
}

function normalizePath(path: string): string {
  if (!path) return "/";
  let noQuery = path.split("#")[0].split("?")[0];
  try {
    noQuery = decodeURIComponent(noQuery);
  } catch {
    // ignore decode failure and keep original value
  }
  if (noQuery === "/") return "/";
  return noQuery.endsWith("/") ? noQuery.slice(0, -1) : noQuery;
}

function isChapterPath(path: string): boolean {
  return normalizePath(path).startsWith("/chapters/");
}

function isChapterIndexPath(path: string): boolean {
  return /^\/chapters\/chapter-\d+$/i.test(normalizePath(path));
}

function isEmbedMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(EMBED_PARAM) === "1";
  } catch {
    return false;
  }
}

function readEnabledPreference(): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw !== "0";
  } catch {
    return true;
  }
}

function writeEnabledPreference(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // ignore storage errors
  }
}

function getToggleButton(): HTMLButtonElement {
  let btn = document.getElementById(TOGGLE_ID) as HTMLButtonElement | null;
  if (!btn) {
    btn = document.createElement("button");
    btn.id = TOGGLE_ID;
    btn.className = "vp-continuous-toggle";
    btn.type = "button";
    document.body.appendChild(btn);
    btn.addEventListener("click", () => {
      const next = !readEnabledPreference();
      writeEnabledPreference(next);
      void setupContinuousReading();
    });
  }
  return btn;
}

function updateToggleButton(path: string, enabled: boolean) {
  const btn = getToggleButton();
  if (!isChapterPath(path)) {
    btn.classList.add("is-hidden");
    return;
  }

  btn.classList.remove("is-hidden");
  btn.classList.toggle("is-on", enabled);
  btn.classList.toggle("is-off", !enabled);
  btn.setAttribute("aria-pressed", enabled ? "true" : "false");
  btn.textContent = enabled ? "连续阅读：开" : "连续阅读：关";
}

function flattenSidebarLinks(): RouteMeta[] {
  const out: RouteMeta[] = [];
  const seen = new Set<string>();

  const walk = (items: any[]) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item?.link) {
        const path = normalizePath(String(item.link));
        if (!seen.has(path) && isChapterPath(path) && !isChapterIndexPath(path)) {
          seen.add(path);
          out.push({
            path,
            text: String(item.text || path),
          });
        }
      }
      if (Array.isArray(item?.items)) walk(item.items);
    }
  };

  // Primary source: statically imported sidebar order (stable and full).
  walk((staticSidebar as any)?.["/chapters/"]);
  if (out.length > 0) return out;

  // Fallback 1: runtime site data (in case static import shape changes).
  const siteData = (window as any).__VP_SITE_DATA__;
  walk(siteData?.themeConfig?.sidebar?.["/chapters/"]);
  if (out.length > 0) return out;

  // Fallback: extract route order from rendered sidebar links in DOM.
  document.querySelectorAll<HTMLAnchorElement>(".VPSidebar a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    const path = normalizePath(href);
    if (!isChapterPath(path) || isChapterIndexPath(path) || seen.has(path)) return;
    seen.add(path);
    out.push({
      path,
      text: (a.textContent || path).trim(),
    });
  });

  return out;
}

function cleanupContinuousBlocks() {
  if (mountRetryTimer !== null) {
    window.clearTimeout(mountRetryTimer);
    mountRetryTimer = null;
  }
  session = null;
  document.body.classList.remove("vp-continuous-reading");
  document.querySelectorAll(".vp-continuous-card").forEach((el) => el.remove());
  document.querySelector(".vp-doc")?.classList.remove("vp-continuous-current");
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
}

function bindSidebarNavigationGuard() {
  if (sidebarNavBound) return;
  sidebarNavBound = true;
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const link = target?.closest(".VPSidebar a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;
    const path = normalizePath(href);
    if (!isChapterPath(path)) return;
    if (path === normalizePath(window.location.pathname)) return;
    event.preventDefault();
    window.location.assign(href);
  });
}

function createCardHeader(kind: "prev" | "next", text: string, path: string): HTMLElement {
  const header = document.createElement("div");
  header.className = "vp-continuous-header";
  const label = kind === "prev" ? "上一篇" : "下一篇";
  header.innerHTML = `<span class="vp-continuous-label">${label}</span>
    <a class="vp-continuous-link" href="${path}">${text}</a>`;
  return header;
}

function rewriteFragmentIds(root: HTMLElement, prefix: string) {
  root.querySelectorAll<HTMLElement>("[id]").forEach((el) => {
    const id = el.id;
    if (!id) return;
    el.id = `${prefix}${id}`;
  });

  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute("href");
    if (!href || href.length < 2) return;
    const id = href.slice(1);
    a.setAttribute("href", `#${prefix}${id}`);
  });
}

function buildFetchCandidates(path: string): string[] {
  const normalized = normalizePath(path);
  if (normalized === "/") return ["/", "/index.html"];
  const encoded = encodeURI(normalized);
  const out = [normalized, `${normalized}.html`, `${normalized}/index.html`, encoded, `${encoded}.html`];
  return Array.from(new Set(out));
}

function withEmbedParam(path: string): string {
  try {
    const u = new URL(path, window.location.origin);
    u.searchParams.set(EMBED_PARAM, "1");
    return u.pathname + u.search;
  } catch {
    return path.includes("?") ? `${path}&${EMBED_PARAM}=1` : `${path}?${EMBED_PARAM}=1`;
  }
}

function parseDocFragmentFromHtml(html: string, fallbackPath: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const sourceDoc = parsed.querySelector(".vp-doc");
  const hasRealContent = sourceDoc?.querySelector("h1, h2, h3, p, pre, img");
  if (!sourceDoc || !hasRealContent) return null;

  const fragment = document.createElement("div");
  fragment.className = "vp-continuous-fragment";
  fragment.innerHTML = sourceDoc.innerHTML;
  const h1 = fragment.querySelector("h1");
  const title = (h1?.textContent || fallbackPath).trim();
  return { title, fragment };
}

async function fetchDocFragment(path: string): Promise<{ title: string; fragment: HTMLElement } | null> {
  const candidates = buildFetchCandidates(path);
  crLog("fetch start", { path, candidates });
  for (const candidate of candidates) {
    try {
      const resp = await fetch(candidate, {
        credentials: "same-origin",
        headers: { Accept: "text/html" },
      });
      if (!resp.ok) {
        crLog("fetch miss", { candidate, status: resp.status });
        continue;
      }
      const html = await resp.text();
      const parsed = parseDocFragmentFromHtml(html, path);
      if (parsed) {
        crLog("fetch hit", { candidate, title: parsed.title });
        return parsed;
      }
      crLog("fetch non-doc", { candidate });
    } catch {
      crLog("fetch error", { candidate });
      // continue with next candidate
    }
  }
  crLog("fetch fallback to iframe", { path });
  return fetchDocFragmentByIframe(path);
}

async function fetchDocFragmentByIframe(path: string): Promise<{ title: string; fragment: HTMLElement } | null> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.className = "vp-continuous-loader";
    iframe.style.position = "fixed";
    iframe.style.left = "-99999px";
    iframe.style.top = "-99999px";
    iframe.style.width = "1200px";
    iframe.style.height = "800px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.setAttribute("aria-hidden", "true");

    let done = false;
    let pollTimer: number | null = null;
    let timeoutTimer: number | null = null;

    const finish = (value: { title: string; fragment: HTMLElement } | null) => {
      if (done) return;
      done = true;
      if (pollTimer !== null) window.clearInterval(pollTimer);
      if (timeoutTimer !== null) window.clearTimeout(timeoutTimer);
      iframe.remove();
      if (value) {
        crLog("iframe hit", { path, title: value.title });
      } else {
        crLog("iframe miss", { path });
      }
      resolve(value);
    };

    const tryExtract = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        const sourceDoc = doc.querySelector(".VPDoc .vp-doc");
        const hasRealContent = sourceDoc?.querySelector("h1, h2, h3, p, pre, img");
        if (!sourceDoc || !hasRealContent) return;

        const fragment = document.createElement("div");
        fragment.className = "vp-continuous-fragment";
        fragment.innerHTML = sourceDoc.innerHTML;
        const h1 = fragment.querySelector("h1");
        const title = (h1?.textContent || path).trim();
        finish({ title, fragment });
      } catch {
        crLog("iframe extract transient error", { path });
        // ignore transient frame errors
      }
    };

    iframe.addEventListener("load", () => {
      tryExtract();
      if (done) return;
      pollTimer = window.setInterval(tryExtract, 120);
    });

    timeoutTimer = window.setTimeout(() => {
      crLog("iframe timeout", { path });
      finish(null);
    }, 3500);
    iframe.src = withEmbedParam(path);
    crLog("iframe load", { src: iframe.src });
    document.body.appendChild(iframe);
  });
}

function setupPathSync(entries: ObserverEntry[]) {
  if (activeObserver) activeObserver.disconnect();

  activeObserver = new IntersectionObserver(
    (records) => {
      const visible = records
        .filter((r) => r.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible[0]) return;
      const idx = Number((visible[0].target as HTMLElement).dataset.continuousIndex);
      if (Number.isFinite(idx)) {
        void ensureContinuousAround(idx, false);
      }
    },
    { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.4, 1] }
  );

  for (const entry of entries) {
    (entry.el as HTMLElement).dataset.continuousPath = entry.path;
    activeObserver.observe(entry.el);
  }
}

function getLoadedElements(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-continuous-index]")).sort(
    (a, b) => Number(a.dataset.continuousIndex) - Number(b.dataset.continuousIndex)
  );
}

async function loadCardAtIndex(index: number) {
  if (!session) return;
  const { routes, container, loading, loaded } = session;
  if (index < 0 || index >= routes.length) return;
  if (container.querySelector(`[data-continuous-index="${index}"]`)) return;
  if (loaded.has(index)) return;
  if (loading.has(index)) return;

  loading.add(index);
  const route = routes[index];
  const data = await fetchDocFragment(route.path);
  loading.delete(index);
  if (!session || !data) return;

  const card = document.createElement("section");
  card.className = "vp-continuous-card";
  const currentIndex = Number(
    (document.querySelector(".vp-doc.vp-continuous-current") as HTMLElement | null)?.dataset
      ?.continuousIndex ?? index
  );
  const kind = index < currentIndex ? "prev" : "next";
  card.appendChild(createCardHeader(kind, route.text || data.title, route.path));
  card.appendChild(data.fragment);
  card.dataset.continuousPath = route.path;
  card.dataset.continuousIndex = String(index);
  loaded.add(index);

  const sorted = getLoadedElements(container);
  const nextEl = sorted.find((el) => Number(el.dataset.continuousIndex) > index);
  if (nextEl) {
    container.insertBefore(card, nextEl);
  } else {
    container.appendChild(card);
  }

  if (activeObserver) {
    activeObserver.observe(card);
  }
}

async function ensureContinuousAround(centerIndex: number, eager = false) {
  if (!session) return;
  const { routes } = session;
  const max = routes.length - 1;
  const toLoad = [
    centerIndex - 1,
    centerIndex + 1,
    centerIndex + 2,
    ...(eager ? [centerIndex - 2, centerIndex + 3] : []),
  ].filter((n) => n >= 0 && n <= max);

  for (const idx of toLoad) {
    await loadCardAtIndex(idx);
  }
}

export async function setupContinuousReading(attempt = 0) {
  if (isEmbedMode()) {
    crLog("skip embed mode");
    return;
  }
  bindSidebarNavigationGuard();
  const currentPath = normalizePath(window.location.pathname);
  const enabled = readEnabledPreference();
  updateToggleButton(currentPath, enabled);
  cleanupContinuousBlocks();
  crLog("setup", { currentPath, enabled, attempt });

  if (!isChapterPath(currentPath)) {
    crLog("skip non-chapter path", { currentPath });
    return;
  }
  if (!enabled) {
    crLog("skip disabled by toggle");
    return;
  }

  const routes = flattenSidebarLinks();
  const index = routes.findIndex((r) => r.path === currentPath);
  if (index < 0) {
    crLog("skip route not found in sidebar", { currentPath, routeCount: routes.length });
    if (routes.length === 0 && attempt < 8) {
      mountRetryTimer = window.setTimeout(() => {
        void setupContinuousReading(attempt + 1);
      }, 120);
      crLog("scheduled retry for empty routes", { nextAttempt: attempt + 1 });
    }
    return;
  }

  const prev = routes[index - 1];
  const next = routes[index + 1];
  if (!prev && !next) {
    crLog("skip no prev/next");
    return;
  }

  const currentDoc = document.querySelector(".VPDoc .vp-doc");
  if (!currentDoc || !currentDoc.parentElement) {
    crLog("current doc not ready", { attempt });
    if (attempt < 8) {
      mountRetryTimer = window.setTimeout(() => {
        void setupContinuousReading(attempt + 1);
      }, 80);
      crLog("scheduled retry", { nextAttempt: attempt + 1 });
    }
    return;
  }

  currentDoc.classList.add("vp-continuous-current");
  (currentDoc as HTMLElement).dataset.continuousPath = currentPath;
  (currentDoc as HTMLElement).dataset.continuousIndex = String(index);
  document.body.classList.add("vp-continuous-reading");
  session = {
    routes,
    container: currentDoc.parentElement,
    loading: new Set<number>(),
    loaded: new Set<number>([index]),
  };
  await ensureContinuousAround(index, true);
  crLog("mounted", { observedCount: getLoadedElements(session.container).length, centerIndex: index });

  // Rebind observer: update URL and continuously append more content.
  const entries = getLoadedElements(session.container).map((el) => ({
    el,
    path: String(el.dataset.continuousPath || ""),
  }));
  setupPathSync(entries);

  if (typeof window.__VP_REBIND_IMAGE_PANEL__ === "function") {
    window.__VP_REBIND_IMAGE_PANEL__();
  }
}
