// Generates a 1024x1024 PNG app icon using only Node.js built-ins
// Outputs to ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

const SIZE = 1024;
const pixels = Buffer.alloc(SIZE * SIZE * 4); // RGBA

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  // Alpha blend
  const srcA = a / 255;
  const dstA = pixels[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA > 0) {
    pixels[i]     = Math.round((r * srcA + pixels[i]     * dstA * (1 - srcA)) / outA);
    pixels[i + 1] = Math.round((g * srcA + pixels[i + 1] * dstA * (1 - srcA)) / outA);
    pixels[i + 2] = Math.round((b * srcA + pixels[i + 2] * dstA * (1 - srcA)) / outA);
    pixels[i + 3] = Math.round(outA * 255);
  }
}

function fillCircle(cx, cy, radius, r, g, b, a = 255) {
  const r2 = radius * radius;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= r2) {
        setPixel(Math.round(cx + dx), Math.round(cy + dy), r, g, b, a);
      }
    }
  }
}

function fillRect(x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(x + dx, y + dy, r, g, b, a);
    }
  }
}

function drawLine(x0, y0, x1, y1, r, g, b, a = 255, thickness = 3) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const cx = Math.round(x0 + dx * t);
    const cy = Math.round(y0 + dy * t);
    fillCircle(cx, cy, thickness, r, g, b, a);
  }
}

// 1. Fill background with purple gradient
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const t = (x + y) / (SIZE * 2);
    const r = Math.round(88 + t * 20);   // 88 → 108
    const g = Math.round(86 + t * (-20)); // 86 → 66
    const b = Math.round(214 + t * (-2)); // 214 → 212
    setPixel(x, y, r, g, b, 255);
  }
}

// 2. Radial highlight top-left
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - SIZE * 0.3, dy = y - SIZE * 0.25;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < SIZE * 0.5) {
      const alpha = Math.round(35 * (1 - d / (SIZE * 0.5)));
      setPixel(x, y, 255, 255, 255, alpha);
    }
  }
}

// 3. Brain circle (white, centered upper area)
const brainCX = SIZE / 2;
const brainCY = SIZE * 0.40;
const brainR = 220;
fillCircle(brainCX, brainCY, brainR, 255, 255, 255, 240);

// 4. Thought bubble dots
fillCircle(brainCX - 120, brainCY + 200, 50, 255, 255, 255, 240);
fillCircle(brainCX - 190, brainCY + 275, 28, 255, 255, 255, 240);

// 5. Neural network inside brain
const purple = [88, 86, 214];
const nodes = [
  [brainCX,      brainCY - 70,  20],
  [brainCX - 80, brainCY + 20,  16],
  [brainCX + 80, brainCY + 20,  16],
  [brainCX - 40, brainCY - 110, 12],
  [brainCX + 40, brainCY - 110, 12],
  [brainCX,      brainCY + 70,  14],
  [brainCX - 100,brainCY - 40,  10],
  [brainCX + 100,brainCY - 40,  10],
];

// Connection lines
const conns = [[0,1],[0,2],[0,5],[1,3],[2,4],[3,4],[1,6],[2,7],[5,1],[5,2]];
for (const [a, b] of conns) {
  drawLine(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], ...purple, 100, 2);
}

// Node dots
for (const [cx, cy, r] of nodes) {
  fillCircle(cx, cy, r, ...purple, 230);
}

// 6. "MeCo" text — draw as simple pixel art letters (large)
// Since we can't use fonts, draw blocky but clean letters
const letterY = SIZE * 0.78;
const letterH = 70;
const letterW = 50;
const gap = 20;
const totalW = letterW * 4 + gap * 3;
const startX = (SIZE - totalW) / 2;

function drawLetter(letter, baseX, baseY, w, h) {
  const c = [255, 255, 255, 240];
  const t = 12; // thickness
  switch(letter) {
    case 'M':
      fillRect(baseX, baseY, t, h, ...c);
      fillRect(baseX + w - t, baseY, t, h, ...c);
      // diagonals approximated
      for (let i = 0; i < h/2; i++) {
        fillRect(baseX + t + Math.round(i * (w/2 - t) / (h/2)), baseY + i, t, t, ...c);
        fillRect(baseX + w - t - Math.round(i * (w/2 - t) / (h/2)), baseY + i, t, t, ...c);
      }
      break;
    case 'e':
      fillRect(baseX, baseY, t, h, ...c);
      fillRect(baseX, baseY, w, t, ...c);
      fillRect(baseX, baseY + h/2 - t/2, w * 0.8, t, ...c);
      fillRect(baseX, baseY + h - t, w, t, ...c);
      break;
    case 'C':
      fillRect(baseX, baseY, t, h, ...c);
      fillRect(baseX, baseY, w, t, ...c);
      fillRect(baseX, baseY + h - t, w, t, ...c);
      break;
    case 'o':
      fillRect(baseX, baseY, t, h, ...c);
      fillRect(baseX + w - t, baseY, t, h, ...c);
      fillRect(baseX, baseY, w, t, ...c);
      fillRect(baseX, baseY + h - t, w, t, ...c);
      break;
  }
}

drawLetter('M', startX, letterY, letterW, letterH);
drawLetter('e', startX + letterW + gap, letterY, letterW, letterH);
drawLetter('C', startX + (letterW + gap) * 2, letterY, letterW, letterH);
drawLetter('o', startX + (letterW + gap) * 3, letterY, letterW, letterH);

// 7. "AI" subtitle
const aiY = letterY + letterH + 25;
const aiH = 40;
const aiW = 30;
const aiGap = 15;
const aiStartX = (SIZE - (aiW * 2 + aiGap)) / 2;

// A
fillRect(aiStartX, aiY, 8, aiH, 255, 255, 255, 180);
fillRect(aiStartX + aiW - 8, aiY, 8, aiH, 255, 255, 255, 180);
fillRect(aiStartX, aiY, aiW, 8, 255, 255, 255, 180);
fillRect(aiStartX, aiY + aiH/2 - 4, aiW, 8, 255, 255, 255, 180);

// I
fillRect(aiStartX + aiW + aiGap + aiW/2 - 4, aiY, 8, aiH, 255, 255, 255, 180);

// ── Encode as PNG ──

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crc32Table[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}
const crc32Table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crc32Table[i] = c;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData));
  return Buffer.concat([len, typeData, crc]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

// Raw image data with filter byte per row
const rawRows = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  rawRows[y * (SIZE * 4 + 1)] = 0; // no filter
  pixels.copy(rawRows, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const compressed = deflateSync(rawRows);

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

const outPath = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png';
writeFileSync(outPath, png);
console.log(`Written ${png.length} bytes to ${outPath}`);
