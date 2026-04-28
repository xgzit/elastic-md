(async function init() {
  const SOURCE_URL = "https://blog.csdn.net/u011863024/article/details/115721328";
  const contentEl = document.getElementById("docContent");
  const navEl = document.getElementById("sidebarNav");
  const rightTocEl = document.getElementById("rightToc");
  const searchInput = document.getElementById("searchInput");
  const searchStat = document.getElementById("searchStat");
  const searchPrev = document.getElementById("searchPrev");
  const searchNext = document.getElementById("searchNext");
  const videoLink = document.getElementById("videoLink");
  const sourceLink = document.getElementById("sourceLink");
  const rightRailTitle = document.getElementById("rightRailTitle");
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const readProgress = document.getElementById("readProgress");
  const backTopBtn = document.getElementById("backTopBtn");
  const imgLightbox = document.getElementById("imgLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxClose = document.getElementById("lightboxClose");
  const imgErrorPanel = document.getElementById("imgErrorPanel");
  const imgErrorToggle = document.getElementById("imgErrorToggle");
  const imgErrorBody = document.getElementById("imgErrorBody");
  const imgErrorList = document.getElementById("imgErrorList");

  menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > 920) return;
    if (sidebar.contains(event.target) || menuBtn.contains(event.target)) return;
    sidebar.classList.remove("open");
  });

  sourceLink.href = SOURCE_URL;

  const htmlResp = await fetch("./article-content.html");

  if (!htmlResp.ok) {
    throw new Error("无法加载文档内容");
  }

  const html = await htmlResp.text();
  if (/^\s*<!doctype html/i.test(html) || /^\s*<html/i.test(html)) {
    throw new Error("文档内容路径无效：部署时未包含 legacy/article-content.html");
  }
  contentEl.innerHTML = html;

  enhanceImportedContent(contentEl);
  const headings = normalizeHeadingIds(contentEl);
  const sections = buildSections(headings);

  buildLeftNav(sections, navEl);
  renderRightNav(sections[0], rightTocEl, rightRailTitle);
  enableActiveTracking(headings, sections, rightTocEl, rightRailTitle);
  enableSearch({
    inputEl: searchInput,
    statEl: searchStat,
    prevBtn: searchPrev,
    nextBtn: searchNext,
    contentRoot: contentEl,
  });
  bindDisplayEnhancements({
    contentEl,
    readProgress,
    backTopBtn,
    imgLightbox,
    lightboxImage,
    lightboxClose,
    imgErrorPanel,
    imgErrorToggle,
    imgErrorBody,
    imgErrorList,
  });

  const videoUrl = resolveTeachingVideoUrl(contentEl);
  if (videoUrl) {
    videoLink.href = videoUrl;
  } else {
    videoLink.style.display = "none";
  }

})().catch((error) => {
  const contentEl = document.getElementById("docContent");
  contentEl.innerHTML = `<p>文档加载失败：${error.message}</p>`;
});

function enhanceImportedContent(root) {
  root.querySelectorAll("script").forEach((node) => node.remove());

  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    if (href.startsWith("http")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  });

  root.querySelectorAll("img").forEach((img) => {
    img.loading = "lazy";
    img.decoding = "async";
  });

  root.querySelectorAll("table").forEach((table) => {
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    table.parentNode.insertBefore(wrap, table);
    wrap.appendChild(table);
  });

  styleLeadOutlineNav(root);
  attachCodeCopyButtons(root);
}

