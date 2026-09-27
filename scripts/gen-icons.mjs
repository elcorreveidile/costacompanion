// Genera los iconos PWA (public/icons/icon-192.png, icon-512.png) y las fuentes
// de tienda para @capacitor/assets (resources/icon-only.png, icon-background.png,
// icon-foreground.png, splash.png, splash-dark.png).
// PNG puro con zlib (Node stdlib): fondo verde de marca + arco «C» crema + punto
// terra. Réplica a gran escala del diseño de app/icon.tsx. Uso: npm run icons
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

// Geometría pura de la marca: «punto» | «anillo» | null (fondo), según dónde
// caiga (gx,gy). Compartida por todos los renderers.
function geometriaMarca(gx, gy) {
  // Anillo: centro (16,16), radio 5.5–8; abertura derecha (|ángulo| < 45°).
  const dx = gx - 16;
  const dy = gy - 16;
  const d = Math.hypot(dx, dy);
  const enAnillo = d >= 5.5 && d <= 8 && Math.abs(dx) / (d || 1) <= 0.707;
  // Punto terra: centro (21.5, 15.5), radio 2.5.
  const enPunto = Math.hypot(gx - 21.5, gy - 15.5) <= 2.5;
  return enPunto ? "punto" : enAnillo ? "anillo" : null;
}

function pixelEn(x, y, s) {
  const c = geometriaMarca(x / s, y / s);
  return c === "punto" ? TERRA : c === "anillo" ? CREMA : VERDE;
}

// Media de 4 submuestras (2×2); promedia RGB y alfa.
function supermuestrear(tam, porSubmuestra) {
  return png(tam, tam, (x, y) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (const ox of [0.25, 0.75]) {
      for (const oy of [0.25, 0.75]) {
        const [pr, pg, pb, pa] = porSubmuestra(x + ox, y + oy);
        r += pr;
        g += pg;
        b += pb;
        a += pa;
      }
    }
    return [Math.round(r / 4), Math.round(g / 4), Math.round(b / 4), Math.round(a / 4)];
  });
}

function icono(tam) {
  const s = tam / 32;
  return supermuestrear(tam, (x, y) => {
    const [r, g, b] = pixelEn(x, y, s);
    return [r, g, b, 255];
  });
}

// Marca escalada y centrada sobre un fondo (fondoAlfa 0 ⇒ fondo transparente;
// el RGB del fondo se mantiene para que el antialias no genere halo oscuro).
// Colores del anillo/punto parametrizables: sobre fondo claro el anillo es verde
// (variante LogoSymbol); sobre fondo verde, crema (variante icono).
function marca({
  fondo,
  fondoAlfa = 255,
  escala = 1,
  colorAnillo = CREMA,
  colorPunto = TERRA,
}) {
  return (tam) => {
    const s = (tam * escala) / 32;
    const offset = (tam * (1 - escala)) / 2;
    return supermuestrear(tam, (x, y) => {
      const c = geometriaMarca((x - offset) / s, (y - offset) / s);
      const color = c === "punto" ? colorPunto : c === "anillo" ? colorAnillo : null;
      return color
        ? [color[0], color[1], color[2], 255]
        : [fondo[0], fondo[1], fondo[2], fondoAlfa];
    });
  };
}

// ── Iconos PWA ─────────────────────────────────────────────────────────────────
const dir = path.join(process.cwd(), "public", "icons");
fs.mkdirSync(dir, { recursive: true });
for (const tam of [192, 512]) {
  fs.writeFileSync(path.join(dir, `icon-${tam}.png`), icono(tam));
  console.log(`public/icons/icon-${tam}.png`);
}

// ── Fuentes para @capacitor/assets (recursos de tienda) ────────────────────────
const recursos = path.join(process.cwd(), "resources");
fs.mkdirSync(recursos, { recursive: true });
const escribir = (nombre, buf) => {
  fs.writeFileSync(path.join(recursos, nombre), buf);
  console.log(`resources/${nombre}`);
};

escribir("icon-only.png", icono(1024)); // verde a sangre, sin máscara
escribir("icon-background.png", png(1024, 1024, () => [...VERDE, 255]));
// Escala 0.8: el contenido queda a ~20 % del radio, dentro del círculo seguro (~30 %) del adaptive icon.
escribir("icon-foreground.png", marca({ fondo: VERDE, fondoAlfa: 0, escala: 0.8 })(1024));
escribir("splash.png", marca({ fondo: CREMA, escala: 0.2, colorAnillo: VERDE })(2732));
escribir("splash-dark.png", marca({ fondo: VERDE, escala: 0.2 })(2732));
