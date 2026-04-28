const { stripTags, slugify, pad2, decodeHtmlEntities } = require("./text-utils");

function parseHeadingTag(rawTag) {
  const idMatch = rawTag.match(/\sid=["']([^"']+)["']/i) || rawTag.match(/<a\s+id=["']([^"']+)["']/i);
  return {
    id: idMatch ? idMatch[1] : "",
    text: decodeHtmlEntities(stripTags(rawTag)),
  };
}

function findHeadings(html, level) {
  const regex = new RegExp(`<h${level}[^>]*>[\\s\\S]*?<\\/h${level}>`, "gi");
  const items = [];
  let match;
  while ((match = regex.exec(html))) {
    const raw = match[0];
    const meta = parseHeadingTag(raw);
    items.push({
      level,
      raw,
      start: match.index,
      end: match.index + raw.length,
      id: meta.id,
      text: meta.text,
    });
  }
  return items;
}

function normalizeSourceHtml(sourceHtml) {
  return sourceHtml.replace(/\.\/assets\/article-images\//g, "/article-images/");
}

function buildDocModel(sourceHtml) {
  const normalized = normalizeSourceHtml(sourceHtml);
  const h2 = findHeadings(normalized, 2);
  const h3 = findHeadings(normalized, 3);

  if (!h2.length) {
    throw new Error("No chapter headings (h2) found in source HTML.");
  }

  const prefaceHtml = normalized.slice(0, h2[0].start).trim();
  const chapters = h2.map((chapterHeading, chapterIndex) => {
    const chapterStart = chapterHeading.start;
    const chapterEnd = chapterIndex + 1 < h2.length ? h2[chapterIndex + 1].start : normalized.length;
    const chapterHtml = normalized.slice(chapterStart, chapterEnd).trim();

    const chapterH3 = h3.filter((item) => item.start > chapterStart && item.start < chapterEnd);
    const introStart = chapterHeading.end;
    const introEnd = chapterH3.length ? chapterH3[0].start : chapterEnd;
    const introHtml = normalized.slice(introStart, introEnd).trim();

    const chapterSlug = `chapter-${pad2(chapterIndex + 1)}`;
    const sections = chapterH3.map((sectionHeading, sectionIndex) => {
      const sectionStart = sectionHeading.start;
      const sectionEnd =
        sectionIndex + 1 < chapterH3.length ? chapterH3[sectionIndex + 1].start : chapterEnd;
      const sectionHtml = normalized.slice(sectionStart, sectionEnd).trim();
      const fileSlug = slugify(sectionHeading.text, `section-${pad2(sectionIndex + 1)}`);
      return {
        index: sectionIndex + 1,
        id: sectionHeading.id || `section-${chapterIndex + 1}-${sectionIndex + 1}`,
        title: sectionHeading.text,
        fileName: `${pad2(sectionIndex + 1)}-${fileSlug}.md`,
        route: `/chapters/${chapterSlug}/${pad2(sectionIndex + 1)}-${fileSlug}`,
        html: sectionHtml,
      };
    });

    return {
      index: chapterIndex + 1,
      id: chapterHeading.id || `chapter-${chapterIndex + 1}`,
      title: chapterHeading.text,
      slug: chapterSlug,
      route: `/chapters/${chapterSlug}/`,
      html: chapterHtml,
      introHtml,
      sections,
    };
  });

  return {
    normalizedHtml: normalized,
    prefaceHtml,
    chapters,
    stats: {
      h2Count: h2.length,
      h3Count: h3.length,
    },
  };
}

module.exports = {
  buildDocModel,
  findHeadings,
};
