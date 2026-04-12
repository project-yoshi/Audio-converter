#!/usr/bin/env node
// ================================================================
// install-ffmpeg.js — Jalankan sekali sebelum deploy ke Vercel
//   node install-ffmpeg.js
// ================================================================

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const LIB_DIR = path.join(__dirname, 'lib');
if (!fs.existsSync(LIB_DIR)) fs.mkdirSync(LIB_DIR);

const FILES = [
  { url: 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/ffmpeg.js',     dest: 'ffmpeg.js'      },
  { url: 'https://unpkg.com/@ffmpeg/util@0.12.1/dist/umd/index.js',         dest: 'ffmpeg-util.js' },
  { url: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',   dest: 'ffmpeg-core.js' },
  { url: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm', dest: 'ffmpeg-core.wasm' },
  { url: 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/umd/814.ffmpeg.js',  dest: '814.ffmpeg.js'  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(LIB_DIR, dest);
    const doGet = (targetUrl) => {
      const file = fs.createWriteStream(filePath);
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close(); fs.unlinkSync(filePath);
          const next = res.headers.location.startsWith('http')
            ? res.headers.location
            : new URL(res.headers.location, targetUrl).href;
          return doGet(next);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} — ${targetUrl}`));
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (e) => { try { file.close(); fs.unlinkSync(filePath); } catch{} reject(e); });
    };
    doGet(url);
  });
}

(async () => {
  console.log('Mendownload file FFmpeg ke folder lib/...\n');
  for (const { url, dest } of FILES) {
    process.stdout.write(`  ${dest.padEnd(26)} `);
    try {
      await download(url, dest);
      const mb = (fs.statSync(path.join(LIB_DIR, dest)).size / 1024 / 1024).toFixed(1);
      console.log(`✓  ${mb} MB`);
    } catch (err) {
      console.log(`✗  ${err.message}`);
      process.exit(1);
    }
  }

  // Cek nama global yang diekspor oleh UMD
  console.log('\nMengecek nama global UMD...');
  const code = fs.readFileSync(path.join(LIB_DIR, 'ffmpeg.js'), 'utf8');
  const match = code.match(/(?:this|self|window|global)\["(\w+)"\]\s*=/);
  if (match) console.log(`  ffmpeg.js    → window.${match[1]}`);
  else        console.log(`  ffmpeg.js    → (tidak terdeteksi otomatis, cek manual)`);

  const codeUtil = fs.readFileSync(path.join(LIB_DIR, 'ffmpeg-util.js'), 'utf8');
  const matchU   = codeUtil.match(/(?:this|self|window|global)\["(\w+)"\]\s*=/);
  if (matchU) console.log(`  ffmpeg-util.js → window.${matchU[1]}`);
  else        console.log(`  ffmpeg-util.js → (tidak terdeteksi otomatis)`);

  console.log('\n✅ Selesai! Langkah selanjutnya:');
  console.log('   git add lib/');
  console.log('   git commit -m "add ffmpeg wasm"');
  console.log('   git push');
})();