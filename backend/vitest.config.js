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
    testTimeout: 10000
  }
})