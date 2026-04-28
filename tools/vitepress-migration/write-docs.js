const fs = require("fs");
const path = require("path");
const { DOCS_ROOT, DOCS_CHAPTERS_DIR, DOCS_PUBLIC_CHUNKS_DIR } = require("./constants");
const { ensureDir, cleanDir } = require("./fs-utils");
const { htmlToMarkdown } = require("./html-to-markdown");
const {
  stripRedundantLeadHeading,
  normalizeMarkdownSpacing,
  buildPrefaceListFromModel,
  unescapeStrongMarkers,
  splitLeadStrongSentence,
  unescapeUnderscoreInText,
} = require("./markdown-postprocess");

function sanitizeMarkdown(md) {
  return normalizeMarkdownSpacing(
    unescapeUnderscoreInText(splitLeadStrongSentence(unescapeStrongMarkers(md)))
  );
}

function writeHomePage(model) {
  const chapterLinks = model.chapters
    .map((chapter) => `- [${chapter.title}](${chapter.route})`)
    .join("\n");
  const prefaceMd = buildPrefaceListFromModel(model);

  const content = `# Elasticsearch 学习笔记

> 本站为章节化维护版本，内容来源于原文并按章节/子章节拆分。

<a href="/legacy/index.html" target="_blank" rel="noopener noreferrer">打开单页阅读风格</a>

## 章节目录

${chapterLinks}

${prefaceMd}
`;
  fs.writeFileSync(path.join(DOCS_ROOT, "index.md"), content, "utf8");
}

function writeChapterPages(model) {
  cleanDir(DOCS_CHAPTERS_DIR);
  // Cleanup legacy chunk-based output.
  cleanDir(DOCS_PUBLIC_CHUNKS_DIR);
  ensureDir(DOCS_CHAPTERS_DIR);

  model.chapters.forEach((chapter) => {
    const chapterDir = path.join(DOCS_CHAPTERS_DIR, chapter.slug);
    ensureDir(chapterDir);

    const sectionLinks = chapter.sections
      .map((section) => `- [${section.title}](${section.route})`)
      .join("\n");
    const introMd = sanitizeMarkdown(htmlToMarkdown(chapter.introHtml));

    const chapterIndexContent = `# ${chapter.title}

${sectionLinks ? `## 子章节\n\n${sectionLinks}\n\n` : ""}${introMd}
`;
    fs.writeFileSync(path.join(chapterDir, "index.md"), chapterIndexContent, "utf8");

    chapter.sections.forEach((section) => {
      const rawSectionMd = sanitizeMarkdown(htmlToMarkdown(section.html));
      const sectionMd = sanitizeMarkdown(stripRedundantLeadHeading(section.title, rawSectionMd));
      const sectionContent = `# ${section.title}

${sectionMd}
`;
      fs.writeFileSync(path.join(chapterDir, section.fileName), sectionContent, "utf8");
    });
  });
}

function writeDocs(model) {
  writeHomePage(model);
  writeChapterPages(model);
}

module.exports = {
  writeDocs,
};
