import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fileService from '../../services/fileService'
import authService from '../../services/authService'

vi.mock('../../services/authService')

describe('fileService', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    authService.getToken.mockReturnValue('test-token')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getAllFiles', () => {
    it('sends GET request with authorization header', async () => {
      const mockFiles = [
        { id: 1, filename: 'test.csv', uploadedAt: '2024-01-01' },
        { id: 2, filename: 'test2.csv', uploadedAt: '2024-01-02' }
      ]
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockFiles
      })

      const result = await fileService.getAllFiles()

      expect(global.fetch).toHaveBeenCalledWith('/api/files', {
        headers: { 'Authorization': 'Bearer test-token' }
      })
      expect(result).toEqual(mockFiles)
    })

    it('throws error with server message when request fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' })
      })

      await expect(fileService.getAllFiles())
        .rejects.toThrow('Unauthorized')
    })

    it('throws generic error when server returns no error message', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      })

      await expect(fileService.getAllFiles())
        .rejects.toThrow('Failed to fetch files')
    })

    it('throws error with status code when response is not JSON', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => { throw new Error('Not JSON') }
      })

      await expect(fileService.getAllFiles())
        .rejects.toThrow('Failed to fetch files (503)')
    })
  })

  describe('uploadFile', () => {
    it('sends POST request with file as FormData', async () => {
      const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' })
      const mockResponse = { id: 1, filename: 'test.csv' }
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await fileService.uploadFile(mockFile)

      expect(global.fetch).toHaveBeenCalledWith('/api/files', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-token' },
        body: expect.any(FormData)
      })
      expect(result).toEqual(mockResponse)
    })

    it('throws error when no file is provided', async () => {
      await expect(fileService.uploadFile(undefined))
        .rejects.toThrow('No file provided')
    })

    it('throws error when file is null', async () => {
      await expect(fileService.uploadFile(null))
        .rejects.toThrow('No file provided')
    })

    it('throws error with server message when upload fails', async () => {
      const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' })
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid file format' })
      })

      await expect(fileService.uploadFile(mockFile))
        .rejects.toThrow('Invalid file format')
    })

    it('throws generic error when server returns no error message', async () => {
      const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' })
      global.fetch.mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({})
      })

      await expect(fileService.uploadFile(mockFile))
        .rejects.toThrow('Failed to upload file')
    })

    it('throws error with status code when response is not JSON', async () => {
      const mockFile = new File(['content'], 'test.csv', { type: 'text/csv' })
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Not JSON') }
      })

      await expect(fileService.uploadFile(mockFile))
        .rejects.toThrow('Failed to upload file (500)')
    })
  })

  describe('deleteFile', () => {
    it('sends DELETE request with file ID and authorization', async () => {
      global.fetch.mockResolvedValue({ ok: true })

      await fileService.deleteFile(123)

      expect(global.fetch).toHaveBeenCalledWith('/api/files/123', {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer test-token' }
      })
    })

    it('throws error with server message when deletion fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'File not found' })
      })

      await expect(fileService.deleteFile(999))
        .rejects.toThrow('File not found')
    })

    it('throws generic error when server returns no error message', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({})
      })

      await expect(fileService.deleteFile(123))
        .rejects.toThrow('Failed to delete file')
    })

    it('throws error with status code when response is not JSON', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Not JSON') }
      })

      await expect(fileService.deleteFile(123))
        .rejects.toThrow('Failed to delete file (500)')
    })
  })

  describe('generatePdf', () => {
    it('uses pdf-kit endpoint by default when usePuppeteer is false', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' })
      global.fetch.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob
      })

      const result = await fileService.generatePdf(123, false)

      expect(global.fetch).toHaveBeenCalledWith('/api/files/123/pdf-kit', {
        headers: { 'Authorization': 'Bearer test-token' }
      })
      expect(result).toBe(mockBlob)
    })

    it('uses pdf-kit endpoint when no usePuppeteer parameter provided', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' })
      global.fetch.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob
      })

      const result = await fileService.generatePdf(123)

      expect(global.fetch).toHaveBeenCalledWith('/api/files/123/pdf-kit', {
        headers: { 'Authorization': 'Bearer test-token' }
      })
      expect(result).toBe(mockBlob)
    })

    it('uses pdf-puppeteer endpoint when usePuppeteer is true', async () => {
      const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' })
      global.fetch.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob
      })

      const result = await fileService.generatePdf(123, true)

      expect(global.fetch).toHaveBeenCalledWith('/api/files/123/pdf-puppeteer', {
        headers: { 'Authorization': 'Bearer test-token' }
      })
      expect(result).toBe(mockBlob)
    })

    it('throws error with server message when PDF generation fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'File not found' })
      })

      await expect(fileService.generatePdf(999, false))
        .rejects.toThrow('File not found')
    })

    it('throws error with server message when Puppeteer PDF generation fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'File not found' })
      })

      await expect(fileService.generatePdf(999, true))
        .rejects.toThrow('File not found')
    })

    it('throws generic error when server returns no error message', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      })

      await expect(fileService.generatePdf(123))
        .rejects.toThrow('Failed to generate PDF')
    })

    it('throws error with status code when response is not JSON', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => { throw new Error('Not JSON') }
      })

      await expect(fileService.generatePdf(123))
        .rejects.toThrow('Failed to generate PDF (400)')
    })
  })
})
