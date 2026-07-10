# bloxup.shop Launchpage

Interaktive Launchpage für den Start am **12. Juli 2026 um 15:00 CEST**. Die
Seite basiert auf React/Vite und verwendet ein eigens aus dem Bloxup-Icon
gebautes Blender-/WebGL-Asset.

## Entwicklung

```bash
npm install
npm run dev
```

Qualitätschecks:

```bash
npm run lint
npm run build
```

Der produktive Output liegt in `dist/`. Beim Hosting muss **dieser Ordner**
veröffentlicht werden, nicht der ungebaute Repository-Root.

## Launch-Zeit

Der zentrale Zielzeitpunkt steht in `src/App.jsx` als `LAUNCH_AT`. Der Timer
wechselt nach Ablauf automatisch in den Live-Zustand.

## 3D-Asset

- Blender-Quelle: `art-source/bloxup-rocket.blend`
- Reproduzierbares Build-Script: `art-source/build_bloxup_rocket.py`
- WebGL-Modell: `public/assets/3d/bloxup-rocket.glb`
- Statischer Fallback: `public/assets/3d/bloxup-rocket-poster.webp`

Asset neu bauen:

```bash
blender --background --python art-source/build_bloxup_rocket.py
```

Das GLB ist Draco-komprimiert. Die passenden Decoder liegen lokal unter
`public/assets/draco/`; es werden keine externen CDNs benötigt.
