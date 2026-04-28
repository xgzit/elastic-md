const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "docs", ".vitepress", "dist");

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
  console.log("cleaned:", distDir);
} else {
  console.log("skip clean, not found:", distDir);
}
