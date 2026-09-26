// Genera public/icons/icon-192.png y public/icons/icon-512.png (icono PWA).
// PNG puro con zlib (Node stdlib): fondo verde de marca + arco «C» crema + punto
// terra. Réplica a gran escala del diseño de app/icon.tsx. Uso: node scripts/gen-icons.mjs
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const VERDE = [44, 74, 59]; // #2C4A3B
const CREMA = [247, 244, 239]; // #F7F4EF
const TERRA = [224, 168, 119]; // #E0A877

// ── CRC32 + chunks PNG ─────────────────────────────────────────────────────────
const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tipo, datos) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([len, cuerpo, crc]);
}

function png(anchura, altura, pixelFn) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(anchura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // profundidad
  ihdr[9] = 6; // RGBA
  const bruto = Buffer.alloc(altura * (1 + anchura * 4));
  for (let y = 0; y < altura; y++) {
    const fila = y * (1 + anchura * 4);
    bruto[fila] = 0; // filtro none
    for (let x = 0; x < anchura; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const i = fila + 1 + x * 4;
      bruto[i] = r;
      bruto[i + 1] = g;
      bruto[i + 2] = b;
      bruto[i + 3] = a;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(bruto)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Diseño (coordenadas en una rejilla 32×32, escaladas) ───────────────────────
// Fondo cuadrado a sangre (válido como maskable) + anillo C con la abertura a la
// derecha + punto terra arriba a la derecha. 2×2 supersampling para suavizar.

function pixelEn(x, y, s) {
  const gx = x / s;
  const gy = y / s;
  // Anillo: centro (16,16), radio 5.5–8; abertura derecha (|ángulo| < 45°).
  const dx = gx - 16;
  const dy = gy - 16;
  const d = Math.hypot(dx, dy);
  const enAnillo = d >= 5.5 && d <= 8 && Math.abs(dx) / (d || 1) <= 0.707;
  // Punto terra: centro (21.5, 15.5), radio 2.5.
  const enPunto = Math.hypot(gx - 21.5, gy - 15.5) <= 2.5;
  return enPunto ? TERRA : enAnillo ? CREMA : VERDE;
}

function icono(tam) {
  const s = tam / 32;
  return png(tam, tam, (x, y) => {
    // Supersampling 2×2: media de las 4 submuestras.
    let r = 0, g = 0, b = 0;
    for (const ox of [0.25, 0.75]) {
      for (const oy of [0.25, 0.75]) {
        const [pr, pg, pb] = pixelEn(x + ox, y + oy, s);
        r += pr;
        g += pg;
        b += pb;
      }
    }
    return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4), 255];
  });
}

const dir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(dir, { recursive: true });
for (const tam of [192, 512]) {
  fs.writeFileSync(path.join(dir, `icon-${tam}.png`), icono(tam));
  console.log(`public/icons/icon-${tam}.png`);
}
