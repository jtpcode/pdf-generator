import { test, expect } from '@playwright/test'
import { createMockExcelFile, createMockPngFile, uploadFile, resetDatabase } from './helpers.js'

test.describe('Login functionality', () => {
  test.beforeEach(async ({ page, request }) => {
    await resetDatabase(request)
    await request.post('http://localhost:3001/api/users', {
      data: {
        username: 'testuser',
        name: 'Test User',
        password: 'ValidPassword123!'
      }
    })

    await page.goto('/')
  })

  test.afterAll(async ({ request }) => {
    await request.post('http://localhost:3001/api/testing/deleteTestUploads')
  })

  test('should login successfully to Dashboard with valid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('ValidPassword123!')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByRole('heading', { name: 'Upload File' })).toBeVisible()
    await expect(page.getByText(/Hello, testuser/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
  })

  test.describe('When logged in and entered Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByLabel('Username').fill('testuser')
      await page.getByLabel('Password').fill('ValidPassword123!')
      await page.getByRole('button', { name: 'Login' }).click()
      await expect(page.getByRole('heading', { name: 'Upload File' })).toBeVisible()
    })

    test('should be able to logout', async ({ page }) => {
      await page.getByRole('button', { name: 'Logout' }).click()
      await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible()
    })

    test('should persist session after page reload', async ({ page }) => {
      await page.reload()

      await expect(page.getByRole('heading', { name: 'Upload File' })).toBeVisible()
      await expect(page.getByText(/Hello, testuser/)).toBeVisible()
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

    test('should reject non-Excel or non-PNG files', async ({ page }) => {
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

      const listItem = page.locator('li', { has: page.getByText('test-image.png') })
      await expect(listItem.getByRole('button', { name: 'generate pdf' })).not.toBeVisible()
      await expect(listItem.getByRole('button', { name: 'delete' })).toBeVisible()
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
  })

  test.describe('When logged in and entered Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByLabel('Username').fill('testuser')
      await page.getByLabel('Password').fill('ValidPassword123!')
      await page.getByRole('button', { name: 'Login' }).click()
      await expect(page.getByRole('heading', { name: 'Upload File' })).toBeVisible()

      await page.getByRole('tab', { name: 'Settings' }).click()
    })

    test('should update user name', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Name', exact: true }).clear()
      await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Updated Test User')
      await page.getByRole('button', { name: 'Update Profile' }).click()

      await expect(page.getByRole('alert')).toContainText('Profile updated successfully')
    })

    test('should change password', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Current Password' }).fill('ValidPassword123!')
      await page.getByRole('textbox', { name: 'New Password', exact: true }).fill('NewValidPass456!')
      await page.getByRole('textbox', { name: 'Confirm New Password' }).fill('NewValidPass456!')
      await page.getByRole('button', { name: 'Change Password' }).click()

      await expect(page.getByRole('alert')).toContainText('Password changed successfully')
    })

    test('should show error when passwords do not match', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Current Password' }).fill('ValidPassword123!')
      await page.getByRole('textbox', { name: 'New Password', exact: true }).fill('NewValidPass456!')
      await page.getByRole('textbox', { name: 'Confirm New Password' }).fill('DifferentPass789!')
      await page.getByRole('button', { name: 'Change Password' }).click()

      await expect(page.getByRole('alert')).toContainText('New passwords do not match')
    })

    test('should show error when current password is incorrect', async ({ page }) => {
      await page.getByRole('textbox', { name: 'Current Password' }).fill('WrongPassword123!')
      await page.getByRole('textbox', { name: 'New Password', exact: true }).fill('NewValidPass456!')
      await page.getByRole('textbox', { name: 'Confirm New Password' }).fill('NewValidPass456!')
      await page.getByRole('button', { name: 'Change Password' }).click()

      await expect(page.getByRole('alert')).toContainText('Current password is incorrect')
    })
  })
})