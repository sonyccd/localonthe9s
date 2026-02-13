# Local on the 8s

[Demo](https://localonthe9s.vercel.app/)

A retro Weather Channel "Local on the 8s" style data presentation tool. Feed it any data — weather, stocks, horoscopes, whatever — and it renders in the authentic 1990s WeatherStar 4000 aesthetic with smooth jazz, scrolling tickers, and page cycling.

<img width="300" alt="Screenshot 2026-02-13 at 10 03 41 AM" src="https://github.com/user-attachments/assets/86363acc-d339-44a2-972d-f0add1ebe1e8" />
<img width="300" alt="Screenshot 2026-02-13 at 10 03 53 AM" src="https://github.com/user-attachments/assets/bb688f2c-89fd-455f-ac4e-ac91e3c02cf7" />
<img width="300" alt="Screenshot 2026-02-13 at 10 04 12 AM" src="https://github.com/user-attachments/assets/be9ced0f-bf97-4343-ba43-68fe5876cedf" />

## Features

- **Authentic WeatherStar 4000 look** — orange trapezoid header, blue-to-amber gradient, beveled 3D panels, CRT scanlines
- **5 page types** — data-grid, forecast, table, freeform, bar-chart (with 3D animated bars)
- **Smooth jazz audio** — crossfading tracks via Web Audio API
- **Scrolling ticker** — continuous bottom crawl with configurable items
- **Live clock** — 12h or 24h format
- **Fully configurable** — everything driven by JSON (pages, colors, fonts, audio, themes)
- **Built-in editor** — press `E` to edit config live, apply instantly
- **Retro volume OSD** — green CRT-style bar when adjusting volume

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and click to start.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `E` | Toggle config editor |
| `M` | Toggle mute |
| `Arrow Up/Down` | Volume up/down |
| `Escape` | Close editor |
| `F11` | Fullscreen |

## Configuration

Everything is driven by a single JSON config. Press `E` to open the editor, or load a config via URL: `?config=stocks.json`

### Page Types

**data-grid** — two-column key/value rows
```json
{ "type": "data-grid", "title": "Current Conditions", "rows": [
  { "label": "Temperature", "value": "72\u00b0F" },
  { "label": "Humidity", "value": "65%" }
]}
```

**forecast** — multi-column cards with icons
```json
{ "type": "forecast", "title": "5-Day Forecast", "cards": [
  { "label": "Mon", "icon": "\u2600\ufe0f", "primary": "78\u00b0", "secondary": "Lo 62\u00b0" }
]}
```

**table** — tabular data with column headers
```json
{ "type": "table", "title": "Almanac", "columns": ["Metric", "Today", "Normal"],
  "rows": [["High Temp", "78\u00b0F", "75\u00b0F"]]
}
```

**bar-chart** — 3D animated bar chart
```json
{ "type": "bar-chart", "title": "Regional Temps", "unit": "\u00b0",
  "bars": [
    { "label": "DT", "value": 78, "color": "#ff6644" },
    { "label": "APT", "value": 71, "color": "#44bbff" }
  ]
}
```

**freeform** — raw HTML
```json
{ "type": "freeform", "title": "Alert", "html": "<h2>Heat Advisory</h2><p>Stay cool.</p>" }
```

### Header

```json
"header": {
  "title": "Your Local Forecast",
  "showClock": true,
  "clockFormat": "12h",
  "logoText": "THE\nWEATHER\nCHANNEL"
}
```

### Audio

```json
"audio": {
  "enabled": true,
  "tracks": [
    { "name": "Smooth Jazz 1", "url": "/audio/track1.mp3" }
  ],
  "volume": 0.6,
  "crossfadeDurationS": 3,
  "shuffle": false,
  "autoplay": true
}
```

Add your own tracks by placing MP3 files in `public/audio/` and referencing them in the config.

### Theme Overrides

```json
"theme": {
  "backgroundGradient1": "#1c3068",
  "backgroundGradient4": "#c08030",
  "labelColor": "#ffcc00",
  "valueColor": "#ffffff",
  "scanlineOpacity": 0.06
}
```

## Sample Configs

Load alternate configs via URL parameter:

- `?config=weather.json` — weather focused
- `?config=stocks.json` — market data with green theme
- `?config=astrology.json` — zodiac themed

## Tech Stack

- Vite + vanilla TypeScript (no framework)
- Plain CSS with custom properties
- Web Audio API for crossfading playback
- 640x480 fixed resolution, CSS scaled to fill viewport
- ~22KB JS + ~9KB CSS (gzipped ~10KB total)

## Project Structure

```
src/
  main.ts                  # Bootstrap, keyboard shortcuts, scaling
  types.ts                 # All TypeScript interfaces
  config/
    schema.ts              # Validation, defaults, theme application
    sample-weather.ts      # Embedded default config
  engine/
    PresentationEngine.ts  # Page cycling with double-buffered stages
    TransitionManager.ts   # Fade/slide/wipe transitions
    TickerManager.ts       # Bottom scrolling ticker
  audio/
    AudioEngine.ts         # Web Audio API player with crossfade
    playlist.ts            # Track management
  panels/
    PanelRenderer.ts       # Routes page type to renderer
    HeaderRenderer.ts      # Title bar, clock, logo
    DataGridPanel.ts       # Key/value grid
    ForecastPanel.ts       # Multi-column cards
    TablePanel.ts          # Tabular data
    FreeformPanel.ts       # Raw HTML
    BarChartPanel.ts       # 3D animated bar chart
  editor/
    EditorUI.ts            # JSON config editor overlay
  styles/                  # All CSS
public/
  audio/                   # MP3 tracks
  fonts/                   # VCR OSD Mono, PixelOperator
  sample-configs/          # Alternate JSON configs
```
