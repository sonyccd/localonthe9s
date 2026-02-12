# Local on the 8s

## Project Overview
A retro Weather Channel "Local on the 8s" style configurable data presentation tool.
Vanilla TypeScript + Vite. No frameworks. Entirely client-side.

## Quick Start
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build → dist/
```

## Architecture
- **640x480 fixed resolution** scaled to fill viewport via CSS `transform: scale()`
- **Double-buffered stages** (`#stage-a` / `#stage-b`) for smooth page transitions
- **Config-driven**: Everything configured via JSON (pages, ticker, audio, theme)
- **Web Audio API** for crossfading music playback

## Key Files
| Path | Purpose |
|---|---|
| `src/main.ts` | Bootstrap, keyboard shortcuts, display scaling |
| `src/types.ts` | All TypeScript interfaces |
| `src/config/schema.ts` | Config validation + theme application |
| `src/config/sample-weather.ts` | Default embedded config |
| `src/engine/PresentationEngine.ts` | Page cycling loop |
| `src/engine/TransitionManager.ts` | CSS transition orchestration |
| `src/panels/PanelRenderer.ts` | Routes page type → renderer |
| `src/audio/AudioEngine.ts` | Web Audio playback + crossfade |
| `src/editor/EditorUI.ts` | JSON config editor overlay |

## Keyboard Shortcuts
- **E** — Toggle config editor
- **M** — Mute/unmute audio
- **Escape** — Close editor
- **F11** — Toggle fullscreen

## Config Loading Priority
1. URL param: `?config=stocks.json` (loads from `/sample-configs/`)
2. localStorage (saved from editor)
3. Default weather config (embedded)

## Panel Types
- `data-grid` — Two-column key/value pairs
- `forecast` — Multi-column cards
- `table` — Tabular data with headers
- `freeform` — Raw HTML content

## Adding Audio Tracks
Place `.mp3` files in `public/audio/` and reference them in config:
```json
{ "name": "My Track", "url": "/audio/mytrack.mp3" }
```

## Theming
Set `theme` in config to override CSS custom properties:
```json
"theme": {
  "backgroundGradient1": "#3a1a6a",
  "backgroundGradient2": "#150a30",
  "labelColor": "#cc88ff"
}
```
