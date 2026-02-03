# pdf-generator

[![CI](https://github.com/jtpcode/pdf-generator/actions/workflows/pipeline.yml/badge.svg)](https://github.com/jtpcode/pdf-generator/actions/workflows/pipeline.yml)
[![codecov](https://codecov.io/gh/jtpcode/pdf-generator/graph/badge.svg?token=UWIU8TU9D3)](https://codecov.io/gh/jtpcode/pdf-generator)

## Live demo

The current test version of the app is running at:
https://pdf-generator-3ucg.onrender.com/

## Project name and description

**pdf-generator** is aimed for demonstrating technical datasheet creation in PDF format. The goal is to provide 'proof-of-concept' on how datasheet PDF generation can be achieved. The application accepts Excel and .png files, and their naming/content has to be in a specific form to comply with the code. Example files can be asked directly from the developer. The application is by no means a ready made product for general use.

## How to use
- Create credentials for login
- Upload suitable .xlsx and .png files for the datasheet generation (max. three files)
  - Example files can be asked directly from the developer
- Click the 'Pdf' icon to generate the PDF
- To delete a file, click the trashcan icon

## Technology stack

- **Frontend:** React 19, Vite, MUI, Emotion, ESLint, Vitest, React Testing Library
- **Backend:** Node.js 24, Express 5, Sequelize (PostgreSQL), JWT, Helmet, Multer, bcrypt
- **Database:** PostgreSQL (Dockerized for development)
- **Testing:** Vitest, Playwright, Supertest
- **CI/CD:** GitHub Actions, Codecov
- **Other:** Docker Compose (for local development)

## Project architecture

- **Monorepo**: Contains both frontend and backend in a single repository
- **Frontend**: SPA built with React, communicates with backend via REST API
- **Backend**: RESTful API with authentication, file handling, and user/session management
- **Database**: PostgreSQL, managed via Sequelize migrations
- **CI/CD**: Automated pipeline for linting, testing and deploying

## Getting started

### Prerequisites
- Node.js 24+
- npm 11+
- Docker & Docker Compose (for local PostgeSQL DB)

### Installation
1. Clone the repository
2. Install root, frontend, and backend dependencies:
	```sh
	npm ci
	npm --prefix frontend ci
	npm --prefix backend ci
	```
3. Configure environment variables:
	- For PostgreSQL, include `.env` in project root:
	  - POSTGRES_PASSWORD=[YOUR_PASSWORD]
	- For backend, include `.env` in /backend:
	  - DATABASE_URL=[YOUR_DATABASE_URL]
	  - TEST_DATABASE_URL=[TEST_DATABASE_URL]
	  - JWT_SECRET=[YOUR_JWT_SECRET]
	- NOTE:
	  - You must create a test database if you're going to use tests.
	  - DATABASE_URL: postgres://[POSTGRES_USER]:[YOUR_PASSWORD]@localhost:5432/[DATABASE_NAME]
4. Start PostgreSQL with Docker Compose:
	```sh
	docker compose -f docker-compose.dev.yml up
	```
5. Start development servers:
	```sh
	npm --prefix backend run dev
	npm --prefix frontend run dev
	```

## Key features

- User authentication (JWT, bcrypt)
- Secure file upload (Multer, Express)
- RESTful API (Express, Sequelize)
- React SPA with MUI design
- Unit testing: Vitest
- Integration testing: Vitest + Supertest
- End-to-end testing: Playwright
- Security best practices (Helmet, OWASP guidelines)
- CI/CD with GitHub Actions and Codecov

## Development workflow

- Automated Playwright and Vitest tests
- Coverage uploaded to Codecov
- Automated deployment to Render

## Coding standards

- JavaScript (ES2022+), Node.js ESM modules
- React functional components with hooks
- Linting enforced via ESLint

## Testing

- **Backend:** Vitest for unit/integration, Supertest for API
- **Frontend:** Vitest, React Testing Library
- **E2E:** Playwright
- Coverage reports generated and uploaded to Codecov

## License

MIT License. See [LICENSE](LICENSE) for details.
