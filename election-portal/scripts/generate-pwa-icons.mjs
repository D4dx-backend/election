/**
 * Generates all required PWA icon assets from the official Vote+ brand images.
 * Source images live in election-api/assets/img/ (app-icon.png, logo.png).
 * Run once: node scripts/generate-pwa-icons.mjs
 * Output: client/public/
 */

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../client/public");
const ASSETS_DIR = path.resolve(
  __dirname,
  "../../election-api/assets/img"
);

// app-icon.png is the square icon (white bg + rounded corners) — ideal for PWA icons.
// logo.png is the wide wordmark — used for logo.png copy only.
const APP_ICON_SRC = path.join(ASSETS_DIR, "app-icon.png");
const LOGO_SRC     = path.join(ASSETS_DIR, "logo.png");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ─── Standard square icons (resized from app-icon.png) ────────────────────────
const squareJobs = [
  { size: 512, file: "pwa-512x512.png" },
  { size: 192, file: "pwa-192x192.png" },
  { size: 180, file: "apple-touch-icon.png" },
  { size: 64,  file: "app-icon.png" },
];

// ─── Maskable icon — white background with the logo centred and padded ─────────
// PWA maskable icons need the key content inside the "safe zone" (centre 80%).
// We composite the logo onto a white square with generous padding.
async function generateMaskable(outFile, size) {
  const padding = Math.round(size * 0.15); // 15% padding on each side
  const innerSize = size - padding * 2;

  const logoResized = await sharp(APP_ICON_SRC)
    .resize(innerSize, innerSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: logoResized, top: padding, left: padding }])
    .png()
    .toFile(outFile);
}

console.log("Generating PWA icons from official Vote+ branding...\n");

for (const { size, file } of squareJobs) {
  const outPath = path.join(OUTPUT_DIR, file);
  await sharp(APP_ICON_SRC)
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(outPath);
  console.log(`  ✓  ${file}  (${size}×${size})`);
}

// Maskable variant
const maskablePath = path.join(OUTPUT_DIR, "maskable-512x512.png");
await generateMaskable(maskablePath, 512);
console.log(`  ✓  maskable-512x512.png  (512×512)`);

// Copy original logo.png (wordmark) as-is
fs.copyFileSync(LOGO_SRC, path.join(OUTPUT_DIR, "logo.png"));
console.log(`  ✓  logo.png  (original wordmark)`);

console.log("\nAll icons generated in client/public/");
