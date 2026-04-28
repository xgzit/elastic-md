const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const https = require("https");
const { URL } = require("url");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_FILE = path.join(ROOT, "public", "data", "article-content.html");
const IMAGE_DIR = path.join(ROOT, "docs", "public", "article-images");
const MAX_REDIRECTS = 5;

function getExtFromUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const ext = path.extname(u.pathname).toLowerCase();
    if (ext && ext.length <= 6) return ext;
  } catch (_) {}
  return ".png";
}

function extractImageUrls(html) {
  const urls = [];
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html))) {
    const src = (match[1] || "").trim();
    if (/^https?:\/\//i.test(src)) urls.push(src);
  }
  return Array.from(new Set(urls));
}

function requestBuffer(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https://");
    const lib = isHttps ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://blog.csdn.net/",
        },
        // For static asset migration links, allow TLS fallback when local machine trust is incomplete.
        rejectUnauthorized: false,
        timeout: 20000,
      },
      (res) => {
        const code = res.statusCode || 0;
        const location = res.headers.location;
        if (code >= 300 && code < 400 && location) {
          if (redirects >= MAX_REDIRECTS) {
            reject(new Error(`Too many redirects: ${url}`));
            return;
          }
          const nextUrl = new URL(location, url).toString();
          resolve(requestBuffer(nextUrl, redirects + 1));
          return;
        }
        if (code < 200 || code >= 300) {
          reject(new Error(`HTTP ${code}: ${url}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      }
    );

    req.on("timeout", () => req.destroy(new Error(`Timeout: ${url}`)));
    req.on("error", reject);
    req.end();
  });
}

function fileNameFor(url) {
  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 16);
  return `${hash}${getExtFromUrl(url)}`;
}

async function main() {
  if (!fs.existsSync(CONTENT_FILE)) {
    throw new Error(`Missing file: ${CONTENT_FILE}`);
  }

  fs.mkdirSync(IMAGE_DIR, { recursive: true });
  let html = fs.readFileSync(CONTENT_FILE, "utf8");
  const urls = extractImageUrls(html);

  let ok = 0;
  let fail = 0;
  for (const url of urls) {
    const name = fileNameFor(url);
    const target = path.join(IMAGE_DIR, name);
    const localSrc = `/article-images/${name}`;
    try {
      if (!fs.existsSync(target)) {
        const data = await requestBuffer(url);
        fs.writeFileSync(target, data);
      }
      const escapedUrl = url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      html = html.replace(new RegExp(escapedUrl, "g"), localSrc);
      ok += 1;
      console.log(`ok   ${url}`);
    } catch (err) {
      fail += 1;
      console.warn(`fail ${url} -> ${err.message}`);
    }
  }

  fs.writeFileSync(CONTENT_FILE, html, "utf8");
  console.log(`localized images: ${ok} success, ${fail} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
