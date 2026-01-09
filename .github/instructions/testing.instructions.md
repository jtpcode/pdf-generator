---
applyTo: '**/*.test.js, **/*.test.jsx, **/*.spec.js'
description: 'Testing best practices for backend (Vitest + Supertest), frontend (Vitest + React Testing Library), and E2E (Playwright) in the PDF Generator project.'
---

# Testing Instructions - PDF Generator Project

## Critical Prerequisites

**PostgreSQL MUST be running for backend and E2E tests**:
Docker is used to run PostgreSQL in development and CI. To start PostgreSQL locally while Docker is running, in project root run:
```bash
docker compose -f docker-compose.dev.yml up -d
```

**Why real database?** Always use the same DB product as production. Configure it for faster execution, but never fake it. Memory-only DBs (like SQLite) are slower in multi-process mode and create noise from unsupported features.

**Required environment variables**:
```bash
export NODE_ENV=test
export JWT_SECRET=test-secret-key-for-ci
export TEST_DATABASE_URL=postgres://postgres:dummypassword1234@localhost:5432/test_db
```

**Always use `npm ci`** (never `npm install`) for reproducible builds.

## Backend Testing (Vitest + Supertest)

**Location**: `backend/tests/integration/*.test.js`

**Standard template**:
```javascript
import { describe, test, expect, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import bcrypt from 'bcrypt'
import app from '../../app.js'
import { User, Session } from '../../models/index.js'
import { sequelize } from '../../utils/db.js'

const api = supertest(app)

beforeEach(async () => {
  await api.post('/api/testing/resetDb')  // CRITICAL: Reset DB before each test
})

afterAll(async () => {
  await api.post('/api/testing/deleteTestUploads')
  await sequelize.close()  // CRITICAL: Close connection
})
```

**Helper functions** (in a separate file, reduce duplication):
```javascript
const createUser = async (username = 'testuser', name = 'Test User') => {
  const passwordHash = await bcrypt.hash('testpassword123', 1)  // 1 round = fast tests
  return await User.create({ username, name, passwordHash })
}

const loginUser = async (username = 'testuser') => {
  const response = await api.post('/api/login')
    .send({ username, password: 'testpassword123' })
    .expect(200)
  return response.body.token
}

const createAndLoginUser = async (username = 'testuser', name = 'Test User') => {
  await createUser(username, name)
  return await loginUser(username)
}
```

**Assertion patterns**:
```javascript
// HTTP + body content
const response = await api.post('/api/users')
  .send({ username: 'testuser', name: 'Test User', password: 'testpass123' })
  .expect(201)
expect(response.body.username).toBe('testuser')
expect(response.body.passwordHash).toBeUndefined()  // Security: never expose

// Database state verification
const user = await User.findOne({ where: { username: 'testuser' } })
expect(user).not.toBeNull()
```

