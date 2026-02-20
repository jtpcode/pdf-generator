import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Dashboard from '../../components/Dashboard'
import fileService from '../../services/fileService'
import { renderWithRouter, createMockFileData, createMockFilesList } from './helpers.jsx'

vi.mock('../../services/fileService')
vi.mock('../../components/Navigation', () => ({
  default: ({ onLogout }) => (
    <div>
      <h3>Dashboard</h3>
      <button onClick={onLogout}>Logout</button>
    </div>
  )
}))

// NOTE: waitFor is used to handle async state updates (fetchFiles in useEffect)
// instead of using act() directly.

describe('Dashboard Component', () => {
  const mockOnLogout = vi.fn()
  const mockUser = { username: 'testuser' }

  beforeEach(() => {
    vi.clearAllMocks()
    fileService.getAllFiles.mockResolvedValue([])
  })

  it('renders welcome message', async () => {
    renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    })
  })

  it('renders logout button', async () => {
    renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      expect(logoutButton).toBeInTheDocument()
    })
  })

  it('calls onLogout when logout button is clicked', async () => {
    const user = userEvent.setup()

    renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(mockOnLogout).toHaveBeenCalledTimes(1)
  })

  it('logout button is clickable and not disabled', async () => {
    renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      expect(logoutButton).not.toBeDisabled()
    })
  })

  describe('File Upload', () => {
    it('renders file upload section', async () => {
      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Upload File/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Choose File/i })).toBeInTheDocument()
      })
    })

    it('renders user files section', async () => {
      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Your Files/i })).toBeInTheDocument()
      })
    })

    it('displays "No files uploaded yet" when there are no files', async () => {
      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText(/No files uploaded yet/i)).toBeInTheDocument()
      })
    })

    it('fetches and displays files', async () => {
      const mockFiles = createMockFilesList()
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test-file.xlsx')).toBeInTheDocument()
        expect(screen.getByText('another-file.xlsx')).toBeInTheDocument()
      })

      expect(fileService.getAllFiles).toHaveBeenCalledTimes(1)
    })

    it('uploads Excel file successfully', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['mock content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const uploadedFile = createMockFileData(1, 'test.xlsx', 1024)
      fileService.uploadFile.mockResolvedValue(uploadedFile)
      fileService.getAllFiles.mockResolvedValueOnce([]).mockResolvedValueOnce([uploadedFile])

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/File uploaded successfully!/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile)
      expect(fileService.getAllFiles).toHaveBeenCalledTimes(2)  // Once on page load, once after upload
    })

    it('uploads .xls file successfully', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['mock content'], 'old-format.xls', {
        type: 'application/vnd.ms-excel'
      })

      const uploadedFile = createMockFileData(1, 'old-format.xls', 1024)
      fileService.uploadFile.mockResolvedValue(uploadedFile)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/File uploaded successfully!/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile)
    })

    it('shows error when uploading non-Excel or non-PNG file', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['mock content'], 'test.pdf', {
        type: 'application/pdf'
      })

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/Only Excel files \(\.xls, \.xlsx\) and PNG images \(\.png\) are allowed/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).not.toHaveBeenCalled()
    })

    it('uploads PNG file successfully', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['mock content'], 'test.png', {
        type: 'image/png'
      })

      const uploadedFile = createMockFileData(1, 'test.png', 2048)
      fileService.uploadFile.mockResolvedValue(uploadedFile)
      fileService.getAllFiles.mockResolvedValueOnce([]).mockResolvedValueOnce([uploadedFile])

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/File uploaded successfully!/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile)
      expect(fileService.getAllFiles).toHaveBeenCalledTimes(2)
    })

    it('shows error when file upload fails', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['mock content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      fileService.uploadFile.mockRejectedValue(new Error('Upload failed'))

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile)
    })

    it('shows error when fetching files fails', async () => {
      fileService.getAllFiles.mockRejectedValue(new Error('Failed to fetch files'))

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch files/i)).toBeInTheDocument()
      })
    })

    it('displays file size correctly', async () => {
      const mockFiles = createMockFilesList()
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText(/512 B/i)).toBeInTheDocument()
        expect(screen.getByText(/2\.0 KB/i)).toBeInTheDocument()
      })
    })

    it('displays file size in MB for files >= 1048576 bytes', async () => {
      const mockFiles = [
        createMockFileData(1, 'large-file.xlsx', 5242880)
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText(/5\.0 MB/i)).toBeInTheDocument()
      })
    })

    it('prevents uploading when file limit of 3 is reached', async () => {
      const user = userEvent.setup()
      const threeFiles = [
        createMockFileData(1, 'file1.xlsx', 1024),
        createMockFileData(2, 'file2.xlsx', 2048),
        createMockFileData(3, 'file3.xlsx', 3072)
      ]
      fileService.getAllFiles.mockResolvedValue(threeFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('file1.xlsx')).toBeInTheDocument()
      })

      const mockFile = new File(['mock content'], 'file4.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/File limit reached\. You can only upload up to 3 files\./i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).not.toHaveBeenCalled()
    })

    it('prevents uploading a file with a duplicate name', async () => {
      const user = userEvent.setup()
      const existingFile = createMockFileData(1, 'duplicate.xlsx', 1024)
      fileService.getAllFiles.mockResolvedValue([existingFile])

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('duplicate.xlsx')).toBeInTheDocument()
      })

      const mockFile = new File(['mock content'], 'duplicate.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/A file with the same name already exists\./i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).not.toHaveBeenCalled()
    })
  })

  describe('File Deletion', () => {
    beforeEach(() => {
      window.confirm = vi.fn()
    })

    it('renders delete button for each file', async () => {
      const mockFiles = [
        createMockFileData(1, 'test-file.xlsx', 512),
        createMockFileData(2, 'another-file.xlsx', 2048)
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('delete')
        expect(deleteButtons).toHaveLength(2)
      })
    })

    it('deletes file when delete button is clicked and confirmed', async () => {
      const user = userEvent.setup()
      const mockFiles = [createMockFileData(1, 'test-file.xlsx', 512)]
      fileService.getAllFiles.mockResolvedValueOnce(mockFiles).mockResolvedValueOnce([])
      fileService.deleteFile.mockResolvedValue()
      window.confirm.mockReturnValue(true)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test-file.xlsx')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText('delete')
      await user.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete test-file.xlsx?')

      await waitFor(() => {
        expect(screen.getByText(/File deleted successfully!/i)).toBeInTheDocument()
      })

      expect(fileService.deleteFile).toHaveBeenCalledWith(1)
      expect(fileService.getAllFiles).toHaveBeenCalledTimes(2)
    })

    it('does not delete file when user cancels confirmation', async () => {
      const user = userEvent.setup()
      const mockFiles = [createMockFileData(1, 'test-file.xlsx', 512)]
      fileService.getAllFiles.mockResolvedValue(mockFiles)
      window.confirm.mockReturnValue(false)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test-file.xlsx')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText('delete')
      await user.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete test-file.xlsx?')
      expect(fileService.deleteFile).not.toHaveBeenCalled()
    })

    it('shows error when file deletion fails', async () => {
      const user = userEvent.setup()
      const mockFiles = [createMockFileData(1, 'test-file.xlsx', 512)]
      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.deleteFile.mockRejectedValue(new Error('Delete failed'))
      window.confirm.mockReturnValue(true)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test-file.xlsx')).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText('delete')
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText(/Delete failed/i)).toBeInTheDocument()
      })

      expect(fileService.deleteFile).toHaveBeenCalledWith(1)
    })

    it('deletes correct file when multiple files exist', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        createMockFileData(1, 'first-file.xlsx', 512),
        createMockFileData(2, 'second-file.xlsx', 1024),
        createMockFileData(3, 'third-file.xlsx', 2048)
      ]
      const filesAfterDeletion = [
        createMockFileData(1, 'first-file.xlsx', 512),
        createMockFileData(3, 'third-file.xlsx', 2048)
      ]
      fileService.getAllFiles.mockResolvedValueOnce(mockFiles).mockResolvedValueOnce(filesAfterDeletion)
      fileService.deleteFile.mockResolvedValue()
      window.confirm.mockReturnValue(true)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('second-file.xlsx')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByLabelText('delete')
      await user.click(deleteButtons[1])

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete second-file.xlsx?')
      expect(fileService.deleteFile).toHaveBeenCalledWith(2)

      await waitFor(() => {
        expect(screen.queryByText('second-file.xlsx')).not.toBeInTheDocument()
        expect(screen.getByText('first-file.xlsx')).toBeInTheDocument()
        expect(screen.getByText('third-file.xlsx')).toBeInTheDocument()
      })
    })
  })

  describe('PDF Generation', () => {
    let mockLink
    let originalCreateElement
    let originalAppendChild
    let originalRemoveChild
    let appendChildSpy
    let removeChildSpy

    beforeEach(() => {
      localStorage.clear()
      originalCreateElement = document.createElement
      originalAppendChild = document.body.appendChild
      originalRemoveChild = document.body.removeChild

      mockLink = {
        href: '',
        download: '',
        target: '',
        rel: '',
        click: vi.fn()
      }

      document.createElement = vi.fn((tagName) => {
        if (tagName === 'a') {
          return mockLink
        }
        return originalCreateElement.call(document, tagName)
      })

      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        if (node === mockLink) {
          return node
        }
        return originalAppendChild.call(document.body, node)
      })

      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
        if (node === mockLink) {
          return node
        }
        return originalRemoveChild.call(document.body, node)
      })

      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      window.URL.revokeObjectURL = vi.fn()
    })

    afterEach(() => {
      document.createElement = originalCreateElement
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('renders PDF generator toggle switch', async () => {
      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'PDFKit / HTML + Puppeteer generator selector' })).toBeInTheDocument()
      })
    })

    it('toggle defaults to PDFKit (unchecked)', async () => {
      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        const toggle = screen.getByRole('checkbox', { name: 'PDFKit / HTML + Puppeteer generator selector' })
        expect(toggle).not.toBeChecked()
      })
    })

    it('renders generate PDF button for Excel files', async () => {
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByLabelText('generate pdf')).toBeInTheDocument()
      })
    })

    it('does not render generate PDF button for PNG files', async () => {
      const mockFiles = [
        { id: 1, originalName: 'image.png', fileSize: 1024, createdAt: new Date().toISOString() }
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('image.png')).toBeInTheDocument()
      })

      expect(screen.queryByLabelText('generate pdf')).not.toBeInTheDocument()
      expect(screen.getByLabelText('delete')).toBeInTheDocument()
    })

    it('generates PDF with PDFKit by default (toggle off)', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })

      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.generatePdf.mockResolvedValue(mockBlob)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test.xlsx')).toBeInTheDocument()
      })

      const pdfButton = screen.getByLabelText('generate pdf')
      await user.click(pdfButton)

      await waitFor(() => {
        expect(fileService.generatePdf).toHaveBeenCalledWith(1, false)
        expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
        expect(document.createElement).toHaveBeenCalledWith('a')
        expect(mockLink.href).toBe('blob:mock-url')
        expect(mockLink.download).toBe('Product Name.pdf')
        expect(mockLink.target).toBe('_blank')
        expect(mockLink.rel).toBe('noopener noreferrer')
        expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
        expect(mockLink.click).toHaveBeenCalled()
        expect(removeChildSpy).toHaveBeenCalledWith(mockLink)
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
        expect(screen.getByText(/PDF generated successfully!/i)).toBeInTheDocument()
      })
    })

    it('generates PDF with Puppeteer when toggle is on', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })

      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.generatePdf.mockResolvedValue(mockBlob)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test.xlsx')).toBeInTheDocument()
      })

      const toggle = screen.getByRole('checkbox', { name: 'PDFKit / HTML + Puppeteer generator selector' })
      await user.click(toggle)

      const pdfButton = screen.getByLabelText('generate pdf')
      await user.click(pdfButton)

      await waitFor(() => {
        expect(fileService.generatePdf).toHaveBeenCalledWith(1, true)
        expect(screen.getByText(/PDF generated successfully!/i)).toBeInTheDocument()
      })
    })

    it('shows error when PDF generation fails', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]

      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.generatePdf.mockRejectedValue(new Error('PDF generation failed'))

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test.xlsx')).toBeInTheDocument()
      })

      const pdfButton = screen.getByLabelText('generate pdf')
      await user.click(pdfButton)

      await waitFor(() => {
        expect(fileService.generatePdf).toHaveBeenCalledWith(1, false)
        expect(screen.getByText(/PDF generation failed/i)).toBeInTheDocument()
      })
    })

    it('has separate PDF buttons for multiple Excel files', async () => {
      const mockFiles = [
        { id: 1, originalName: 'first.xlsx', fileSize: 512, createdAt: new Date().toISOString() },
        { id: 2, originalName: 'second.xlsx', fileSize: 1024, createdAt: new Date().toISOString() }
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        const pdfButtons = screen.getAllByLabelText('generate pdf')
        expect(pdfButtons).toHaveLength(2)
      })
    })

    it('shows PDF button only for Excel files when mixed with PNG', async () => {
      const mockFiles = [
        { id: 1, originalName: 'document.xlsx', fileSize: 512, createdAt: new Date().toISOString() },
        { id: 2, originalName: 'image.png', fileSize: 1024, createdAt: new Date().toISOString() },
        { id: 3, originalName: 'spreadsheet.xls', fileSize: 2048, createdAt: new Date().toISOString() }
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('document.xlsx')).toBeInTheDocument()
        expect(screen.getByText('image.png')).toBeInTheDocument()
        expect(screen.getByText('spreadsheet.xls')).toBeInTheDocument()
      })

      const pdfButtons = screen.getAllByLabelText('generate pdf')
      expect(pdfButtons).toHaveLength(2)

      const deleteButtons = screen.getAllByLabelText('delete')
      expect(deleteButtons).toHaveLength(3)
    })
  })

  describe('HTML Preview', () => {
    let mockPreviewWindow

    beforeEach(() => {
      mockPreviewWindow = { location: { href: '' } }
      window.open = vi.fn(() => mockPreviewWindow)
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      window.URL.revokeObjectURL = vi.fn()
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('renders preview html button for Excel files', async () => {
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByLabelText('preview html')).toBeInTheDocument()
      })
    })

    it('calls getHtmlPreview with correct file ID', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        { id: 7, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]

      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.getHtmlPreview.mockResolvedValue('<html><body>Preview</body></html>')

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => expect(screen.getByText('test.xlsx')).toBeInTheDocument())

      await user.click(screen.getByLabelText('preview html'))

      await waitFor(() => {
        expect(fileService.getHtmlPreview).toHaveBeenCalledWith(7)
      })
    })

    it('opens new window and loads HTML blob URL', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]

      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.getHtmlPreview.mockResolvedValue('<html><body>Preview</body></html>')

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => expect(screen.getByText('test.xlsx')).toBeInTheDocument())

      await user.click(screen.getByLabelText('preview html'))

      await waitFor(() => {
        expect(window.open).toHaveBeenCalledWith('about:blank', '_blank')
        expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
        expect(mockPreviewWindow.location.href).toBe('blob:mock-url')
      })
    })

    it('shows error when getHtmlPreview fails', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]

      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.getHtmlPreview.mockRejectedValue(new Error('Failed to generate HTML preview'))

      renderWithRouter(<Dashboard user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => expect(screen.getByText('test.xlsx')).toBeInTheDocument())

      await user.click(screen.getByLabelText('preview html'))

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate HTML preview/i)).toBeInTheDocument()
      })
    })
  })
})
