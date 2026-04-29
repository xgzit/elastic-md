const OVERLAY_ID = "vp-download-captcha-overlay";

function randomCode(len = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function drawCaptcha(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 6; i += 1) {
    ctx.strokeStyle = `rgba(120,140,170,${0.2 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(Math.random() * width, Math.random() * height);
    ctx.lineTo(Math.random() * width, Math.random() * height);
    ctx.stroke();
  }

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const x = 14 + i * 24;
    const y = 30 + Math.random() * 8;
    const angle = ((Math.random() - 0.5) * 36 * Math.PI) / 180;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = "bold 24px Arial";
    ctx.fillStyle = ["#1e3a8a", "#0f766e", "#7c2d12", "#334155"][i % 4];
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }
}

function ensureOverlay(): HTMLElement {
  let overlay = document.getElementById(OVERLAY_ID);
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "vp-captcha-overlay";
  overlay.innerHTML = `
    <div class="vp-captcha-modal" role="dialog" aria-modal="true" aria-label="下载验证">
      <h4>下载验证</h4>
      <p>请输入图形验证码后下载文件。</p>
      <div class="vp-captcha-row">
        <canvas width="130" height="44"></canvas>
        <button type="button" class="vp-captcha-refresh">换一张</button>
      </div>
      <input class="vp-captcha-input" type="text" placeholder="输入验证码" maxlength="8" />
      <p class="vp-captcha-error" aria-live="polite"></p>
      <div class="vp-captcha-actions">
        <button type="button" class="vp-captcha-cancel">取消</button>
        <button type="button" class="vp-captcha-confirm">验证并下载</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

export function setupDownloadCaptcha() {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('a[data-captcha-download="true"]')
  );
  if (!links.length) return;

  const overlay = ensureOverlay();
  const canvas = overlay.querySelector("canvas") as HTMLCanvasElement;
  const input = overlay.querySelector(".vp-captcha-input") as HTMLInputElement;
  const error = overlay.querySelector(".vp-captcha-error") as HTMLElement;
  const refresh = overlay.querySelector(".vp-captcha-refresh") as HTMLButtonElement;
  const cancel = overlay.querySelector(".vp-captcha-cancel") as HTMLButtonElement;
  const confirm = overlay.querySelector(".vp-captcha-confirm") as HTMLButtonElement;

  let currentCode = "";
  let targetUrl = "";

  const refreshCode = () => {
    currentCode = randomCode();
    drawCaptcha(canvas, currentCode);
    input.value = "";
    error.textContent = "";
  };

  const open = (url: string) => {
    targetUrl = url;
    overlay.classList.add("open");
    refreshCode();
    setTimeout(() => input.focus(), 10);
  };

  const close = () => {
    overlay.classList.remove("open");
  };

  links.forEach((link) => {
    if (link.dataset.captchaBound === "1") return;
    link.dataset.captchaBound = "1";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      open(link.getAttribute("href") || "");
    });
  });

  refresh.onclick = refreshCode;
  cancel.onclick = close;
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  confirm.onclick = () => {
    if (input.value.trim().toUpperCase() !== currentCode) {
      error.textContent = "验证码错误，请重试。";
      refreshCode();
      return;
    }
    close();
    const a = document.createElement("a");
    a.href = targetUrl;
    a.download = "";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
}

