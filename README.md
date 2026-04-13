# 🎵 Audio Converter

A **browser-based audio converter** that runs entirely client-side — no server, no uploads, no privacy concerns. Powered by [FFmpeg.wasm](https://github.com/ffmpeg/ffmpeg.js), it converts audio files directly in your browser at near-native speed.

> Built as a portfolio project to demonstrate modern web development with WebAssembly integration.

---

## ✨ Features

- 🔄 **Multi-format conversion** — supports WAV, FLAC, MP3, AAC, OGG Vorbis, OPUS, and M4A
- 🎛️ **Quality control** — fine-tune bitrate or compression level per format
- 📁 **Batch processing** — upload and convert multiple files at once
- 📊 **Live progress** — real-time progress bar and conversion log per file
- ⬇️ **Download all** — download every converted file in one click
- 🔒 **100% client-side** — files never leave your device
- ⚡ **FFmpeg preloaded** — FFmpeg WASM is loaded on page open so conversion starts instantly
- 🖱️ **Drag & drop** — intuitive drag-and-drop upload with skeleton loading animation

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **HTML / CSS / JavaScript** | Core UI and application logic |
| **FFmpeg.wasm (`@ffmpeg/ffmpeg` v0.12)** | Audio encoding/decoding in the browser |
| **WebAssembly (WASM)** | Near-native performance for FFmpeg |
| **ES Modules** | Clean, modular JavaScript architecture |
| **Vercel** | Deployment with required COOP/COEP headers for SharedArrayBuffer |

---

## 🚀 Getting Started

No build step required. Just open `index.html` in a modern browser — or serve it locally:

```bash
# Using Python
python -m http.server 8080

# Using Node.js (npx)
npx serve .
```

> ⚠️ FFmpeg.wasm requires `SharedArrayBuffer`, which needs specific HTTP headers (`COOP` / `COEP`). These are configured in `vercel.json` for deployment. When serving locally, use a tool that supports setting custom headers.

---

## 📁 Project Structure

```
audio-converter/
├── index.html          # Main UI
├── css/
│   └── style.css       # Styling and animations
├── js/
│   ├── app.js          # Entry point — state, events, orchestration
│   ├── config.js       # Format & quality options map
│   ├── ffmpeg.js       # FFmpeg loader & converter logic
│   └── ui.js           # Render helpers and DOM updates
├── lib/                # Local FFmpeg UMD bundles (optional, CDN fallback)
│   ├── ffmpeg.js
│   ├── ffmpeg-util.js
│   ├── ffmpeg-core.js
│   └── ffmpeg-core.wasm
└── vercel.json         # Deployment headers config
```

---

## 🌐 Deployment

This project is deployed on **Vercel**. The `vercel.json` sets the required `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers needed for `SharedArrayBuffer` support (required by FFmpeg.wasm).

---

## 📦 Supported Formats

| Format | Type | Notes |
|---|---|---|
| **FLAC** | Lossless | Compression level 0–8 |
| **MP3** | Lossy | 128–320 kbps |
| **WAV** | Uncompressed | PCM 16-bit or 24-bit |
| **AAC** | Lossy | 128–320 kbps |
| **OGG Vorbis** | Lossy | Quality Q3–Q9 |
| **OPUS** | Lossy | 64–256 kbps |
| **M4A** | Lossy | 128–320 kbps |

---

## 🧠 How It Works

1. **FFmpeg is preloaded** when the page opens — either from the local `lib/` folder or via CDN fallback.
2. User uploads audio files (click or drag & drop).
3. On conversion, each file is written to FFmpeg's in-memory virtual filesystem, processed with the appropriate codec arguments, then read back as a `Blob`.
4. The resulting file is available for immediate download — all without touching a server.

---

## 👤 Author

**[Your Name]** — feel free to reach out!

- GitHub: [@yourusername](https://github.com/yourusername)
- Portfolio: [yourwebsite.com](https://yourwebsite.com)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
