// Generates printable QR PNGs for each station, encoding "RTJ:{id}"
// (matches the real printed set in files/ — see files/PROJECT_CONTEXT.md).
// Run with: node scripts/generate-station-qr.js
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const stationsSource = fs.readFileSync(
  path.join(__dirname, '../src/constants/stations.ts'),
  'utf8',
);
const ids = [...stationsSource.matchAll(/id:\s*'([A-Z]+)'/g)].map((m) => m[1]);

const outDir = path.join(__dirname, '../qr-codes');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  for (const id of [...ids, 'INTRO']) {
    const file = path.join(outDir, `${id}.png`);
    await QRCode.toFile(file, `RTJ:${id}`, { width: 600, margin: 2 });
    console.log('wrote', file);
  }
})();
