const fs = require("fs");
const { SOURCE_HTML } = require("./constants");
const { buildDocModel } = require("./parse-source");
const { writeDocs } = require("./write-docs");
const { writeSidebar } = require("./write-sidebar");
const { copyImageAssets } = require("./copy-assets");
const { validateMigration } = require("./validate");

function main() {
  const sourceHtml = fs.readFileSync(SOURCE_HTML, "utf8");
  const model = buildDocModel(sourceHtml);

  writeDocs(model);
  writeSidebar(model);
  copyImageAssets();

  const report = validateMigration(model.normalizedHtml, model);
  console.log("Migration report:", JSON.stringify(report, null, 2));

  if (!report.pass) {
    throw new Error("Migration validation failed: chapter/section/image checks did not pass.");
  }
}

main();