function styleLeadOutlineNav(root) {
  const firstH2 = root.querySelector("h2");
  if (!firstH2) return;

  root.querySelectorAll(".table-wrap").forEach((wrap) => {
    const isBeforeFirstChapter =
      (wrap.compareDocumentPosition(firstH2) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    if (!isBeforeFirstChapter) return;

    const table = wrap.querySelector("table");
    if (!table) return;

    const sections = [];
    let current = null;

    table.querySelectorAll("tr").forEach((tr) => {
      const chapter = tr.querySelector("strong > a");
      if (chapter) {
        current = {
          title: chapter.textContent.trim(),
          href: chapter.getAttribute("href") || "#",
          items: [],
        };
        sections.push(current);
      }

      tr.querySelectorAll("a").forEach((a) => {
        if (chapter && a === chapter) return;
        const text = a.textContent.trim();
        const href = a.getAttribute("href") || "#";
        if (!text || text === "-" || !current) return;
        current.items.push({ text, href });
      });
    });

    const outline = document.createElement("div");
    outline.className = "outline-nav";
    const title = document.createElement("h2");
    title.className = "outline-title";
    title.textContent = "目录";
    outline.appendChild(title);

    sections.forEach((section) => {
      const card = document.createElement("section");
      card.className = "outline-card";

      const h = document.createElement("a");
      h.className = "chapter-link";
      h.href = section.href;
      h.textContent = section.title;
      card.appendChild(h);

      if (section.items.length) {
        const list = document.createElement("div");
        list.className = "outline-list";
        section.items.forEach((item) => {
          const link = document.createElement("a");
          link.className = "outline-link";
          link.href = item.href;
          link.textContent = item.text;
          list.appendChild(link);
        });
        card.appendChild(list);
      }

      outline.appendChild(card);
    });

    wrap.innerHTML = "";
    wrap.appendChild(outline);
  });
}

function bindDisplayEnhancements({
  contentEl,
  readProgress,
  backTopBtn,
  imgLightbox,
  lightboxImage,
  lightboxClose,
  imgErrorPanel,
  imgErrorToggle,
  imgErrorBody,
  imgErrorList,
}) {
  const fallbackSvg =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="440" viewBox="0 0 800 440"><rect width="800" height="440" fill="#f4f5f7"/><rect x="20" y="20" width="760" height="400" rx="16" fill="#ffffff" stroke="#d6d9df"/><text x="400" y="205" font-size="28" text-anchor="middle" fill="#49586a" font-family="Arial,Microsoft YaHei">图片加载失败</text><text x="400" y="250" font-size="18" text-anchor="middle" fill="#7a8794" font-family="Arial,Microsoft YaHei">Image unavailable</text></svg>'
    );
  const failedImages = new Map();
  imgErrorPanel.style.display = "none";

  const syncProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? (window.scrollY / max) * 100 : 0;
    readProgress.style.width = `${Math.min(100, Math.max(0, ratio))}%`;
    backTopBtn.classList.toggle("show", window.scrollY > 420);
  };

  window.addEventListener("scroll", syncProgress, { passive: true });
  window.addEventListener("resize", syncProgress);
  syncProgress();

  backTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  imgErrorToggle.addEventListener("click", () => {
    const open = !imgErrorPanel.classList.contains("open");
    imgErrorPanel.classList.toggle("open", open);
    imgErrorToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  contentEl.querySelectorAll("img").forEach((img) => {
    img.dataset.originalSrc = img.getAttribute("src") || "";
    img.classList.add("zoomable");
    img.addEventListener(
      "error",
      () => {
        const originalSrc = img.dataset.originalSrc || img.src || "unknown";
        if (!failedImages.has(originalSrc)) {
          failedImages.set(originalSrc, `图片资源加载失败：${originalSrc}`);
          renderImageErrors(failedImages, imgErrorPanel, imgErrorToggle, imgErrorBody, imgErrorList);
        }
        img.classList.add("img-fallback");
        if (img.src !== fallbackSvg) img.src = fallbackSvg;
      },
      { once: true }
    );
    img.addEventListener("click", () => {
      if (img.classList.contains("img-fallback")) return;
      lightboxImage.src = img.src;
      lightboxImage.alt = img.alt || "放大预览";
      imgLightbox.classList.add("open");
      imgLightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
    });
  });

  const closeLightbox = () => {
    imgLightbox.classList.remove("open");
    imgLightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.classList.remove("no-scroll");
  };

  lightboxClose.addEventListener("click", closeLightbox);
  imgLightbox.addEventListener("click", (event) => {
    if (event.target === imgLightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && imgLightbox.classList.contains("open")) {
      closeLightbox();
    }
  });
}

function renderImageErrors(failedImages, panelEl, toggleEl, bodyEl, listEl) {
  const count = failedImages.size;
  if (count === 0) {
    panelEl.classList.remove("open", "has-error");
    panelEl.style.display = "none";
    toggleEl.setAttribute("aria-expanded", "false");
    toggleEl.textContent = "图片异常 0";
    bodyEl.querySelector("p").style.display = "";
    listEl.innerHTML = "";
    return;
  }

  panelEl.style.display = "";
  toggleEl.textContent = `图片异常 ${count}`;
  panelEl.classList.toggle("has-error", count > 0);
  bodyEl.querySelector("p").style.display = count > 0 ? "none" : "";
  listEl.innerHTML = "";

  for (const [src, message] of failedImages) {
    const li = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = message;
    const link = document.createElement("a");
    link.href = src;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "打开原图";
    li.append(text, link);
    listEl.appendChild(li);
  }

  panelEl.classList.add("open");
  toggleEl.setAttribute("aria-expanded", "true");
  clearTimeout(panelEl.__autoHideTimer);
  panelEl.__autoHideTimer = setTimeout(() => {
    panelEl.classList.remove("open");
    toggleEl.setAttribute("aria-expanded", "false");
  }, 5000);
}

function resolveTeachingVideoUrl(contentRoot) {
  // Prefer the "01-开篇" section's teaching video link.
  const chapterIntroHeading = contentRoot.querySelector("h3[id*='01'], h3 a[id*='01']");
  if (chapterIntroHeading) {
    const headingEl = chapterIntroHeading.tagName.toLowerCase() === "h3"
      ? chapterIntroHeading
      : chapterIntroHeading.closest("h3");
    let node = headingEl ? headingEl.nextElementSibling : null;
    while (node) {
      if (node.matches("h2, h3")) break;
      const videoAnchor = node.querySelector("a[href*='bilibili.com']");
      if (videoAnchor) return videoAnchor.href;
      node = node.nextElementSibling;
    }
  }

  const fallback = contentRoot.querySelector("a[href*='bilibili.com']");
  return fallback ? fallback.href : "";
}

function attachCodeCopyButtons(root) {
  root.querySelectorAll("pre").forEach((pre) => {
    const wrap = document.createElement("div");
    wrap.className = "code-wrap";
    pre.parentNode.insertBefore(wrap, pre);
    wrap.appendChild(pre);

    const copyBtn = document.createElement("button");
    copyBtn.className = "code-copy-btn";
    copyBtn.type = "button";
    copyBtn.textContent = "复制代码";
    wrap.appendChild(copyBtn);

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        copyBtn.textContent = "已复制";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.textContent = "复制代码";
          copyBtn.classList.remove("copied");
        }, 1200);
      } catch (_) {
        copyBtn.textContent = "复制失败";
        setTimeout(() => {
          copyBtn.textContent = "复制代码";
        }, 1200);
      }
    });
  });
}

