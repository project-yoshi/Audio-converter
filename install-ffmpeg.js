#!/usr/bin/env node
// ============================================================
// install-ffmpeg.js
// Jalankan sekali: node install-ffmpeg.js
// Akan mendownload semua file FFmpeg wasm ke folder lib/
// ============================================================

const https    = require('https');
const fs       = require('fs');
const path     = require('path');

const LIB_DIR = path.join(__dirname, 'lib');
if (!fs.existsSync(LIB_DIR)) fs.mkdirSync(LIB_DIR);

const FILES = [
  {
    url:  'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js',
    dest: 'ffmpeg.js',
  },
  {
    url:  'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js',
    dest: 'ffmpeg-util.js',
  },
  {
    url:  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    dest: 'ffmpeg-core.js',
  },
  {
    url:  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
    dest: 'ffmpeg-core.wasm',
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(LIB_DIR, dest);
    const file     = fs.createWriteStream(filePath);

    const handleResponse = (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlinkSync(filePath);
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        download(redirectUrl, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    };

    https.get(url, handleResponse).on('error', reject);
  });
}

(async () => {
  for (const { url, dest } of FILES) {
    process.stdout.write(`Downloading ${dest}... `);
    try {
      await download(url, dest);
      const size = (fs.statSync(path.join(LIB_DIR, dest)).size / 1024 / 1024).toFixed(1);
      console.log(`✓ (${size} MB)`);
    } catch (err) {
      console.error(`✗ ${err.message}`);
      process.exit(1);
    }
  }
  console.log('\n✅ Semua file berhasil didownload ke folder lib/');
  console.log('   Sekarang buka index.html lewat web server lokal.');
})();
