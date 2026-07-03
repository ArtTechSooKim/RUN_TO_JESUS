// Injects PWA install tags into the exported web build's index.html.
// Runs after `expo export -p web`, which doesn't offer an app.json field
// for these tags — a custom +html.tsx would replace Expo Router's whole
// document shell (risky for the site everyone at the retreat uses), so
// this only appends to the already-correct generated <head>.
const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

const tags = [
  '<link rel="manifest" href="/manifest.json">',
  '<meta name="theme-color" content="#0A0D17">',
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="RUN TO JESUS">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
].join('');

if (html.includes('rel="manifest"')) {
  console.log('inject-pwa-meta: manifest link already present, skipping');
  process.exit(0);
}

const updated = html.replace('</head>', `${tags}</head>`);
fs.writeFileSync(indexPath, updated);
console.log('inject-pwa-meta: injected PWA tags into dist/index.html');