function normalizeHeadingIds(root) {
  const headings = Array.from(root.querySelectorAll("h2, h3, h4"));
  const used = new Set();

  return headings.map((heading, idx) => {
    const level = Number(heading.tagName.slice(1));
    const anchorInHeading = heading.querySelector("a[id]");
    let id = heading.id || (anchorInHeading && anchorInHeading.id);

    if (!id) {
      const fallback = heading.textContent
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      id = fallback || `section-${idx + 1}`;
    }

    let deduped = id;
    let count = 1;
    while (used.has(deduped)) {
      deduped = `${id}-${count}`;
      count += 1;
    }
    used.add(deduped);

    heading.id = deduped;
    const text = heading.textContent.replace(/\s+/g, " ").trim();

    return { id: deduped, level, text, element: heading };
  });
}

function buildSections(headings) {
  const sections = [];
  const chapterIndexes = headings
    .map((heading, index) => ({ heading, index }))
    .filter((item) => item.heading.level === 2);

  chapterIndexes.forEach((item, i) => {
    const start = item.index;
    const end = i + 1 < chapterIndexes.length ? chapterIndexes[i + 1].index : headings.length;
    const children = headings.slice(start + 1, end).filter((h) => h.level >= 3);
    sections.push({
      id: item.heading.id,
      text: item.heading.text,
      element: item.heading.element,
      headings: children,
    });
  });

  return sections;
}

