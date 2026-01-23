# pdf-generator

[![CI](https://github.com/jtpcode/pdf-generator/actions/workflows/pipeline.yml/badge.svg)](https://github.com/jtpcode/pdf-generator/actions/workflows/pipeline.yml)
[![codecov](https://codecov.io/gh/jtpcode/pdf-generator/graph/badge.svg?token=UWIU8TU9D3)](https://codecov.io/gh/jtpcode/pdf-generator)

## Live demo

The current test version of the app is running at:
https://pdf-generator-3ucg.onrender.com/

## Project Name and Description

**pdf-generator** (in progress) is a full-stack web application for transforming technical datasheets into PDF format. Functionality currently features login with user authentication, file upload and preliminary PDF creation. The project is designed with modern security, testing, and development best practices.

## Technology Stack

- **Frontend:** React 19, Vite, MUI, Emotion, ESLint, Vitest, React Testing Library
- **Backend:** Node.js 20+, Express 5, Sequelize (PostgreSQL), JWT, Helmet, Multer, bcrypt
- **Database:** PostgreSQL (Dockerized for development)
- **Testing:** Vitest, Playwright, Supertest
- **CI/CD:** GitHub Actions, Codecov
- **Other:** Docker Compose (for local development)

## Project Architecture

- **Monorepo**: Contains both frontend and backend in a single repository
- **Frontend**: SPA built with React, communicates with backend via REST API
- **Backend**: RESTful API with authentication, file handling, and user/session management
- **Database**: PostgreSQL, managed via Sequelize migrations
- **CI/CD**: Automated pipeline for linting, testing, and coverage reporting

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- Docker & Docker Compose (for local PostgeSQL DB)

### Installation
1. Clone the repository
2. Install root, frontend, and backend dependencies:
	```sh
	npm ci
	npm --prefix frontend ci
	npm --prefix backend ci
	```
3. Configure environment variables in `.env` files:
	- PostgreSQL: include `.env` in project root for PostgreSQL password, see docker-compose.dev.yml
	- Backend: include `.env` in /backend, see backend/utils/config.js
4. Start PostgreSQL with Docker Compose:
	```sh
	docker compose -f docker-compose.dev.yml up -d
	```
5. Start development servers:
	```sh
	npm --prefix backend run dev
	npm --prefix frontend run dev
	```

## Key Features

- User authentication (JWT, bcrypt)
- Secure file upload (Multer, Express)
- Role-based access control
- RESTful API (Express, Sequelize)
- React SPA with MUI design
- Unit testing: Vitest
- Integration testing: Vitest + Supertest
- End-to-end testing: Playwright
- Security best practices (Helmet, OWASP guidelines)
- CI/CD with GitHub Actions and Codecov

## Development Workflow

- Pull requests trigger CI pipeline (lint, test, coverage)
- Main branch protected by CI
- Automated Playwright and Vitest tests
- Coverage uploaded to Codecov

## Coding Standards

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
