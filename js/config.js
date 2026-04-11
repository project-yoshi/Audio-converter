// ============================================================
// QUALITY OPTIONS PER FORMAT
// ============================================================

export const qualityMap = {
    flac: [
        { label: 'Compression 0 (tercepat, terbesar)', value: '0' },
        { label: 'Compression 5 (default, seimbang)', value: '5' },
        { label: 'Compression 8 (terkecil, terlambat)', value: '8' },
    ],
    mp3: [
        { label: '320 kbps (kualitas terbaik)', value: '320k' },
        { label: '256 kbps', value: '256k' },
        { label: '192 kbps', value: '192k' },
        { label: '128 kbps (ukuran terkecil)', value: '128k' },
    ],
    wav: [
        { label: 'PCM 16-bit (standar CD)', value: 's16' },
        { label: 'PCM 24-bit (hi-res)', value: 's32' },
    ],
    aac: [
        { label: '320 kbps (kualitas terbaik)', value: '320k' },
        { label: '256 kbps (default)', value: '256k' },
        { label: '192 kbps', value: '192k' },
        { label: '128 kbps', value: '128k' },
    ],
    ogg: [
        { label: 'Q9 (kualitas terbaik)', value: '9' },
        { label: 'Q5 (default)', value: '5' },
        { label: 'Q3 (ukuran kecil)', value: '3' },
    ],
    opus: [
        { label: '256 kbps (kualitas terbaik)', value: '256k' },
        { label: '128 kbps (default)', value: '128k' },
        { label: '96 kbps', value: '96k' },
        { label: '64 kbps (ukuran terkecil)', value: '64k' },
    ],
    m4a: [
        { label: '320 kbps (kualitas terbaik)', value: '320k' },
        { label: '256 kbps (default)', value: '256k' },
        { label: '192 kbps', value: '192k' },
        { label: '128 kbps', value: '128k' },
    ],
};

// MIME type map per output format
export const mimeMap = {
    flac: 'audio/flac',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    m4a: 'audio/mp4',
};