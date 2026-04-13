// ============================================================
// FFMPEG — LOADER & CONVERTER
// Strategy:
//   1. Coba load dari lib/ lokal (UMD via window global)
//   2. Fallback ke ESM CDN jika lokal tidak tersedia
// ============================================================

import { mimeMap } from './config.js';

let ffmpeg = null;

export async function loadFFmpeg(logFn, progressFn = () => { }) {
  if (ffmpeg) return ffmpeg;

  let FFmpeg, fetchFile;

  const umdFFmpeg = window.FFmpegWASM ?? window.FFmpeg;
  const umdUtil = window.FFmpegUtil ?? window.FFmpegWasm;

  if (umdFFmpeg?.FFmpeg && umdUtil?.fetchFile) {
    logFn('[local] Using local lib/');
    FFmpeg = umdFFmpeg.FFmpeg;
    fetchFile = umdUtil.fetchFile;
  } else {
    logFn('[cdn] lib/ not found, fallback to CDN...');
    const mod1 = await import('https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/esm/index.js');
    const mod2 = await import('https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js');
    FFmpeg = mod1.FFmpeg;
    fetchFile = mod2.fetchFile;
  }

  window._fetchFile = fetchFile;

  ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => logFn(message));

  // Track download progress of core files
  ffmpeg.on('progress', ({ progress }) => {
    progressFn(Math.round(progress * 100));
  });

  const hasLocal = !!(window.FFmpegWASM ?? window.FFmpeg);

  if (hasLocal) {
    // Simulate progress steps for local load (instant, no real progress events)
    progressFn(10);
    await ffmpeg.load({
      coreURL: '/lib/ffmpeg-core.js',
      wasmURL: '/lib/ffmpeg-core.wasm',
    });
    progressFn(100);
  } else {
    const { toBlobURL } = await import('https://unpkg.com/@ffmpeg/util@0.12.1/dist/esm/index.js');
    const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    progressFn(5);
    const coreURL = await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript');
    progressFn(30);
    const wasmURL = await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm');
    progressFn(90);
    await ffmpeg.load({ coreURL, wasmURL });
    progressFn(100);
  }

  return ffmpeg;
}

export function buildArgs(inputName, outputName, fmt, quality) {
  const args = ['-i', inputName];
  switch (fmt) {
    case 'flac': args.push('-compression_level', quality); break;
    case 'mp3': args.push('-codec:a', 'libmp3lame', '-b:a', quality); break;
    case 'wav': args.push('-codec:a', 'pcm_' + quality); break;
    case 'aac': args.push('-codec:a', 'aac', '-b:a', quality); break;
    case 'ogg': args.push('-codec:a', 'libvorbis', '-q:a', quality); break;
    case 'opus': args.push('-codec:a', 'libopus', '-b:a', quality); break;
    case 'm4a': args.push('-codec:a', 'aac', '-b:a', quality); break;
  }
  args.push('-y', outputName);
  return args;
}

export async function convertFile(file, index, fmt, quality, logFn, progressFn) {
  const ext = file.name.split('.').pop() || 'audio';
  const inputName = `input_${index}.${ext}`;
  const outputName = `output_${index}.${fmt}`;

  const onProgress = ({ progress }) => progressFn(progress);
  ffmpeg.on('progress', onProgress);

  try {
    await ffmpeg.writeFile(inputName, await window._fetchFile(file));
    const args = buildArgs(inputName, outputName, fmt, quality);
    logFn('Running: ffmpeg ' + args.join(' '));
    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: mimeMap[fmt] || 'audio/' + fmt });

    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    return blob;
  } finally {
    ffmpeg.off('progress', onProgress);
  }
}