function buildLeftNav(sections, container) {
  container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  sections.forEach((section, index) => {
    const group = document.createElement("div");
    group.className = `nav-group${index === 0 ? " open" : ""}`;
    group.dataset.sectionId = section.id;

    const head = document.createElement("div");
    head.className = "nav-group-head";

    const chapterLink = document.createElement("a");
    chapterLink.className = "nav-link level-2";
    chapterLink.href = `#${section.id}`;
    chapterLink.textContent = section.text;
    chapterLink.dataset.target = section.id;
    chapterLink.dataset.section = section.id;

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "nav-toggle-btn";
    toggleBtn.type = "button";
    toggleBtn.textContent = "▾";
    toggleBtn.setAttribute("aria-label", "展开或收起");
    toggleBtn.setAttribute("aria-expanded", index === 0 ? "true" : "false");

    toggleBtn.addEventListener("click", () => {
      const willOpen = !group.classList.contains("open");
      setNavGroupOpen(group, willOpen);
    });

    head.append(chapterLink, toggleBtn);
    group.appendChild(head);

    const children = document.createElement("div");
    children.className = "nav-group-children";
    const subHeadings = section.headings.filter((heading) => heading.level === 3);

    subHeadings.forEach((heading) => {
      const childLink = document.createElement("a");
      childLink.className = "nav-link level-3";
      childLink.href = `#${heading.id}`;
      childLink.textContent = heading.text;
      childLink.dataset.target = heading.id;
      childLink.dataset.section = section.id;
      children.appendChild(childLink);
    });

    if (!subHeadings.length) {
      toggleBtn.disabled = true;
      toggleBtn.classList.add("disabled");
    }

    group.appendChild(children);
    fragment.appendChild(group);
  });

  container.appendChild(fragment);
}

function renderRightNav(section, container, titleEl) {
  container.innerHTML = "";
  if (!section) {
    titleEl.textContent = "当前章节";
    return;
  }

  titleEl.textContent = `当前章节 · ${section.text}`;
  const list = section.headings.length
    ? section.headings
    : [{ id: section.id, text: "章节开头", level: 3 }];

  const fragment = document.createDocumentFragment();
  list.forEach((heading) => {
    const link = document.createElement("a");
    link.className = `toc-link level-${heading.level}`;
    link.href = `#${heading.id}`;
    link.textContent = heading.text;
    link.dataset.target = heading.id;
    fragment.appendChild(link);
  });
  container.appendChild(fragment);
}

function enableActiveTracking(headings, sections, rightTocEl, rightRailTitleEl) {
  const sectionByHeadingId = new Map();
  const headingById = new Map();
  sections.forEach((section) => {
    sectionByHeadingId.set(section.id, section);
    section.headings.forEach((heading) => sectionByHeadingId.set(heading.id, section));
  });
  headings.forEach((heading) => headingById.set(heading.id, heading));

  let activeSectionId = sections[0] ? sections[0].id : "";
  const setActiveLinks = (id) => {
    document.querySelectorAll("[data-target].active").forEach((el) => el.classList.remove("active"));
    document.querySelectorAll(`[data-target="${cssEscape(id)}"]`).forEach((el) => {
      el.classList.add("active");
    });
    const sectionId = sectionByHeadingId.get(id)?.id;
    if (sectionId) {
      const group = document.querySelector(`.nav-group[data-section-id="${cssEscape(sectionId)}"]`);
      if (group) setNavGroupOpen(group, true);
    }
  };
  const activateById = (id) => {
    if (!id || !headingById.has(id)) return;
    const section = sectionByHeadingId.get(id);
    if (section && section.id !== activeSectionId) {
      activeSectionId = section.id;
      renderRightNav(section, rightTocEl, rightRailTitleEl);
    }
    setActiveLinks(id);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible[0]) return;

      const currentId = visible[0].target.id;
      activateById(currentId);
    },
    {
      rootMargin: "-30% 0px -60% 0px",
      threshold: [0, 1],
    }
  );

  headings.forEach((heading) => observer.observe(heading.element));

  document.addEventListener("click", (event) => {
    const link = event.target.closest("[data-target]");
    if (!link) return;
    const id = link.getAttribute("data-target");
    if (!id) return;
    activateById(id);
  });

  window.addEventListener("hashchange", () => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    activateById(id);
  });

  const initialId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (initialId && headingById.has(initialId)) {
    activateById(initialId);
  } else if (headings[0]) {
    activateById(headings[0].id);
  }
}

