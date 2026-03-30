// Generates a 2732x2732 splash screen PNG
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

const SIZE = 2732;
const pixels = Buffer.alloc(SIZE * SIZE * 4);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
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

function drawLine(x0, y0, x1, y1, r, g, b, a = 255, thickness = 5) {
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const cx = Math.round(x0 + dx * t);
    const cy = Math.round(y0 + dy * t);
    fillCircle(cx, cy, thickness, r, g, b, a);
  }
}

console.log("Filling background...");
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const t = (x + y) / (SIZE * 2);
    const r = Math.round(88 + t * 20);
    const g = Math.round(86 + t * (-20));
    const b = Math.round(214 + t * (-2));
    setPixel(x, y, r, g, b, 255);
  }
}

console.log("Drawing icon...");
// Radial highlight
const cx = SIZE / 2, cy = SIZE / 2;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const dx = x - SIZE * 0.4, dy = y - SIZE * 0.35;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < SIZE * 0.35) {
      const alpha = Math.round(25 * (1 - d / (SIZE * 0.35)));
      setPixel(x, y, 255, 255, 255, alpha);
    }
  }
}

// Brain circle
const brainR = 300;
fillCircle(cx, cy - 80, brainR, 255, 255, 255, 240);

// Thought bubble
fillCircle(cx - 160, cy + 190, 70, 255, 255, 255, 240);
fillCircle(cx - 250, cy + 310, 38, 255, 255, 255, 240);

// Neural network
const purple = [88, 86, 214];
const nodes = [
  [cx,      cy - 160, 28],
  [cx - 110, cy - 50, 22],
  [cx + 110, cy - 50, 22],
  [cx - 55, cy - 190, 16],
  [cx + 55, cy - 190, 16],
  [cx,      cy + 10,  18],
  [cx - 140, cy - 120, 14],
  [cx + 140, cy - 120, 14],
];

const conns = [[0,1],[0,2],[0,5],[1,3],[2,4],[3,4],[1,6],[2,7],[5,1],[5,2]];
for (const [a, b] of conns) {
  drawLine(nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], ...purple, 100, 4);
}
for (const [ncx, ncy, r] of nodes) {
  fillCircle(ncx, ncy, r, ...purple, 230);
}

console.log("Encoding PNG...");
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ crc32Table[(c ^ buf[i]) & 0xff];
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

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 6;

const rowSize = SIZE * 4 + 1;
const rawRows = Buffer.alloc(SIZE * rowSize);
for (let y = 0; y < SIZE; y++) {
  rawRows[y * rowSize] = 0;
  pixels.copy(rawRows, y * rowSize + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const compressed = deflateSync(rawRows, { level: 6 });

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
]);

const outDir = 'ios/App/App/Assets.xcassets/Splash.imageset';
for (const suffix of ['', '-1', '-2']) {
  writeFileSync(`${outDir}/splash-2732x2732${suffix}.png`, png);
}
console.log(`Written splash images (${png.length} bytes each)`);
