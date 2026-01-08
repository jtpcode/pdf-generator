import { test, expect } from '@playwright/test'

// Helper functions
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

const uploadFile = async (page, fileConfig) => {
  await page.setInputFiles('input[type="file"]', fileConfig)
}

test.describe('Login functionality', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3001/api/testing/resetDb')

    await request.post('http://localhost:3001/api/users', {
      data: {
        username: 'testuser',
        name: 'Test User',
        password: 'testpassword123'
      }
    })

    await page.goto('/')
  })

  test.afterAll(async ({ request }) => {
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
    await page.getByLabel('Password').fill('testpassword123')
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
      await page.getByLabel('Username').fill('testuser')
      await page.getByLabel('Password').fill('testpassword123')
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

    test('should upload Excel files successfully (.xlsx and .xls)', async ({ page }) => {
      await uploadFile(page, createMockExcelFile('test-file.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      await expect(page.getByText('test-file.xlsx')).toBeVisible()

      await expect(page.getByRole('alert').filter({ hasText: 'File uploaded successfully!' })).not.toBeVisible()

      await uploadFile(page, createMockExcelFile('old-format.xls', 'mock xls file content', 'xls'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      await expect(page.getByText('old-format.xls')).toBeVisible()
    })

    test('should reject non-Excel files', async ({ page }) => {
      await uploadFile(page, {
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('mock pdf content')
      })

      await expect(page.getByRole('alert')).toContainText('Only Excel files (.xls, .xlsx) are allowed')

      await expect(page.getByText('test-file.pdf')).not.toBeVisible()
    })

    test('should display multiple uploaded files', async ({ page }) => {
      await uploadFile(page, createMockExcelFile('first-file.xlsx', 'mock excel file 1'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      await expect(page.getByRole('alert').filter({ hasText: 'File uploaded successfully!' })).not.toBeVisible()

      await uploadFile(page, createMockExcelFile('second-file.xlsx', 'mock excel file 2'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      await expect(page.getByText('first-file.xlsx')).toBeVisible()
      await expect(page.getByText('second-file.xlsx')).toBeVisible()
    })

    test('should show file size and upload date', async ({ page }) => {
      await uploadFile(page, createMockExcelFile('sized-file.xlsx', 'mock excel content with some size'))

      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      const listItem = page.locator('li', { has: page.getByText('sized-file.xlsx') })
      await expect(listItem).toBeVisible()

      await expect(listItem).toContainText(/B|KB|MB/)

      await expect(listItem).toContainText(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2}/)
    })
  })
})