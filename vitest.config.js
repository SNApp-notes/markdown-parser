import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['index.js', 'src/**/*.js'],
      exclude: ['test/**', 'node_modules/**']
    }
  }
});
