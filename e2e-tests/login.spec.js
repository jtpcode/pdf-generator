import { test, expect } from '@playwright/test'
import { createMockExcelFile, createMockPngFile, uploadFile, resetDatabase } from './helpers.js'

test.describe('Login functionality', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDatabase(request)
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
      await expect(page.getByRole('heading', { name: 'Upload File' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Choose File' })).toBeVisible()
    })

    test('should display user files section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Your Files' })).toBeVisible()
      await expect(page.getByText('No files uploaded yet')).toBeVisible()
    })

    test('should upload Excel files successfully (.xlsx and .xls)', async ({ page }) => {
      await uploadFile(page, await createMockExcelFile('test-file.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      await expect(page.getByText('test-file.xlsx')).toBeVisible()

      await expect(page.getByRole('alert').filter({ hasText: 'File uploaded successfully!' })).not.toBeVisible({ timeout: 7000 })

      await uploadFile(page, await createMockExcelFile('old-format.xls', null, 'xls'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      await expect(page.getByText('old-format.xls')).toBeVisible()
    })

    test('should reject non-Excel files', async ({ page }) => {
      await uploadFile(page, {
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('mock pdf content')
      })

      await expect(page.getByRole('alert')).toContainText('Only Excel files (.xls, .xlsx) and PNG images (.png) are allowed')

      await expect(page.getByText('test-file.pdf')).not.toBeVisible()
    })

    test('should upload PNG file successfully', async ({ page }) => {
      await uploadFile(page, createMockPngFile('test-image.png'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')
      await expect(page.getByText('test-image.png')).toBeVisible()
    })

    test('should display multiple uploaded files', async ({ page }) => {
      await uploadFile(page, await createMockExcelFile('first-file.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      await expect(page.getByRole('alert').filter({ hasText: 'File uploaded successfully!' })).not.toBeVisible({ timeout: 7000 })

      await uploadFile(page, await createMockExcelFile('second-file.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      await expect(page.getByText('first-file.xlsx')).toBeVisible()
      await expect(page.getByText('second-file.xlsx')).toBeVisible()
    })

    test('should show file size and upload date', async ({ page }) => {
      await uploadFile(page, await createMockExcelFile('sized-file.xlsx'))

      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      const listItem = page.locator('li', { has: page.getByText('sized-file.xlsx') })
      await expect(listItem).toBeVisible()

      await expect(listItem).toContainText(/B|KB|MB/)

      await expect(listItem).toContainText(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}-\d{2}-\d{2}/)
    })

    test('should display PDF generation button for uploaded files', async ({ page }) => {
      await uploadFile(page, await createMockExcelFile('test-pdf.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      const listItem = page.locator('li', { has: page.getByText('test-pdf.xlsx') })
      await expect(listItem).toBeVisible()

      const pdfButton = listItem.getByRole('button', { name: 'generate pdf' })
      await expect(pdfButton).toBeVisible()
    })

    test('should generate PDF from uploaded Excel file', async ({ page }) => {
      await uploadFile(page, await createMockExcelFile('generate-pdf-test.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      await expect(page.getByRole('alert').filter({ hasText: 'File uploaded successfully!' })).not.toBeVisible({ timeout: 7000 })

      const listItem = page.locator('li', { has: page.getByText('generate-pdf-test.xlsx') })
      const pdfButton = listItem.getByRole('button', { name: 'generate pdf' })

      await pdfButton.click()

      await expect(page.getByRole('alert')).toContainText('PDF generated successfully!')
    })

    test('should delete uploaded file', async ({ page }) => {
      await uploadFile(page, await createMockExcelFile('file-to-delete.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      await expect(page.getByText('file-to-delete.xlsx')).toBeVisible()

      const listItem = page.locator('li', { has: page.getByText('file-to-delete.xlsx') })
      const deleteButton = listItem.getByRole('button', { name: 'delete' })

      page.on('dialog', dialog => dialog.accept())
      await deleteButton.click()

      await expect(page.getByRole('alert')).toContainText('File deleted successfully!')
      await expect(page.getByText('file-to-delete.xlsx')).not.toBeVisible()
    })

    test('should display multiple files with individual action buttons', async ({ page }) => {
      await uploadFile(page, await createMockExcelFile('first.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      await expect(page.getByRole('alert').filter({ hasText: 'File uploaded successfully!' })).not.toBeVisible({ timeout: 7000 })

      await uploadFile(page, await createMockExcelFile('second.xlsx'))
      await expect(page.getByRole('alert')).toContainText('File uploaded successfully!')

      const firstFileItem = page.locator('li', { has: page.getByText('first.xlsx') })
      const secondFileItem = page.locator('li', { has: page.getByText('second.xlsx') })

      await expect(firstFileItem.getByRole('button', { name: 'generate pdf' })).toBeVisible()
      await expect(firstFileItem.getByRole('button', { name: 'delete' })).toBeVisible()

      await expect(secondFileItem.getByRole('button', { name: 'generate pdf' })).toBeVisible()
      await expect(secondFileItem.getByRole('button', { name: 'delete' })).toBeVisible()
    })
  })
})