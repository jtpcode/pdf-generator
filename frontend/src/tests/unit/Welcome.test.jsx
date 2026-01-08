import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Welcome from '../../components/Welcome'
import authService from '../../services/authService'
import fileService from '../../services/fileService'

vi.mock('../../services/authService')
vi.mock('../../services/fileService')

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
  })
})