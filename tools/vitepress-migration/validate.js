const fs = require("fs");
const path = require("path");
const { DOCS_CHAPTERS_DIR, DOCS_PUBLIC_IMAGE_DIR } = require("./constants");
const { findHeadings } = require("./parse-source");

function readAllMarkdown(rootDir) {
  const result = [];
  if (!fs.existsSync(rootDir)) return result;
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && full.endsWith(".md")) result.push(full);
    }
  }
  return result;
}

function validateMigration(sourceHtml, model) {
  const sourceH2 = findHeadings(sourceHtml, 2).length;
  const sourceH3 = findHeadings(sourceHtml, 3).length;
  const modelH2 = model.chapters.length;
  const modelH3 = model.chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0);

  const mdFiles = readAllMarkdown(DOCS_CHAPTERS_DIR);
  const imageFileCount = fs.existsSync(DOCS_PUBLIC_IMAGE_DIR)
    ? fs.readdirSync(DOCS_PUBLIC_IMAGE_DIR).filter((name) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(name)).length
    : 0;
  const sourceImageRefCount = (sourceHtml.match(/\/article-images\//g) || []).length;

  return {
    sourceH2,
    sourceH3,
    modelH2,
    modelH3,
    generatedMarkdownFiles: mdFiles.length,
    sourceImageRefCount,
    copiedImageFiles: imageFileCount,
    pass: sourceH2 === modelH2 && sourceH3 === modelH3 && imageFileCount > 0,
  };
}

module.exports = {
  validateMigration,
};
