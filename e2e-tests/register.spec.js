import { test, expect } from '@playwright/test'
import { navigateToRegisterPage, resetDatabase, fillRegistrationForm } from './helpers.js'

test.describe('Registration Flow', () => {
  test('should display registration form when clicking register link', async ({ page }) => {
    await page.goto('http://localhost:5173')

    await expect(page.getByRole('heading', { name: /PDF Generator Login/i })).toBeVisible()

    const registerLink = page.getByText(/register here/i)
    await expect(registerLink).toBeVisible()
    await registerLink.click()

    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').last()).toBeVisible()
  })

  test('should navigate back to login from registration', async ({ page }) => {
    await navigateToRegisterPage(page)
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible()

    await page.getByText(/login here/i).click()
    await expect(page.getByRole('heading', { name: /PDF Generator Login/i })).toBeVisible()
  })

  test('should register new user and login successfully', async ({ page, request }) => {
    await resetDatabase(request)

    await navigateToRegisterPage(page)

    await fillRegistrationForm(page, {
      username: 'testuser',
      name: 'Test User',
      password: 'ValidPassword123!'
    })

    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/Hello, testuser/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible()
  })
})
