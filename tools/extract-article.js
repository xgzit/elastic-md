const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INPUT_FILE = path.join(ROOT, "article.html");
const OUTPUT_DIR = path.join(ROOT, "public", "data");
const OUTPUT_HTML = path.join(OUTPUT_DIR, "article-content.html");
const OUTPUT_META = path.join(OUTPUT_DIR, "meta.json");
const SOURCE_URL = "https://blog.csdn.net/u011863024/article/details/115721328";

function extractContentViews(html) {
  const openMatch = html.match(
    /<div\s+id=["']content_views["'][^>]*>/i
  );
  if (!openMatch || openMatch.index == null) {
    throw new Error("Cannot find #content_views in source HTML");
  }

  const openStart = openMatch.index;
  const openEnd = openStart + openMatch[0].length;

  const tagRegex = /<\/?div\b[^>]*>/gi;
  tagRegex.lastIndex = openEnd;

  let depth = 1;
  let endIndex = -1;
  let match;

  while ((match = tagRegex.exec(html))) {
    const tag = match[0];
    if (tag.startsWith("</")) {
      depth -= 1;
      if (depth === 0) {
        endIndex = match.index;
        break;
      }
    } else {
      depth += 1;
    }
  }

  if (endIndex < 0) {
    throw new Error("Cannot find closing tag for #content_views");
  }

  return html.slice(openEnd, endIndex);
}

function cleanContent(content) {
  let output = content.replace(/\r\n/g, "\n");

  output = output.replace(/<script\b[\s\S]*?<\/script>/gi, "");
  output = output.replace(/^\s*<svg[\s\S]*?<\/svg>\s*/i, "");

  // CSDN sometimes uses data-src. Normalize to src so local rendering is stable.
  output = output.replace(
    /<img([^>]*?)\sdata-src=(["'])(.*?)\2([^>]*?)>/gi,
    '<img$1 src="$3"$4>'
  );

  output = output.replace(/^\s+|\s+$/g, "");
  return output;
}

function extractTitle(html) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "Elasticsearch学习笔记";
}

function main() {
  const source = fs.readFileSync(INPUT_FILE, "utf8");
  const rawContent = extractContentViews(source);
  const cleanedContent = cleanContent(rawContent);
  const title = extractTitle(source);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_HTML, cleanedContent, "utf8");

  const meta = {
    title,
    sourceUrl: SOURCE_URL,
    extractedAt: new Date().toISOString(),
    contentLength: cleanedContent.length,
  };
  fs.writeFileSync(OUTPUT_META, JSON.stringify(meta, null, 2), "utf8");

  console.log(
    `Extracted content saved: ${path.relative(ROOT, OUTPUT_HTML)} (${cleanedContent.length} chars)`
  );
}

main();
