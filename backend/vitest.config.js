import { defineConfig } from 'vitest/config'

// Disable parallelism to avoid database conflicts during tests
export default defineConfig({
  test: {
    environment: 'node',
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    },
    fileParallelism: false,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['controllers/**', 'utils/**', 'models/**'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.test.js',
        '**/*.spec.js',
        'migrations/**',
      ]
    }
  }
})