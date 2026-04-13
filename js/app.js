// ============================================================
// APP — ENTRY POINT
// ============================================================

import { qualityMap } from './config.js';
import { loadFFmpeg, convertFile } from './ffmpeg.js';
import { render, log, logClear, formatSize, showUploadingSkeleton } from './ui.js';

// ============================================================
// STATE
// ============================================================
const files = [];
let converting = false;
let ffmpegReady = false;

// ============================================================
// FFMPEG — PRE-LOAD ON PAGE OPEN WITH PROGRESS
// ============================================================
(async () => {
  setFFmpegStatus('loading');
  showFFmpegLoader(true);
  try {
    await loadFFmpeg(
      () => { },           // silent log
      (pct) => setFFmpegLoaderProgress(pct)
    );
    ffmpegReady = true;
    setFFmpegStatus('ready');
    setFFmpegLoaderDone();
  } catch {
    setFFmpegStatus('error');
    setFFmpegLoaderError();
  }
})();

function setFFmpegStatus(state) {
  const el = document.getElementById('ffmpegStatus');
  if (!el) return;
  const map = {
    loading: { text: 'Memuat FFmpeg...', cls: 'status-loading' },
    ready: { text: 'FFmpeg siap', cls: 'status-ready' },
    error: { text: 'FFmpeg gagal', cls: 'status-error' },
  };
  const { text, cls } = map[state];
  el.textContent = text;
  el.className = 'ffmpeg-status ' + cls;
}

function showFFmpegLoader(visible) {
  const el = document.getElementById('ffmpegLoader');
  if (el) el.classList.toggle('visible', visible);
}

function setFFmpegLoaderProgress(pct) {
  const fill = document.getElementById('ffmpegProgressFill');
  const label = document.getElementById('ffmpegLoaderLabel');
  const pctEl = document.getElementById('ffmpegLoaderPct');
  if (!fill) return;

  if (pct > 0) {
    // Real percentage known — switch off indeterminate
    fill.classList.remove('indeterminate');
    fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  }
  if (label) {
    const step = pct < 30 ? 'Mengunduh ffmpeg-core.js...'
      : pct < 90 ? 'Mengunduh ffmpeg-core.wasm...'
        : 'Menginisialisasi...';
    label.textContent = step;
  }
}

function setFFmpegLoaderDone() {
  const loader = document.getElementById('ffmpegLoader');
  const label = document.getElementById('ffmpegLoaderLabel');
  const pctEl = document.getElementById('ffmpegLoaderPct');
  const fill = document.getElementById('ffmpegProgressFill');
  if (!loader) return;
  fill?.classList.remove('indeterminate');
  loader.classList.add('done');
  if (label) label.textContent = 'FFmpeg siap';
  if (pctEl) pctEl.textContent = '100%';
  // Auto-hide after 1.5s
  setTimeout(() => showFFmpegLoader(false), 1500);
}

function setFFmpegLoaderError() {
  const loader = document.getElementById('ffmpegLoader');
  const label = document.getElementById('ffmpegLoaderLabel');
  const fill = document.getElementById('ffmpegProgressFill');
  if (!loader) return;
  fill?.classList.remove('indeterminate');
  loader.classList.add('error');
  if (label) label.textContent = 'FFmpeg gagal dimuat';
}

// ============================================================
// QUALITY SELECTOR
// ============================================================
window.updateQualityOptions = function () {
  const fmt = document.getElementById('outputFormat').value;
  const sel = document.getElementById('qualityOption');
  const opts = qualityMap[fmt] || [];
  sel.innerHTML = opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
};
updateQualityOptions();

// ============================================================
// FILE DROP & INPUT
// ============================================================
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => addFiles(e.target.files));

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  addFiles(e.dataTransfer.files);
});

function addFiles(newFiles) {
  const incoming = Array.from(newFiles).filter(
    f => !files.some(x => x.file.name === f.name && x.file.size === f.size)
  );
  if (incoming.length === 0) return;

  // Show skeleton for incoming files while they're being "read"
  showUploadingSkeleton(files.length + incoming.length);

  // Small delay so skeleton is visible (file reading is near-instant)
  setTimeout(() => {
    for (const f of incoming) {
      files.push({ file: f, status: 'waiting', blob: null, progress: 0 });
    }
    reRender();
  }, 400);
}

// ============================================================
// REMOVE / CLEAR
// ============================================================
window.removeFile = function (i) {
  if (converting) return;
  files.splice(i, 1);
  reRender();
};

window.clearAll = function () {
  if (converting) return;
  files.length = 0;
  logClear();
  reRender();
};

// ============================================================
// DOWNLOAD
// ============================================================
window.downloadFile = function (i) {
  const f = files[i];
  const fmt = document.getElementById('outputFormat').value;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(f.blob);
  a.download = f.file.name.replace(/\.[^.]+$/, '') + '.' + fmt;
  a.click();
  URL.revokeObjectURL(a.href);
};

window.downloadAll = function () {
  files.forEach((_, i) => {
    if (files[i].status === 'done' && files[i].blob) window.downloadFile(i);
  });
};

// ============================================================
// CONVERT
// ============================================================
window.startConvert = async function () {
  if (converting || files.length === 0) return;

  converting = true;
  logClear();
  reRender();

  const fmt = document.getElementById('outputFormat').value;
  const quality = document.getElementById('qualityOption').value;

  try {
    // FFmpeg already loaded on page open — no waiting needed
    if (!ffmpegReady) {
      log('FFmpeg belum siap, harap tunggu sebentar...');
      // fallback: wait up to 10s
      for (let t = 0; t < 20 && !ffmpegReady; t++) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (!ffmpegReady) throw new Error('FFmpeg gagal dimuat.');
    }

    // Convert files one by one
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status === 'done') continue;

      f.status = 'converting';
      f.progress = 0;
      reRender();
      log(`[${i + 1}/${files.length}] ${f.file.name}`);

      try {
        f.blob = await convertFile(
          f.file,
          i,
          fmt,
          quality,
          msg => log(msg),
          progress => {
            f.progress = progress;
            const bar = document.getElementById('prog-' + i);
            if (bar) bar.style.width = Math.round(progress * 100) + '%';
          }
        );
        f.status = 'done';
        log(`Berhasil! Ukuran output: ${formatSize(f.blob.size)}\n`);
      } catch (err) {
        f.status = 'error';
        log(`Gagal: ${err.message}\n`);
      }

      reRender();
    }

    const doneCount = files.filter(f => f.status === 'done').length;
    const failedCount = files.filter(f => f.status === 'error').length;
    log(`\nSelesai! Berhasil: ${doneCount} | Gagal: ${failedCount}`);

  } catch (err) {
    log('Error fatal: ' + err.message);
    alert('Gagal convert. ' + err.message);
  }

  converting = false;
  reRender();
};

// ============================================================
// HELPERS
// ============================================================
function reRender() {
  render(files, converting, window.downloadFile);
}

// Initial render
reRender();