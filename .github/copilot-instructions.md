# PDF Generator - Copilot Instructions

## Repository Overview

**Project Type**: Full-stack web application for PDF generation with Excel file upload
**Languages/Frameworks**: Node.js 24, Express.js, React ^19.2, Vite, Sequelize ORM
**Database**: PostgreSQL 18
**Testing**: Vitest (backend & frontend unit tests), Playwright (E2E tests)
**Architecture**: Monorepo with separate frontend and backend packages

### Project Structure
```
/
├── backend/           # Express.js REST API server
│   ├── controllers/   # API route handlers (users, login, logout, files)
│   ├── models/        # Sequelize models (User, Session, File)
│   ├── migrations/    # Database migrations (Umzug)
│   ├── utils/         # Config, DB connection, middleware
│   └── tests/         # Backend integration tests
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/  # Login.jsx, Welcome.jsx
│       ├── services/    # API service layers
│       └── tests/unit/  # Frontend unit tests
├── e2e-tests/         # Playwright end-to-end tests
└── package.json       # Root package with workspace scripts
```

## Build & Test Commands - CRITICAL SETUP

### Prerequisites - ALWAYS FOLLOW THIS ORDER

1. **Node.js 24** is required (the CI uses Node 24)
2. **PostgreSQL 18** must be running for backend tests and Playwright tests
3. **ALWAYS install dependencies in this exact order:**
   ```bash
   npm ci                          # Root dependencies (Playwright)
   npm --prefix frontend ci        # Frontend dependencies
   npm --prefix backend ci         # Backend dependencies
   ```
   Using `npm install` instead of `npm ci` may cause inconsistencies. ALWAYS use `npm ci`.

### Environment Variables for Testing

Backend tests and Playwright tests **REQUIRE** these environment variables:
```bash
JWT_SECRET=test-secret-key-for-ci
TEST_DATABASE_URL=postgres://postgres:dummypassword1234@localhost:5432/test_db
```

### PostgreSQL Setup for Tests

**CRITICAL**: Backend tests will FAIL without a running PostgreSQL instance. To set up:
```bash
# Start PostgreSQL service (if not running)
sudo service postgresql start

# Create test database (one time only)
sudo -u postgres psql -c "CREATE DATABASE test_db;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'dummypassword1234';"
```

Database migrations run automatically when the backend starts via `connectToDatabase()` in `utils/db.js`.

### Linting

```bash
npm run lint
```
- Runs ESLint on both frontend and backend
- Uses `@stylistic/eslint-plugin` for code style (2 spaces, single quotes, no semicolons, unix line endings)
- Backend includes `eslint-plugin-security` for security checks
- **Expected warning**: `baseline-browser-mapping` data outdated (ignorable)
- **MUST pass** before committing

### Testing

**Frontend Tests** (no database required):
```bash
npm run test:frontend
```
- Uses Vitest + jsdom + React Testing Library
- Runs in ~5 seconds
- **Expected warnings**: React `act()` warnings in stderr (tests still pass, ignorable)
- Coverage included automatically

**Backend Tests** (requires PostgreSQL):
```bash
npm run test:backend
```
- Uses Vitest with Sequelize + Supertest
- **MUST** have PostgreSQL running and environment variables set
- Database is reset before each test via `/api/testing/resetDb` endpoint
- Runs in ~2 seconds
- Tests run sequentially (`singleThread: true` in vitest.config.js) to avoid DB conflicts
- Coverage included automatically

**Playwright E2E Tests**:
```bash
# First time only - install browsers (takes ~60 seconds)
npx playwright install --with-deps

# Run E2E tests
npx playwright test
```
- **REQUIRES**: Both PostgreSQL running AND environment variables set
- Starts backend server (`npm run dev:test`) and frontend dev server automatically
- Backend runs on http://localhost:3001, frontend on http://localhost:5173
- Tests take ~120 seconds to complete (includes server startup time)
- **ONLY run on PR or with `#play` in commit message** (see CI section)

### Building

**Frontend Build**:
```bash
cd frontend && npm run build
```
- Creates production bundle in `frontend/dist/`
- Takes ~3 seconds
- **Note**: Backend has no build step (runs directly with Node.js)

### Running Locally

**Backend Development Server**:
```bash
cd backend && npm run dev
```
- Runs on port 3001 with `--watch` flag (auto-reload on changes)
- Requires PostgreSQL running

**Frontend Development Server**:
```bash
cd frontend && npm run dev
```
- Runs on port 5173
- Proxies `/api` requests to backend at `localhost:3001` (configured in `vite.config.js`)

## CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/pipeline.yml`)

**Triggers**: Push to `main` or pull requests to `main`

**Pipeline Steps** (in order):
1. Install Node.js 24
2. Start PostgreSQL 18 service (Docker container)
3. `npm ci` (root)
4. `npm --prefix frontend ci`
5. `npm --prefix backend ci`
6. `npm run lint` (frontend + backend)
7. `npm run test:backend` (with DB connection)
8. `npm run test:frontend`
9. Upload coverage to Codecov
10. **Conditionally** install Playwright browsers with `npx playwright install --with-deps` (if PR or commit contains `#play`)
11. **Conditionally** run `npx playwright test` (if PR or commit contains `#play`)
12. Upload Playwright report as artifact

