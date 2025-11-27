import { defineConfig } from 'vitest/config'

// Disable parallelism to avoid database conflicts during tests
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    fileParallelism: false,
    sequence: {
      concurrent: false
    },
    testTimeout: 10000
  }
})