// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Login functionality', () => {
  test.beforeEach(async ({ page, request }) => {
    // Reset database
    await request.post('http://localhost:3001/api/testing/reset')
    
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
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();
    await expect(page.getByText(/Logged in as: testuser/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible();
  });

  test('should persist session after page reload', async ({ page }) => {
    // Login
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Password').fill('testpassword');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();

    // Reload page
    await page.reload();

    // Should still be logged in
    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();
    await expect(page.getByText(/Logged in as: testuser/)).toBeVisible();
  });

  test('should require both username and password', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: 'Login' }).click();

    // Should still be on login page (HTML5 validation prevents submission)
    await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible();
  });

  test.describe('when logged in', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test in this block
      await page.getByLabel('Username').fill('testuser');
      await page.getByLabel('Password').fill('testpassword');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();
    });

    test('should display user information', async ({ page }) => {
      await expect(page.getByText(/Logged in as: testuser/)).toBeVisible();
    });

    test('should be able to logout', async ({ page }) => {
      await page.getByRole('button', { name: 'Logout' }).click();
      await expect(page.getByRole('heading', { name: 'PDF Generator Login' })).toBeVisible();
    });
  });
});