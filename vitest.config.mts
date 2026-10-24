import { defineConfig } from 'vitest/config';

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
      // See the stub's own comment: `server-only` cannot be imported outside a
      // Next build, and the modules that carry it are worth testing.
      'server-only': import.meta.dirname + '/src/lib/__tests__/stubs/server-only.ts',
    },
  },
});
