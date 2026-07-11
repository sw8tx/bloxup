# bloxup.shop launch page

Interactive launch page for **July 12, 2026 at 3:00 PM CEST**. The site is
built with React/Vite and uses a custom Blender/WebGL asset derived from the
original Bloxup icon.

## Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

The production output is generated in `dist/`. Cloudflare must publish this
directory rather than the unbuilt repository root.

## Launch time

The canonical launch timestamp is defined as `LAUNCH_AT` in `src/App.jsx`.
After the countdown reaches zero, it automatically switches to the live state.

## Cloudflare deployment

```bash
npm run deploy:cloudflare
```

The deployment script builds the app and uploads `dist/` to the `bloxup`
Cloudflare Pages project.

## 3D asset

- Blender source: `art-source/bloxup-rocket.blend`
- Reproducible build script: `art-source/build_bloxup_rocket.py`
- WebGL model: `public/assets/3d/bloxup-rocket.glb`
- Static fallback: `public/assets/3d/bloxup-rocket-poster.webp`

Rebuild the asset with Blender:

```bash
blender --background --python art-source/build_bloxup_rocket.py
```

The GLB uses Draco compression. Matching decoders are included locally under
`public/assets/draco/`; the runtime does not depend on an external CDN.
