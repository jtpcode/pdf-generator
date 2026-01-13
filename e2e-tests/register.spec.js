import { test, expect } from '@playwright/test'
import { navigateToRegisterPage, resetDatabase, fillRegistrationForm } from './helpers.js'

test.describe('Registration Flow', () => {
  test('should display registration form when clicking register link', async ({ page }) => {
    await page.goto('http://localhost:5173')

    await expect(page.getByRole('heading', { name: /PDF Generator Login/i })).toBeVisible()

    const registerLink = page.getByRole('button', { name: /register here/i })
    await expect(registerLink).toBeVisible()
    await registerLink.click()

    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
    await expect(page.getByLabel(/confirm password/i)).toBeVisible()
  })

  test('should navigate back to login from registration', async ({ page }) => {
    await navigateToRegisterPage(page)
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible()

    await page.getByRole('button', { name: /login here/i }).click()
    await expect(page.getByRole('heading', { name: /PDF Generator Login/i })).toBeVisible()
  })

  test('should show error when passwords do not match', async ({ page }) => {
    await navigateToRegisterPage(page)

    await fillRegistrationForm(page, {
      username: 'newuser123',
      name: 'New User',
      password: 'validpassword123',
      confirmPassword: 'differentpassword'
    })

    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })

  test('should show error when password is too short', async ({ page }) => {
    await navigateToRegisterPage(page)

    await fillRegistrationForm(page, {
      username: 'newuser123',
      name: 'New User',
      password: 'short'
    })

    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/password must be between 12 and 128 characters long/i)).toBeVisible()
  })

  test('should register new user and login successfully', async ({ page, request }) => {
    await resetDatabase(request)

    await navigateToRegisterPage(page)

    const username = `testuser_${Date.now()}`
    await fillRegistrationForm(page, {
      username,
      name: 'Test User',
      password: 'validpassword123'
    })

    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/Logged in as:/i)).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /logout/i })).toBeVisible()
  })

  test('should show error when username already exists', async ({ page, request }) => {
    await resetDatabase(request)

    await request.post('http://localhost:3001/api/users', {
      data: {
        username: 'existinguser',
        name: 'Existing User',
        password: 'validpassword123'
      }
    })

    await navigateToRegisterPage(page)

    await fillRegistrationForm(page, {
      username: 'existinguser',
      name: 'Another User',
      password: 'validpassword123'
    })

    await page.getByRole('button', { name: /register/i }).click()

    await expect(page.getByText(/username must be unique/i)).toBeVisible({ timeout: 5000 })
  })
})
