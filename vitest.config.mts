import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Suspends properties.booking_cutoff_date for the whole run; see the file
    // itself for why it cannot live in the individual suites.
    globalSetup: ['./src/lib/__tests__/global-setup.ts'],
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
