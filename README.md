# Reosion

**Motion graphics, written in React.**

Reosion is a local-first, code-first motion graphics platform. You write an
animation as a single React component (`Animation.tsx`), preview it instantly
in a sandboxed runtime, and export it to video — all in the browser, on your
own machine. No server, no uploads, no account.

## Features

- **Code as the source of truth** — one React file defines the whole animation.
- **Deterministic frame clock** — every frame renders at an exact timestamp.
- **Local rendering** — frames render in a sandbox on your machine and are
  encoded locally (WebCodecs, with an ffmpeg fallback).
- **Optional AI** — bring your own key (OpenAI, Anthropic, Gemini, OpenRouter).
  The assistant proposes structured edits as diffs.
- **Familiar libraries** — React, Tailwind, Framer Motion, SVG, Lucide.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm install` runs `postinstall`, which copies the vendored wasm assets
(esbuild, ffmpeg) into `public/`. `npm run dev` runs `predev`, which builds
the sandbox runtime bundle (`public/runtime.js`).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server (builds runtime first). |
| `npm run build` | Production build (builds runtime first). |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run the Vitest suite. |
| `npm run setup:vendor` | Copy vendored wasm assets into `public/`. |
| `npm run build:runtime` | Build the sandbox runtime bundle. |

## Project structure

- `app/` — Next.js App Router pages and routes (including `/sandbox`).
- `components/` — UI components (editor, runtime, export, dashboard, landing).
- `lib/` — compiler, clock, storage, export, editor helpers.
- `runtime/` — sandbox runtime source (compiled to `public/runtime.js`).
- `examples/` — example animations (each in its own folder).
- `scripts/` — build/setup scripts.

## Deployment (Vercel)

Vercel runs `npm install` (postinstall copies vendor assets) then
`npm run build` (prebuild builds the runtime). No extra configuration is
required. If you fork the repo, make sure Vercel deploys the `main` branch.

## License

MIT — see [LICENSE](./LICENSE).