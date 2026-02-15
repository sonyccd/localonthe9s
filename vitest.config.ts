import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/types.ts',
        'src/config/sample-weather.ts',
        'src/export/VideoExporter.ts',
        'src/main.ts',
        'src/test-helpers/**',
      ],
      thresholds: {
        lines: 80,
      },
    },
  },
});
