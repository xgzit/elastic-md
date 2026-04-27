const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const tasks = [
  {
    from: path.join(ROOT, "public", "data"),
    to: path.join(ROOT, "dist", "data"),
  },
  {
    from: path.join(ROOT, "public", "assets", "article-images"),
    to: path.join(ROOT, "dist", "assets", "article-images"),
  },
];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const fromPath = path.join(src, entry.name);
    const toPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(fromPath, toPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(fromPath, toPath);
    }
  }
}

for (const task of tasks) {
  copyDir(task.from, task.to);
  console.log(`copied: ${path.relative(ROOT, task.from)} -> ${path.relative(ROOT, task.to)}`);
}