function setNavGroupOpen(groupEl, open) {
  groupEl.classList.toggle("open", open);
  const btn = groupEl.querySelector(".nav-toggle-btn");
  if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }
  return value.replace(/["\\]/g, "\\$&");
}

function enableSearch({ inputEl, statEl, prevBtn, nextBtn, contentRoot }) {
  const links = Array.from(document.querySelectorAll(".sidebar-nav .nav-link"));
  const groups = Array.from(document.querySelectorAll(".sidebar-nav .nav-group"));
  const searchState = {
    marks: [],
    current: -1,
  };

  const moveCurrent = (step) => {
    if (!searchState.marks.length) return;
    searchState.current =
      (searchState.current + step + searchState.marks.length) %
      searchState.marks.length;
    updateCurrentMark(searchState, statEl);
  };

  prevBtn.addEventListener("click", () => moveCurrent(-1));
  nextBtn.addEventListener("click", () => moveCurrent(1));

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      moveCurrent(event.shiftKey ? -1 : 1);
    }
  });

  inputEl.addEventListener("input", () => {
    const keyword = inputEl.value.trim();
    const lower = keyword.toLowerCase();

    links.forEach((link) => {
      const text = link.textContent.toLowerCase();
      link.style.display = text.includes(lower) ? "" : "none";
    });

    groups.forEach((group) => {
      const chapter = group.querySelector(".nav-link.level-2");
      const children = Array.from(group.querySelectorAll(".nav-group-children .nav-link"));
      const hasVisibleChild = children.some((item) => item.style.display !== "none");
      const chapterVisible = chapter && chapter.style.display !== "none";
      const visible = !keyword || chapterVisible || hasVisibleChild;
      group.style.display = visible ? "" : "none";
      if (keyword && hasVisibleChild) setNavGroupOpen(group, true);
    });

    clearSearchMarks(searchState, statEl);
    if (!keyword) return;

    searchState.marks = highlightInContent(contentRoot, keyword, 120);
    if (searchState.marks.length > 0) {
      searchState.current = 0;
      updateCurrentMark(searchState, statEl);
    } else {
      statEl.textContent = "0 / 0";
    }

  });
}

function highlightInContent(root, keyword, maxHits) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const marks = [];
  const targets = root.querySelectorAll(
    "h2, h3, h4, p, li, td, th, blockquote, figcaption"
  );

  for (const el of targets) {
    if (marks.length >= maxHits) break;
    marks.push(...highlightTextNodeInElement(el, regex, maxHits - marks.length));
  }

  return marks;
}

function highlightTextNodeInElement(element, regex, remaining) {
  const nodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node;

  while ((node = walker.nextNode())) {
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    if (node.parentElement && node.parentElement.closest("mark.search-hit")) continue;
    if (node.parentElement && node.parentElement.closest("pre, code")) continue;
    nodes.push(node);
  }

  const marks = [];

  for (const textNode of nodes) {
    if (marks.length >= remaining) break;
    const text = textNode.nodeValue;
    regex.lastIndex = 0;
    let match;
    let last = 0;
    let changed = false;
    const frag = document.createDocumentFragment();

    while ((match = regex.exec(text)) && marks.length < remaining) {
      changed = true;
      if (match.index > last) {
        frag.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      const mark = document.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = match[0];
      frag.appendChild(mark);
      marks.push(mark);
      last = match.index + match[0].length;
    }

    if (!changed) continue;
    if (last < text.length) {
      frag.appendChild(document.createTextNode(text.slice(last)));
    }
    textNode.parentNode.replaceChild(frag, textNode);
  }

  return marks;
}

function clearSearchMarks(searchState, statEl) {
  document.querySelectorAll("mark.search-hit").forEach((mark) => {
    const textNode = document.createTextNode(mark.textContent);
    mark.parentNode.replaceChild(textNode, mark);
  });
  searchState.marks = [];
  searchState.current = -1;
  statEl.textContent = "0 / 0";
}

function updateCurrentMark(searchState, statEl) {
  searchState.marks.forEach((mark) => mark.classList.remove("current"));
  const currentMark = searchState.marks[searchState.current];
  if (!currentMark) {
    statEl.textContent = "0 / 0";
    return;
  }

  currentMark.classList.add("current");
  currentMark.scrollIntoView({ block: "center", behavior: "smooth" });
  statEl.textContent = `${searchState.current + 1} / ${searchState.marks.length}`;
}
