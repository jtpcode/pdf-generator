import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

export const renderWithQueryClient = (ui) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  )
}

export const renderWithRouter = (component, { initialEntries = ['/dashboard'] } = {}) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

export const createMockFileData = (id, originalName, fileSize, timeOffset = 0) => ({
  id,
  originalName,
  fileSize,
  createdAt: new Date(new Date('2025-12-17T10:00:00.000Z').getTime() + timeOffset * 60 * 60 * 1000).toISOString()
})

export const createMockFilesList = () => [
  createMockFileData(1, 'test-file.xlsx', 512),
  createMockFileData(2, 'another-file.xlsx', 2048, 1)
]
