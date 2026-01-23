import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Welcome from '../../components/Welcome'
import authService from '../../services/authService'
import fileService from '../../services/fileService'

vi.mock('../../services/authService')
vi.mock('../../services/fileService')

// NOTE: waitFor is used to handle async state updates (fetchFiles in useEffect)
// instead of using act() directly.

describe('Welcome Component', () => {
  const mockOnLogout = vi.fn()
  const mockUser = { username: 'testuser' }

  beforeEach(() => {
    vi.clearAllMocks()
    fileService.getAllFiles.mockResolvedValue([])
  })

  it('renders welcome message', async () => {
    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    await waitFor(() => {
      expect(screen.getByText('Welcome!')).toBeInTheDocument()
    })
  })

  it('displays username correctly', async () => {
    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    await waitFor(() => {
      expect(screen.getByText(/Logged in as: testuser/i)).toBeInTheDocument()
    })
  })

  it('renders logout button', async () => {
    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      expect(logoutButton).toBeInTheDocument()
    })
  })

  it('calls authService.logout and onLogout when logout button is clicked', async () => {
    const user = userEvent.setup()
    authService.logout.mockImplementation(() => {})

    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    const logoutButton = screen.getByRole('button', { name: /logout/i })
    await user.click(logoutButton)

    expect(authService.logout).toHaveBeenCalledTimes(1)
    expect(mockOnLogout).toHaveBeenCalledTimes(1)
  })

  it('handles undefined user gracefully', async () => {
    render(<Welcome user={undefined} onLogout={mockOnLogout} />)

    await waitFor(() => {
      expect(screen.getByText(/Logged in as:/i)).toBeInTheDocument()
    })
  })

  it('handles null user gracefully', async () => {
    render(<Welcome user={null} onLogout={mockOnLogout} />)

    await waitFor(() => {
      expect(screen.getByText(/Logged in as:/i)).toBeInTheDocument()
    })
  })

  it('handles user without username property', async () => {
    const userWithoutUsername = {}
    render(<Welcome user={userWithoutUsername} onLogout={mockOnLogout} />)

    await waitFor(() => {
      expect(screen.getByText(/Logged in as:/i)).toBeInTheDocument()
    })
  })

  it('logout button is clickable and not disabled', async () => {
    render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

    await waitFor(() => {
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      expect(logoutButton).not.toBeDisabled()
    })
  })

  describe('File Upload', () => {
    // Helper functions for creating mock data
    const createMockFileData = (id, originalName, fileSize, timeOffset = 0) => ({
      id,
      originalName,
      fileSize,
      createdAt: new Date(new Date('2025-12-17T10:00:00.000Z').getTime() + timeOffset * 60 * 60 * 1000).toISOString()
    })

    const createMockFilesList = () => [
      createMockFileData(1, 'test-file.xlsx', 512),
      createMockFileData(2, 'another-file.xlsx', 2048, 1)
    ]

    it('renders file upload section', async () => {
      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Upload Excel File/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Choose File/i })).toBeInTheDocument()
      })
    })

    it('renders user files section', async () => {
      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Your Files/i })).toBeInTheDocument()
      })
    })

    it('displays "No files uploaded yet" when there are no files', async () => {
      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText(/No files uploaded yet/i)).toBeInTheDocument()
      })
    })

    it('fetches and displays files on mount', async () => {
      const mockFiles = createMockFilesList()
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/File uploaded successfully!/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile)
      expect(fileService.getAllFiles).toHaveBeenCalledTimes(2)  // Once on page load, once after upload
    })

    it('shows error when uploading non-Excel file', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['mock content'], 'test.pdf', {
        type: 'application/pdf'
      })

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/Only Excel files \(\.xls, \.xlsx\) are allowed/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).not.toHaveBeenCalled()
    })

    it('shows error when file upload fails', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['mock content'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      fileService.uploadFile.mockRejectedValue(new Error('Upload failed'))

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile)
    })

    it('supports .xls file format', async () => {
      const user = userEvent.setup()
      const mockFile = new File(['mock content'], 'old-format.xls', {
        type: 'application/vnd.ms-excel'
      })

      const uploadedFile = createMockFileData(1, 'old-format.xls', 1024)
      fileService.uploadFile.mockResolvedValue(uploadedFile)

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })
      await user.upload(fileInput, mockFile)

      await waitFor(() => {
        expect(screen.getByText(/File uploaded successfully!/i)).toBeInTheDocument()
      })

      expect(fileService.uploadFile).toHaveBeenCalledWith(mockFile)
    })

    it('shows error when fetching files fails', async () => {
      fileService.getAllFiles.mockRejectedValue(new Error('Failed to fetch files'))

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch files/i)).toBeInTheDocument()
      })
    })

    it('displays file size correctly', async () => {
      const mockFiles = createMockFilesList()
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText(/5\.0 MB/i)).toBeInTheDocument()
      })
    })

    it('does nothing when no file is selected', async () => {
      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      const fileInput = screen.getByLabelText(/Choose File/i, { selector: 'input[type="file"]' })

      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false
      })

      const changeEvent = new Event('change', { bubbles: true })
      fileInput.dispatchEvent(changeEvent)

      await waitFor(() => {
        expect(fileService.uploadFile).not.toHaveBeenCalled()
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

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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
    const createMockFileData = (id, originalName, fileSize, timeOffset = 0) => ({
      id,
      originalName,
      fileSize,
      createdAt: new Date(new Date('2025-12-17T10:00:00.000Z').getTime() + timeOffset * 60 * 60 * 1000).toISOString()
    })

    beforeEach(() => {
      window.confirm = vi.fn()
    })

    it('renders delete button for each file', async () => {
      const mockFiles = [
        createMockFileData(1, 'test-file.xlsx', 512),
        createMockFileData(2, 'another-file.xlsx', 2048)
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

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

    it('renders generate PDF button for one file', async () => {
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByLabelText('generate pdf')).toBeInTheDocument()
      })
    })

    it('generates PDF and downloads with correct filename on button click', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]
      const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' })

      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.generatePdf.mockResolvedValue(mockBlob)

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test.xlsx')).toBeInTheDocument()
      })

      const pdfButton = screen.getByLabelText('generate pdf')
      await user.click(pdfButton)

      await waitFor(() => {
        expect(fileService.generatePdf).toHaveBeenCalledWith(1)
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

    it('shows error when PDF generation fails', async () => {
      const user = userEvent.setup()
      const mockFiles = [
        { id: 1, originalName: 'test.xlsx', fileSize: 512, createdAt: new Date().toISOString() }
      ]

      fileService.getAllFiles.mockResolvedValue(mockFiles)
      fileService.generatePdf.mockRejectedValue(new Error('PDF generation failed'))

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        expect(screen.getByText('test.xlsx')).toBeInTheDocument()
      })

      const pdfButton = screen.getByLabelText('generate pdf')
      await user.click(pdfButton)

      await waitFor(() => {
        expect(screen.getByText(/PDF generation failed/i)).toBeInTheDocument()
      })
    })

    it('has separate PDF buttons for multiple files', async () => {
      const mockFiles = [
        { id: 1, originalName: 'first.xlsx', fileSize: 512, createdAt: new Date().toISOString() },
        { id: 2, originalName: 'second.xlsx', fileSize: 1024, createdAt: new Date().toISOString() }
      ]
      fileService.getAllFiles.mockResolvedValue(mockFiles)

      render(<Welcome user={mockUser} onLogout={mockOnLogout} />)

      await waitFor(() => {
        const pdfButtons = screen.getAllByLabelText('generate pdf')
        expect(pdfButtons).toHaveLength(2)
      })
    })
  })
})