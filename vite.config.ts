import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/Shpy/',
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  build: { target: 'es2022', sourcemap: true },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
