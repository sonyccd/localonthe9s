import type { BarChartPageConfig } from '../types.ts';

export function renderBarChart(config: BarChartPageConfig): HTMLElement {
  const container = document.createElement('div');

  if (config.title) {
    const title = document.createElement('div');
    title.className = 'page-title';
    title.textContent = config.title;
    container.appendChild(title);
  }

  const chart = document.createElement('div');
  chart.className = 'bar-chart';

  const maxVal = config.maxValue ?? Math.max(...config.bars.map(b => b.value));

  for (let i = 0; i < config.bars.length; i++) {
    const bar = config.bars[i];
    const pct = maxVal > 0 ? (bar.value / maxVal) * 85 : 0;

    const col = document.createElement('div');
    col.className = 'bar-chart-col';

    // Value label above bar
    const valLabel = document.createElement('div');
    valLabel.className = 'bar-chart-value';
    valLabel.textContent = `${bar.value}${config.unit ?? ''}`;
    valLabel.style.animationDelay = `${i * 0.12 + 0.3}s`;
    col.appendChild(valLabel);

    // Bar wrapper (defines the full height area)
    const barWrap = document.createElement('div');
    barWrap.className = 'bar-chart-bar-wrap';

    // Container for bar + 3D faces (animated together)
    const bar3d = document.createElement('div');
    bar3d.className = 'bar-chart-bar';
    bar3d.style.height = `${pct}%`;
    bar3d.style.animationDelay = `${i * 0.12}s`;

    // Front face
    const front = document.createElement('div');
    front.className = 'bar-face-front';
    if (bar.color) front.style.background = bar.color;
    bar3d.appendChild(front);

    // Top face — parallelogram extending upper-right
    const top = document.createElement('div');
    top.className = 'bar-face-top';
    if (bar.color) {
      top.style.background = lighten(bar.color);
    }
    bar3d.appendChild(top);

    // Right face — parallelogram extending upper-right
    const right = document.createElement('div');
    right.className = 'bar-face-right';
    if (bar.color) {
      right.style.background = darken(bar.color);
    }
    bar3d.appendChild(right);

    barWrap.appendChild(bar3d);
    col.appendChild(barWrap);

    // Bottom label
    const label = document.createElement('div');
    label.className = 'bar-chart-label';
    label.textContent = bar.label;
    col.appendChild(label);

    chart.appendChild(col);
  }

  container.appendChild(chart);
  return container;
}

/** Simple color lightening by mixing with white */
function lighten(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.35));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

/** Simple color darkening by mixing with black */
function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * 0.45);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}
