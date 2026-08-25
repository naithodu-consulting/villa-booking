import { defineConfig } from 'vitest/config';
// @ts-ignore — import.meta.dirname is valid in ESM context
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@': import.meta.dirname + '/src',
    },
  },
});
