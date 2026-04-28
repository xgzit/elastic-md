const TurndownService = require("turndown");
const { gfm } = require("turndown-plugin-gfm");
const { decodeHtmlEntities } = require("./text-utils");

function createConverter() {
  const service = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    strongDelimiter: "**",
  });

  service.use(gfm);

  service.addRule("dropAnchorId", {
    filter: (node) => node.nodeName === "A" && node.getAttribute("id"),
    replacement: (content) => content || "",
  });

  service.addRule("normalizeImg", {
    filter: "img",
    replacement: (_, node) => {
      const src = node.getAttribute("src") || "";
      const alt = decodeHtmlEntities(node.getAttribute("alt") || "");
      return src ? `![${alt}](${src})` : "";
    },
  });

  return service;
}

function normalizeHtml(html) {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<span[^>]*class=["'][^"']*token[^"']*["'][^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/\u00a0/g, " ");
}

function decodeMarkdownText(md) {
  // Decode numeric entities and ampersand, keep lt/gt as-is to avoid accidental HTML tags.
  return String(md || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&amp;/g, "&");
}

function extractCodeBlocks(html) {
  const blocks = [];
  const tokenPrefix = "CODEBLOCKTOKENX";
  const replaced = String(html || "").replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (full) => {
    const preClass = (full.match(/<pre[^>]*class=["']([^"']+)["']/i) || [])[1] || "";
    const codeClass = (full.match(/<code[^>]*class=["']([^"']+)["']/i) || [])[1] || "";
    const langMatch = `${preClass} ${codeClass}`.match(/language-([a-z0-9_-]+)/i);
    const lang = langMatch ? langMatch[1] : "";

    let inner = full
      .replace(/^<pre\b[^>]*>/i, "")
      .replace(/<\/pre>$/i, "")
      .replace(/^<code\b[^>]*>/i, "")
      .replace(/<\/code>$/i, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<span[^>]*>/gi, "")
      .replace(/<\/span>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n");

    inner = decodeHtmlEntities(inner).replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
    const mdBlock = `\n\n\`\`\`${lang}\n${inner}\n\`\`\`\n\n`;
    const index = blocks.push(mdBlock) - 1;
    return `\n\n${tokenPrefix}${index}X\n\n`;
  });
  return { replaced, blocks, tokenPrefix };
}

function htmlToMarkdown(html) {
  const service = createConverter();
  const { replaced, blocks, tokenPrefix } = extractCodeBlocks(html);
  const normalized = normalizeHtml(replaced);
  const rawMd = service.turndown(normalized);
  const withBlocks = rawMd.replace(new RegExp(`${tokenPrefix}(\\d+)X`, "g"), (_, i) => {
    return blocks[Number(i)] || "";
  });
  return decodeMarkdownText(
    withBlocks
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
  );
}

module.exports = {
  htmlToMarkdown,
};
