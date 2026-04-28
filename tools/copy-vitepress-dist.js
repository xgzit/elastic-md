const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const fromDir = path.join(root, "docs", ".vitepress", "dist");
const toDir = path.join(root, "dist");

if (!fs.existsSync(fromDir)) {
  throw new Error(`VitePress dist not found: ${fromDir}`);
}

if (fs.existsSync(toDir)) {
  fs.rmSync(toDir, { recursive: true, force: true });
}
fs.mkdirSync(toDir, { recursive: true });
fs.cpSync(fromDir, toDir, { recursive: true });

console.log(`copied: ${fromDir} -> ${toDir}`);