**Security testing checklist**:
- [ ] Endpoints reject requests without token (401)
- [ ] Invalid tokens rejected
- [ ] Passwords/hashes never returned in responses
- [ ] Input validation rejects invalid data
- [ ] Test boundary conditions (empty strings, max lengths, special characters)
- [ ] Test for undesired side effects (e.g., deletion doesn't affect other records)

## Frontend Testing (Vitest + React Testing Library)

**Location**: `frontend/src/tests/unit/ComponentName.test.jsx`

**Standard template**:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ComponentName from '../../components/ComponentName'
import serviceName from '../../services/serviceName'

vi.mock('../../services/serviceName')  // ALWAYS mock services

describe('ComponentName', () => {
  const mockProp = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()  // CRITICAL: Reset mocks
  })
  
  it('renders correctly', () => {
    render(<ComponentName prop={mockProp} />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

**Helper functions**
In a separate file if they are needed, reduce duplication.

**User interaction pattern**:
```javascript
it('handles form submission', async () => {
  const user = userEvent.setup()  // ALWAYS setup userEvent
  authService.login.mockResolvedValue({ username: 'testuser', token: 'test-token' })
  
  render(<Login onLogin={mockOnLogin} />)
  
  await user.type(screen.getByLabelText(/username/i), 'testuser')
  await user.type(screen.getByLabelText(/password/i), 'testpass123')
  await user.click(screen.getByRole('button', { name: /login/i }))
  
  await waitFor(() => {  // CRITICAL for async state updates
    expect(authService.login).toHaveBeenCalledWith('testuser', 'testpass123')
    expect(mockOnLogin).toHaveBeenCalledWith({ username: 'testuser', token: 'test-token' })
  })
})
```

**Query methods**:
- `getBy*` - Element must exist (throws if not found)
- `queryBy*` - For absence checks (returns null)
- `findBy*` - For async elements (returns Promise)

**Always use `waitFor()`** for assertions after async operations.

**Edge case testing patterns**:
```javascript
// Null/undefined props
it('handles undefined user gracefully', () => {
  render(<Welcome user={undefined} onLogout={mockOnLogout} />)
  expect(screen.getByText(/Logged in as:/i)).toBeInTheDocument()
})

// Missing properties
it('does not call onLogin if token is missing', async () => {
  authService.login.mockResolvedValue({ username: 'testuser' })  // No token
  // ... trigger login ...
  expect(mockOnLogin).not.toHaveBeenCalled()
})

// Error without message
it('displays generic error when error has no message', async () => {
  authService.login.mockRejectedValue(new Error())  // No message
  // ... trigger login ...
  await waitFor(() => {
    expect(screen.getByText('Login failed')).toBeInTheDocument()
  })
})
```

## E2E Testing (Playwright)

**Location**: `e2e-tests/*.spec.js`

**Standard template**:
```javascript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3001/api/testing/resetDb')
    await request.post('http://localhost:3001/api/users', {
      data: { username: 'testuser', name: 'Test User', password: 'testpassword123' }
    })
    await page.goto('/')
  })
  
  test.afterAll(async ({ request }) => {
    await request.post('http://localhost:3001/api/testing/deleteTestUploads')
  })
  
  test('should perform expected behavior', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser')
    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible()
  })
})
```

**Helper functions**
In a separate file if they are needed, reduce duplication.

**Locator priority** (prefer accessible selectors):
1. `page.getByRole('button', { name: 'Login' })` - Best: Role-based, reflects accessibility
2. `page.getByLabel('Username')` - Good: User-facing labels
3. `page.getByText('Welcome!')` - OK: Visible text
4. `page.getByTestId('login-form')` - Add `data-testid` when needed
5. `page.locator('input[type="file"]')` - Last resort: CSS selectors

**Why avoid CSS/XPath?** DOM structure changes frequently. Selectors like `.buttonIcon.episode-actions-later` break when designers change classes. User-facing attributes (role, label, text) are stable and match how users interact.

**Generate locators**: Use `npx playwright codegen` or VS Code extension to automatically pick resilient locators.

**Use `request` fixture for setup** (faster than UI):
```javascript
await request.post('http://localhost:3001/api/testing/resetDb')
```

## Decision Framework: Which Test Type?

| Type | Use For | Speed | Scope |
|------|---------|-------|-------|
| **Unit** (Frontend) | Component logic, UI interactions | Fast (ms) | Component only, mock services |
| **Integration** (Backend) | API endpoints, DB operations | Medium (sec) | API + real database |
| **E2E** (Playwright) | Critical user flows, full workflows | Slow (min) | Entire stack, no mocks |

**Testing pyramid**: 70% Unit, 20% Integration, 10% E2E

## Common Failures & Solutions

| Error | Cause | Solution |
|-------|-------|----------|----------|
| `ECONNREFUSED` | PostgreSQL not running | `docker compose -f docker-compose.dev.yml up -d` |
| `Database "test_db" does not exist` | DB not created | `sudo -u postgres psql -c "CREATE DATABASE test_db;"` |
| `act(...)` warning (frontend) | Missing `waitFor()` | Wrap async assertions in `waitFor()` |
| `mockResolvedValue undefined` | Service not mocked | Add `vi.mock('../../services/serviceName')` |
| E2E timeout | Server startup failed | Check PostgreSQL running + env vars set |
| Test passes but fails in CI | Different environments | Use Docker Compose for consistent infrastructure |
| Tests interfere with each other | Shared data/state | Each test must add its own data. Add random suffixes to unique fields |
| Flaky tests | Race conditions, timing | Use `waitFor()`, avoid polling, ensure proper async/await |

## Essential Commands

```bash
# Run tests
npm run test:backend
npm run test:frontend
npx playwright test

# Coverage
cd backend && npm run test:coverage
cd frontend && npm run test:coverage

# E2E setup (one time)
npx playwright install --with-deps
```

## Critical Configuration Notes

**Backend `vitest.config.js`** MUST have `singleThread: true` to prevent database race conditions.

**Frontend** must mock all services with `vi.mock()` - no real API calls.

**E2E** `playwright.config.js` has `webServer` that auto-starts backend (3001) and frontend (5173).

## Best Practices Summary

### Test Isolation & Data
1. **Each test must act on its own records** - Add test-specific data in test body, not globally
2. **Reset DB before each test** - Use `/api/testing/resetDb` for clean state
3. **Add randomness to unique fields** - Suffix with `${process.pid}-${Date.now()}` to avoid collisions
4. **Assert via public API** - Check new state through REST endpoints, not direct DB queries

### Code Practices
5. **Use helper functions** - Reduce duplication (createUser, loginUser, uploadFile)
6. **Test security rigorously** - Never return passwords/hashes, verify token hashing, test auth failures
7. **Clear mocks in beforeEach** - `vi.clearAllMocks()` prevents test interference
8. **Close connections in afterAll** - `await sequelize.close()` prevents resource leaks

### Test Design
9. **Test the five outcomes** - Response, State, External Calls, Message Queues, Observability
10. **Test happy path + errors + edge cases** - Cover normal flow, error handling, and boundaries (null, undefined, empty arrays, max values)
11. **Use descriptive test names** - "When [condition], should [expected behavior]"
12. **One concept per test** - Focus on single behavior, easier to debug failures
13. **Write tests during coding** - Not after. Tests are your safety net while developing
14. **Always aim for 100% coverage** - Critical for catching regressions early

### Debugging & Maintenance
15. **Use trace viewer on CI** - Not videos/screenshots. Traces show full timeline with snapshots
16. **Keep Playwright updated** - Test on latest browsers before public release
17. **Test across all browsers** - Chromium, Firefox, WebKit ensure compatibility