### Special Commit Message Flags

- `#skip` - Skip deployment (only affects main branch)
- `#noci` - Skip entire CI pipeline
- `#play` - Force Playwright tests to run (otherwise only on PRs)

**Default behavior**: Playwright tests run on ALL pull requests but NOT on direct pushes to main (unless `#play` is in commit message).

### Common CI Failures & Solutions

1. **Backend tests fail with database connection error**:
   - PostgreSQL service not started in CI (check services section in workflow)
   - Missing `TEST_DATABASE_URL` or `JWT_SECRET` environment variables

2. **Playwright tests timeout**:
   - Backend or frontend server failed to start within 120 seconds
   - Check `webServer` configuration in `playwright.config.js`

3. **Lint failures**:
   - Code doesn't follow style guide (2 spaces, single quotes, no semicolons)
   - Run `npm run lint` locally before pushing

## Code Style & Conventions

### ESLint Rules (enforced on both frontend and backend)
- **Indentation**: 2 spaces (`'stylistic/indent': ['error', 2]`)
- **Quotes**: Single quotes (`'stylistic/quotes': ['error', 'single']`)
- **Semicolons**: None (`'stylistic/semi': ['error', 'never']`)
- **Line endings**: Unix (LF) (`'stylistic/linebreak-style': ['error', 'unix']`)
- **Equality**: Strict (`eqeqeq: 'error'`)
- **Spacing**: Required in objects and arrows

### Backend-Specific
- Uses ES modules (`"type": "module"` in package.json)
- Security plugin enabled (`eslint-plugin-security`)
- Database models use Sequelize with snake_case fields (`underscored: true`)
- JWT-based authentication stored in session table
- File uploads go to `uploads/` (production) or `test-uploads/` (test mode)

### Frontend-Specific
- React ^19.2 with functional components and hooks
- Material-UI (@mui/material) for UI components
- API calls via service layers (`services/authService.js`, `services/fileService.js`)
- No TypeScript (plain JavaScript with JSX)

## File Locations Reference

### Configuration Files
- **Root linting/testing**: `package.json` (workspace scripts)
- **Backend config**: `backend/package.json`, `backend/eslint.config.js`, `backend/vitest.config.js`
- **Frontend config**: `frontend/package.json`, `frontend/eslint.config.js`, `frontend/vite.config.js`
- **E2E config**: `playwright.config.js`
- **Database config**: `backend/utils/config.js` (reads from .env or environment variables)
- **Gitignore**: `.gitignore` (excludes node_modules, coverage, dist, uploads, test-uploads, .env)

### Key Source Files
- **Backend entry**: `backend/index.js` (starts Express server)
- **Backend app**: `backend/app.js` (middleware & routes)
- **Models**: `backend/models/index.js` (User, Session, File associations)
- **Controllers**: `backend/controllers/{users,login,logout,files,testing}.js`
- **Middleware**: `backend/utils/middleware.js` (helmet, auth, error handling)
- **Frontend entry**: `frontend/src/main.jsx`
- **Frontend app**: `frontend/src/App.jsx`
- **Components**: `frontend/src/components/{Login,Welcome}.jsx`

### Test Files
- **Backend tests**: `backend/tests/integration/api.test.js`
- **Frontend tests**: `frontend/src/tests/unit/{Login,Welcome}.test.jsx`
- **E2E tests**: `e2e-tests/login.spec.js`

## Important Notes

1. **NEVER commit to main directly** - All changes go through pull requests
2. **Test parallelization is DISABLED** in backend tests (`singleThread: true`) to prevent database race conditions
3. **Migrations run automatically** when backend starts - no manual migration command needed
4. **File uploads** are stored in `uploads/` directory (gitignored) - tests use `test-uploads/`
5. **Testing endpoint** `/api/testing/resetDb` only available in test mode (`NODE_ENV=test`)
6. **Coverage is tracked** via Codecov (badge in README)
7. **Dependencies use `npm ci`** for reproducible installs - ALWAYS use `npm ci`, not `npm install`

## Validation Checklist Before PR

Run these commands in order to replicate CI locally:
```bash
# Install dependencies
npm ci
npm --prefix frontend ci
npm --prefix backend ci

# Lint
npm run lint

# Test backend (requires PostgreSQL)
JWT_SECRET=test-secret-key-for-ci TEST_DATABASE_URL=postgres://postgres:dummypassword1234@localhost:5432/test_db npm run test:backend

# Test frontend
npm run test:frontend

# Optional: E2E tests (if making frontend/integration changes)
npx playwright install --with-deps
JWT_SECRET=test-secret-key-for-ci TEST_DATABASE_URL=postgres://postgres:dummypassword1234@localhost:5432/test_db npx playwright test
```

All commands must pass without errors before creating a PR.

## Trust These Instructions

These instructions have been validated by running all commands successfully. Only search for additional information if:
- A command documented here fails unexpectedly
- You need details about code not covered in this file
- The repository structure has changed significantly
