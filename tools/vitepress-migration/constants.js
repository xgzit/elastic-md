const path = require("path");

const ROOT = path.resolve(__dirname, "../..");

module.exports = {
  ROOT,
  SOURCE_HTML: path.join(ROOT, "public", "data", "article-content.html"),
  DOCS_ROOT: path.join(ROOT, "docs"),
  DOCS_CHAPTERS_DIR: path.join(ROOT, "docs", "chapters"),
  DOCS_PUBLIC_IMAGE_DIR: path.join(ROOT, "docs", "public", "article-images"),
  DOCS_PUBLIC_LEGACY_DIR: path.join(ROOT, "docs", "public", "legacy"),
  DOCS_PUBLIC_CHUNKS_DIR: path.join(ROOT, "docs", "public", "chunks"),
  SIDEBAR_FILE: path.join(ROOT, "docs", ".vitepress", "sidebar.ts"),
};
