// ============================================================
// APP — ENTRY POINT
// ============================================================

import { qualityMap } from './config.js';
import { loadFFmpeg, convertFile } from './ffmpeg.js';
import { render, log, logClear, formatSize } from './ui.js';

// ============================================================
// STATE
// ============================================================
const files = [];
let converting = false;

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
    for (const f of newFiles) {
        const isDup = files.some(x => x.file.name === f.name && x.file.size === f.size);
        if (!isDup) files.push({ file: f, status: 'waiting', blob: null, progress: 0 });
    }
    reRender();
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
    const overlay = document.getElementById('loadingOverlay');

    try {
        // Load FFmpeg (once; subsequent calls return cached instance)
        if (!window._ffmpegLoaded) {
            overlay.style.display = 'flex';
            log('Memuat FFmpeg...');
            await loadFFmpeg(msg => log(msg));
            window._ffmpegLoaded = true;
            overlay.style.display = 'none';
            log('FFmpeg berhasil dimuat!\n');
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
        overlay.style.display = 'none';
        log('Error fatal: ' + err.message);
        alert('Gagal memuat FFmpeg. Pastikan koneksi internet tersedia dan coba lagi.');
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