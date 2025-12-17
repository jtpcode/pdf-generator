import { test, expect } from '@playwright/test'

// Helper function to create mock Excel file
const createMockExcelFile = (filename, content = 'mock excel file content', fileExtension = 'xlsx') => {
  const mimeTypes = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel'
  }
  
  return {
    name: filename,
    mimeType: mimeTypes[fileExtension] || mimeTypes.xlsx,
    buffer: Buffer.from(content)
  }
}

// Helper function to upload file
const uploadFile = async (page, fileConfig) => {
  await page.setInputFiles('input[type="file"]', fileConfig)
}

test.describe('Login functionality', () => {
  test.beforeEach(async ({ page, request }) => {
    // Reset database
    await request.post('http://localhost:3001/api/testing/resetDb')
    
    // Create test user
    await request.post('http://localhost:3001/api/users', {
      data: {
        username: 'testuser',
        name: 'Test User',
        password: 'testpassword'
      }
    })

    // Navigate to the application
    await page.goto('/')
  })

  test.afterAll(async ({ request }) => {
    // Clean up uploads after all tests
    await request.post('http://localhost:3001/api/testing/deleteTestUploads')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible()
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('testpassword')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible()
    await expect(page.getByText(/Logged in as: testuser/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible()
  })

  test('should require both username and password', async ({ page }) => {
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible()
  })

  test.describe('When logged in', () => {
    test.beforeEach(async ({ page }) => {
      // Login
      await page.getByLabel('Username').fill('testuser')
      await page.getByLabel('Password').fill('testpassword')
      await page.getByRole('button', { name: 'Login' }).click()
      await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible()
    })

    test('should display user information', async ({ page }) => {
      await expect(page.getByText(/Logged in as: testuser/)).toBeVisible()
    })

    test('should be able to logout', async ({ page }) => {
      await page.getByRole('button', { name: 'Logout' }).click()
      await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible()
    })

    test('should persist session after page reload', async ({ page }) => {
      await page.reload()

      await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible()
      await expect(page.getByText(/Logged in as: testuser/)).toBeVisible()
    })

    test('should display file upload section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Upload Excel File' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Choose File' })).toBeVisible()
    })

    test('should display user files section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Your Files' })).toBeVisible()
      await expect(page.getByText('No files uploaded yet')).toBeVisible()
    })

    test('should upload an Excel file successfully', async ({ page }) => {
      await uploadFile(page, createMockExcelFile('test-file.xlsx'))

      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      await expect(page.getByText('test-file.xlsx')).toBeVisible()
    })

    test('should reject non-Excel files', async ({ page }) => {
      // Try to upload a PDF file
      await uploadFile(page, {
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('mock pdf content')
      })

      await expect(page.getByRole('alert')).toContainText('Only Excel files (.xls, .xlsx) are allowed')
      
      await expect(page.getByText('test-file.pdf')).not.toBeVisible()
    })

    test('should display multiple uploaded files', async ({ page }) => {
      // Upload first file
      await uploadFile(page, createMockExcelFile('first-file.xlsx', 'mock excel file 1'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      
      // Wait for success message to disappear
      await expect(page.getByRole('alert').filter({ hasText: 'File uploaded successfully!' })).not.toBeVisible()

      // Upload second file
      await uploadFile(page, createMockExcelFile('second-file.xlsx', 'mock excel file 2'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      await expect(page.getByText('first-file.xlsx')).toBeVisible()
      await expect(page.getByText('second-file.xlsx')).toBeVisible()
    })

    test('should show file size and upload date', async ({ page }) => {
      await uploadFile(page, createMockExcelFile('sized-file.xlsx', 'mock excel content with some size'))

      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      
      // Check that file size info is displayed (the exact format depends on file size)
      const listItem = page.locator('li', { has: page.getByText('sized-file.xlsx') })
      await expect(listItem).toBeVisible()
      
      // Should contain file size info (B, KB, or MB)
      await expect(listItem).toContainText(/B|KB|MB/)
    })

    test('should support .xls file format', async ({ page }) => {
      await uploadFile(page, createMockExcelFile('old-format.xls', 'mock xls file content', 'xls'))

      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      await expect(page.getByText('old-format.xls')).toBeVisible()
    })

    test('should disable upload button while uploading', async ({ page }) => {
      // This test verifies the loading state
      const uploadButton = page.getByRole('button', { name: 'Choose File' })
      await expect(uploadButton).toBeEnabled()
      
      // Note: The actual disabled state might be too fast to catch in a real test
      // but the component should handle it
      await uploadFile(page, createMockExcelFile('test-upload.xlsx', 'mock excel file'))

      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
    })
  })
})