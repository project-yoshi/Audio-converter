// ============================================================
// UI — RENDER HELPERS
// ============================================================

/** Format byte size to human-readable string. */
export function formatSize(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
}

/** Extract and uppercase the file extension (max 4 chars). */
export function getExt(name) {
    return (name.split('.').pop() || '').toUpperCase().slice(0, 4);
}

/** Write a message to the log box. */
export function log(message) {
    const box = document.getElementById('logBox');
    box.style.display = 'block';
    box.textContent += message + '\n';
    box.scrollTop = box.scrollHeight;
}

/** Clear and hide the log box. */
export function logClear() {
    const box = document.getElementById('logBox');
    box.style.display = 'none';
    box.textContent = '';
}

/**
 * Re-render the entire file list and update UI controls.
 * @param {Array}   files      - state array
 * @param {boolean} converting - whether conversion is in progress
 * @param {Function} downloadFileFn - downloadFile(index) callback
 */
export function render(files, converting, downloadFileFn) {
    const list = document.getElementById('fileList');
    const convertBtn = document.getElementById('convertBtn');
    const clearBtn = document.getElementById('clearBtn');
    const dlAllBtn = document.getElementById('downloadAllBtn');
    const statsBar = document.getElementById('statsBar');
    const listTitle = document.getElementById('listTitle');

    const done = files.filter(f => f.status === 'done').length;
    const failed = files.filter(f => f.status === 'error').length;

    convertBtn.disabled = files.length === 0 || converting;
    clearBtn.disabled = files.length === 0 || converting;
    dlAllBtn.style.display = done > 0 ? 'block' : 'none';
    statsBar.style.display = files.length > 0 ? 'flex' : 'none';
    listTitle.style.display = files.length > 0 ? 'block' : 'none';

    document.getElementById('statTotal').textContent = files.length;
    document.getElementById('statDone').textContent = done;
    document.getElementById('statFailed').textContent = failed;

    if (files.length === 0) {
        list.innerHTML = `<div class="empty-state">Belum ada file — upload file audio di atas untuk memulai</div>`;
        return;
    }

    const badgeClass = { waiting: 'badge-waiting', converting: 'badge-converting', done: 'badge-done', error: 'badge-error' };
    const badgeLabel = { waiting: 'Menunggu', converting: 'Converting...', done: 'Selesai', error: 'Gagal' };

    list.innerHTML = files.map((f, i) => {
        const progressHtml = f.status === 'converting'
            ? `<div class="progress-bar"><div class="progress-fill" id="prog-${i}" style="width:${Math.round(f.progress * 100)}%"></div></div>`
            : '';

        const actionHtml = f.status === 'done' && f.blob
            ? `<button class="btn-download" onclick="downloadFile(${i})">
           <svg viewBox="0 0 24 24">
             <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
             <polyline points="7 10 12 15 17 10"/>
             <line x1="12" y1="15" x2="12" y2="3"/>
           </svg>
           Download
         </button>`
            : `<span class="badge ${badgeClass[f.status]}">${badgeLabel[f.status]}</span>`;

        const removeHtml = f.status !== 'converting'
            ? `<button class="btn-remove" onclick="removeFile(${i})" title="Hapus">&#x2715;</button>`
            : '';

        return `
      <div class="file-item">
        <div class="file-ext">${getExt(f.file.name)}</div>
        <div class="file-info">
          <div class="file-name" title="${f.file.name}">${f.file.name}</div>
          <div class="file-meta">${formatSize(f.file.size)}${progressHtml}</div>
        </div>
        ${actionHtml}
        ${removeHtml}
      </div>`;
    }).join('');
}