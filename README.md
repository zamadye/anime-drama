# Anime Drama V3 Studio — Modern Series B

Mesin produksi animasi drama serial **Modern Series B** berbasis **Remotion + React + TypeScript + SVG Vektor Prosedural** (1920×1080, 24fps, deterministik *frame-addressable*, tanpa *raster actor* / Live2D cutout).

## Status Saat Ini
- **M0 (Fondasi Kontrak & Compiler)**: Selesai (`src/v3/contracts.ts`, `src/v3/compiler.ts`, `content/examples/`).
- **M1 (Arga Model Sheet — 6 Sudut Pandang + 5 Bentuk Tangan)**: Kandidat review (`V3-Arga-Model-Sheet` -> `docs/anime-v3/qa/arga-model-sheet.png`), menunggu persetujuan visual user.
- **M2 (Arga 8s Fixed-Camera Motion Study + Audio WAV Lokal)**: Kandidat review (`V3-Arga-Motion-Study` -> `docs/anime-v3/qa/arga-motion-study.mp4`), menunggu persetujuan visual user sebelum ekspansi ke Kirana, Pak Hendra, dan Sena.

## Komposisi Remotion V3
- `V3-Arga-Model-Sheet` (`1920×1080`, 24fps, 24 frames): 6 sudut pandang independen (`front`, `3/4 right`, `3/4 left`, `profile right`, `profile left`, `back`), 4 close-up ekspresi, 5 bentuk tangan, dan palet cel 3 nilai.
- `V3-Arga-Motion-Study` (`1920×1080`, 24fps, 192 frames / 8.0s): kamera statis (*fixed camera*), *stage-locked foot contact* (`<= 2px` target drift), IK 2-tulang (*0 clamped*), putar kepala-bahu-pinggul (*lead-follow*), gestur bicara tangan terbuka, dan audio lokal `public/audio/pilot-arga-01.wav`.

## Perintah
```bash
npm run typecheck
npm test
npm run build
npm run studio
npm run render:v3-sheet
npm run render:v3-motion
```

Lihat dokumentasi lengkap arsitektur di [docs/anime-v3/INDEX.md](docs/anime-v3/INDEX.md) dan laporan QA di [docs/anime-v3/qa/latest.md](docs/anime-v3/qa/latest.md).
