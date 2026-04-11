// ============================================================
// FFMPEG — LOADER & CONVERTER
// ============================================================

import { mimeMap } from './config.js';

let ffmpeg = null;

/**
 * Lazy-load FFmpeg. Shows/hides the loading overlay.
 * @param {Function} logFn - callback(message: string)
 * @returns {Promise<object>} ffmpeg instance
 */
export async function loadFFmpeg(logFn) {
    if (ffmpeg) return ffmpeg;

    const { FFmpeg } = await import('https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/esm/index.js');
    const { fetchFile, toBlobURL } = await import('https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js');

    // Expose fetchFile globally so converter can access it
    window._fetchFile = fetchFile;

    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => logFn(message));

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
}

/**
 * Build FFmpeg argument list for the given format and quality.
 * @param {string} inputName  - virtual FS filename for input
 * @param {string} outputName - virtual FS filename for output
 * @param {string} fmt        - target format key
 * @param {string} quality    - quality value from qualityMap
 * @returns {string[]}
 */
export function buildArgs(inputName, outputName, fmt, quality) {
    const args = ['-i', inputName];

    switch (fmt) {
        case 'flac':
            args.push('-compression_level', quality);
            break;
        case 'mp3':
            args.push('-codec:a', 'libmp3lame', '-b:a', quality);
            break;
        case 'wav':
            args.push('-codec:a', 'pcm_' + quality);
            break;
        case 'aac':
            args.push('-codec:a', 'aac', '-b:a', quality);
            break;
        case 'ogg':
            args.push('-codec:a', 'libvorbis', '-q:a', quality);
            break;
        case 'opus':
            args.push('-codec:a', 'libopus', '-b:a', quality);
            break;
        case 'm4a':
            args.push('-codec:a', 'aac', '-b:a', quality);
            break;
    }

    args.push('-y', outputName);
    return args;
}

/**
 * Convert a single File object using FFmpeg.
 * @param {File}     file        - source audio file
 * @param {number}   index       - index in the file list (used for virtual FS names)
 * @param {string}   fmt         - target format key
 * @param {string}   quality     - quality value
 * @param {Function} logFn       - callback(message: string)
 * @param {Function} progressFn  - callback(progress: number)
 * @returns {Promise<Blob>}
 */
export async function convertFile(file, index, fmt, quality, logFn, progressFn) {
    const ext = file.name.split('.').pop() || 'audio';
    const inputName = `input_${index}.${ext}`;
    const outputName = `output_${index}.${fmt}`;

    // Register progress listener
    const onProgress = ({ progress }) => progressFn(progress);
    ffmpeg.on('progress', onProgress);

    try {
        await ffmpeg.writeFile(inputName, await window._fetchFile(file));

        const args = buildArgs(inputName, outputName, fmt, quality);
        logFn('Menjalankan: ffmpeg ' + args.join(' '));

        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([data.buffer], { type: mimeMap[fmt] || 'audio/' + fmt });

        // Cleanup virtual FS
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);

        return blob;
    } finally {
        ffmpeg.off('progress', onProgress);
    }
}