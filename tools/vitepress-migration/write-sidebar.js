const fs = require("fs");
const { SIDEBAR_FILE } = require("./constants");

function toSidebarTs(model) {
  const chapterItems = model.chapters
    .map((chapter) => {
      const childItems = chapter.sections
        .map((section) => `            { text: ${JSON.stringify(section.title)}, link: ${JSON.stringify(section.route)} },`)
        .join("\n");

      return `        {
          text: ${JSON.stringify(chapter.title)},
          collapsed: false,
          items: [
            { text: "章节总览", link: ${JSON.stringify(chapter.route)} },
${childItems}
          ],
        },`;
    })
    .join("\n");

  return `export const sidebar = {
  "/chapters/": [
    {
      text: "文档目录",
      items: [
${chapterItems}
      ],
    },
  ],
};
`;
}

function writeSidebar(model) {
  fs.writeFileSync(SIDEBAR_FILE, toSidebarTs(model), "utf8");
}

module.exports = {
  writeSidebar,
};
