function escapeRegExp(input) {
  return String(input || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripRedundantLeadHeading(title, mdBody) {
  const titleEscaped = escapeRegExp(String(title || "").trim());
  if (!titleEscaped) return mdBody;

  const lines = String(mdBody || "").split("\n");
  let idx = 0;
  while (idx < lines.length && !lines[idx].trim()) idx += 1;
  if (idx >= lines.length) return mdBody;

  const headingRegex = new RegExp(`^#{2,6}\\s+${titleEscaped}\\s*$`);
  if (headingRegex.test(lines[idx].trim())) {
    lines.splice(idx, 1);
    while (idx < lines.length && !lines[idx].trim()) lines.splice(idx, 1);
  }

  return lines.join("\n");
}

function normalizeMarkdownSpacing(md) {
  return String(md || "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function unescapeStrongMarkers(md) {
  const lines = String(md || "").split("\n");
  let inCodeFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    lines[i] = line
      .replace(/\\\\\*\\\\\*/g, "**")
      .replace(/\\\*\\\*/g, "**");
  }
  return lines.join("\n");
}

function splitLeadStrongSentence(md) {
  const input = String(md || "");
  const segments = input.split(/(```[\s\S]*?```)/g);
  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i].startsWith("```")) continue;
    segments[i] = segments[i].replace(
      /(\*\*[^*\n]*?[。！？!?]\*\*)(?=[\u4e00-\u9fa5A-Za-z0-9])/g,
      "$1\n\n"
    );
  }
  return segments.join("");
}

function unescapeUnderscoreInText(md) {
  const lines = String(md || "").split("\n");
  let inCodeFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    lines[i] = line.replace(/\\_(?=[A-Za-z0-9])/g, "_");
  }
  return lines.join("\n");
}

function buildPrefaceListFromModel(model) {
  const blocks = ["## 目录", ""];
  model.chapters.forEach((chapter) => {
    blocks.push(`### [${chapter.title}](${chapter.route})`);
    blocks.push("");
    chapter.sections.forEach((section) => {
      blocks.push(`- [${section.title}](${section.route})`);
    });
    blocks.push("");
  });
  return normalizeMarkdownSpacing(blocks.join("\n"));
}

module.exports = {
  stripRedundantLeadHeading,
  normalizeMarkdownSpacing,
  buildPrefaceListFromModel,
  unescapeStrongMarkers,
  splitLeadStrongSentence,
  unescapeUnderscoreInText,
};
