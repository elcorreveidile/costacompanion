const sharp = require('sharp');
const path = require('path');

const W = 400, H = 400;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#F0ECE5"/>

  <line x1="60" y1="68" x2="340" y2="68" stroke="#C97B4A" stroke-width="0.8" opacity="0.35"/>
  <line x1="60" y1="332" x2="340" y2="332" stroke="#C97B4A" stroke-width="0.8" opacity="0.35"/>

  <g opacity="0.25" fill="#2C4A3B">
    <path d="M72 200 Q52 182 60 162 Q68 146 84 152 Q76 165 80 178 Q90 168 102 172 Q92 186 80 188 Q76 194 72 200Z"/>
    <path d="M72 200 Q52 218 60 238 Q68 254 84 248 Q76 235 80 222 Q90 232 102 228 Q92 214 80 212 Q76 206 72 200Z"/>
    <circle cx="108" cy="200" r="4" opacity="0.5"/>
    <circle cx="124" cy="200" r="2.5" opacity="0.3"/>
    <circle cx="136" cy="200" r="1.5" opacity="0.2"/>
  </g>
  <g opacity="0.25" fill="#2C4A3B" transform="translate(400,0) scale(-1,1)">
    <path d="M72 200 Q52 182 60 162 Q68 146 84 152 Q76 165 80 178 Q90 168 102 172 Q92 186 80 188 Q76 194 72 200Z"/>
    <path d="M72 200 Q52 218 60 238 Q68 254 84 248 Q76 235 80 222 Q90 232 102 228 Q92 214 80 212 Q76 206 72 200Z"/>
    <circle cx="108" cy="200" r="4" opacity="0.5"/>
    <circle cx="124" cy="200" r="2.5" opacity="0.3"/>
    <circle cx="136" cy="200" r="1.5" opacity="0.2"/>
  </g>

  <g transform="translate(200,195)">
    <path d="M-72 28 L-72 -2 L-52 14 L-34 -26 L-17 6 L0 -44 L17 6 L34 -26 L52 14 L72 -2 L72 28 Z" fill="#2C4A3B"/>
    <path d="M-72 28 L-72 8 L-52 14 L-52 22" fill="#1D3329" opacity="0.25"/>
    <path d="M72 28 L72 8 L52 14 L52 22" fill="#1D3329" opacity="0.25"/>
    <rect x="-72" y="28" width="144" height="26" rx="2" fill="#2C4A3B"/>
    <rect x="-72" y="28" width="144" height="9" fill="#234038"/>
    <circle cx="-50" cy="32.5" r="3.2" fill="#C97B4A"/>
    <circle cx="-25" cy="32.5" r="3.2" fill="#C97B4A"/>
    <circle cx="0"   cy="32.5" r="3.2" fill="#E0A877"/>
    <circle cx="25"  cy="32.5" r="3.2" fill="#C97B4A"/>
    <circle cx="50"  cy="32.5" r="3.2" fill="#C97B4A"/>
    <circle cx="-34" cy="-26" r="5"   fill="#C97B4A"/>
    <circle cx="34"  cy="-26" r="5"   fill="#C97B4A"/>
    <circle cx="0"   cy="-44" r="6.5" fill="#E0A877"/>
    <circle cx="-72" cy="-2"  r="4"   fill="#C97B4A" opacity="0.75"/>
    <circle cx="72"  cy="-2"  r="4"   fill="#C97B4A" opacity="0.75"/>
    <circle cx="-1.5" cy="-46" r="2" fill="white" opacity="0.4"/>
  </g>

  <text x="200" y="312" font-family="Georgia, serif" font-size="12.5" font-weight="600" letter-spacing="5" text-anchor="middle" fill="#2C4A3B" opacity="0.6">LOCAL PARTNER</text>
  <line x1="155" y1="323" x2="245" y2="323" stroke="#C97B4A" stroke-width="0.9" opacity="0.4"/>

  <circle cx="74"  cy="74"  r="2.5" fill="#C97B4A" opacity="0.28"/>
  <circle cx="326" cy="74"  r="2.5" fill="#C97B4A" opacity="0.28"/>
  <circle cx="74"  cy="326" r="2.5" fill="#C97B4A" opacity="0.28"/>
  <circle cx="326" cy="326" r="2.5" fill="#C97B4A" opacity="0.28"/>
</svg>`;

sharp(Buffer.from(svg))
  .resize(400, 400)
  .png({ compressionLevel: 9 })
  .toFile(path.join(__dirname, '../public/images/local-partner-placeholder.png'))
  .then(() => console.log('PNG generado OK'))
  .catch(err => { console.error(err); process.exit(1); });
