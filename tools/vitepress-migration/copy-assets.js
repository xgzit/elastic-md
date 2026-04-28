const fs = require("fs");
const path = require("path");
const { SOURCE_HTML, DOCS_PUBLIC_IMAGE_DIR, DOCS_PUBLIC_LEGACY_DIR } = require("./constants");
const { ensureDir } = require("./fs-utils");

function copyImageAssets() {
  // Images are localized directly to docs/public/article-images in localize-images.js.
  ensureDir(DOCS_PUBLIC_IMAGE_DIR);
  ensureDir(DOCS_PUBLIC_LEGACY_DIR);
  fs.copyFileSync(SOURCE_HTML, path.join(DOCS_PUBLIC_LEGACY_DIR, "article-content.html"));
}

module.exports = {
  copyImageAssets,
};
