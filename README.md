# pdf-generator

[![CI](https://github.com/jtpcode/pdf-generator/actions/workflows/pipeline.yml/badge.svg)](https://github.com/jtpcode/pdf-generator/actions/workflows/pipeline.yml)
[![codecov](https://codecov.io/gh/jtpcode/pdf-generator/graph/badge.svg?token=UWIU8TU9D3)](https://codecov.io/gh/jtpcode/pdf-generator)

## Live demo

The current test version of the app is running at:
https://pdf-generator-3ucg.onrender.com/

## Working hours

[Working hours](misc/workinghours.md)

## Project name and description

**pdf-generator** is aimed at demonstrating technical datasheet generation in PDF format. There are two options on how to generate the document: PDFKit and HTML/CSS + Puppeteer. Both produce almost identical documents and the difference is only in the technical implementation.

The goal is to provide 'proof-of-concept' on how datasheet PDF generation can be achieved. The application accepts Excel and .png files, and their naming/content has to be in a specific form to comply with the code. Example files can be asked directly from the developer. **The application is by no means a ready-made product for general use**.

## How to use the application
- Create credentials for login
- Dashboard
  - Upload suitable .xlsx and .png files for the datasheet generation (max. three files)
  - Example files can be asked directly from the developer
	- Choose between PDFKit or HTML + Puppeteer
	- Click the 'eye' icon to quickly check how the PDF looks like
	- Click the 'PDF' icon to generate the PDF
  - To delete a file, click the trashcan icon
- Settings
  - Update user name
  - Update password

## Setting up local development environment

### Prerequisites
- Node.js 24+
- npm 11+
- Docker & Docker Compose (for local PostgreSQL DB)
  - You can use PostgreSQL database in any other way also, but this instruction is for Docker version only

### Installation
1. Clone the repository
2. Install root, frontend, and backend dependencies:
	```sh
	npm ci
	npm --prefix frontend ci
	npm --prefix backend ci
	```
3. Configure environment variables:
	- For PostgreSQL (Docker containerized), include `.env` in the project root:
	  - POSTGRES_PASSWORD=[YOUR_PASSWORD]
	- For backend, include `.env` in /backend:
		- JWT_SECRET=[YOUR_JWT_SECRET]
	  - DATABASE_URL=postgres://[POSTGRES_USER]:[YOUR_PASSWORD]@localhost:5432/[DATABASE_NAME]
		  - default user is 'postgres': [POSTGRES_USER] = postgres
		  - default database is 'postgres': [DATABASE_NAME] = postgres
	  - TEST_DATABASE_URL=postgres://[POSTGRES_USER]:[YOUR_PASSWORD]@localhost:5432/[TEST_DATABASE_NAME]
		  - NOTE: You must first create a separate test database if you're going to run tests locally
		  - First start PostgreSQL database as instructed in step 4.
		  - Once the database is up, run the following in the root directory.
		  - `docker exec -it [CONTAINER_ID] psql -U postgres -c "CREATE DATABASE [TEST_DATABASE_NAME];"`
4. Start PostgreSQL with Docker Compose in the root directory:
	```sh
	docker compose -f docker-compose.dev.yml up
	```
5. Start development servers:
	```sh
	npm --prefix backend run dev
	npm --prefix frontend run dev
	```
6. App is located at: `http://localhost:5173/`

### Local testing:
- Use ready-made test scripts in the package.json files, since they will use `NODE_ENV=test` which automatically enables `TEST_DATABASE_URL` once it's been created
- Make sure Postgres database is running, and both frontend and backend dev servers are offline
- In project root:
	```sh
	npm run test:frontend
	```
	```sh
	npm run test:backend
	```
- The same thing in /frontend and /backend:
	```sh
	npm run test
	```
- E2E testing with Playwright in the project root:
	```sh
	npm run test:play
	```

## Technology stack

- **Frontend:** React 19, Vite, MUI, Emotion, ESLint, Vitest, React Testing Library
- **Backend:** Node.js 24, Express 5, Sequelize (PostgreSQL), JWT, Helmet, Multer, bcrypt
- **Database:** PostgreSQL (Dockerized for development)
- **Testing:** Vitest, Playwright, Supertest
- **CI/CD:** GitHub Actions, Codecov, Continuous Deployment to Render platform (https://render.com/)
- **Other:** Docker Compose (for local development)

## Project architecture

- **Monorepo**: Contains both frontend and backend in a single repository
- **Frontend**: SPA built with React, communicates with backend via REST API
- **Backend**: RESTful API with authentication, file handling, and user/session management
- **Database**: PostgreSQL, managed via Sequelize migrations
- **CI/CD**: Automated pipeline for linting, testing and deploying

## Key features

- User authentication (JWT, bcrypt)
- Secure file upload (Multer, Express)
- RESTful API (Express, Sequelize)
- React SPA with MUI design
- Tanstack/react-query for state management
- Unit testing: Vitest
- Integration testing: Vitest + Supertest
- End-to-end testing: Playwright
- Security best practices (Helmet, OWASP guidelines)
- CI/CD with GitHub Actions and Codecov

## Coding standards

- JavaScript (ES2022+), Node.js ESM modules
- React functional components with hooks
- Linting enforced via ESLint

## Testing

- **Backend:** Vitest for unit/integration, Supertest for API
- **Frontend:** Vitest, React Testing Library
- **E2E:** Playwright
- Coverage reports generated and uploaded to Codecov

## LLM usage
- The LLM model used in this project was mostly Claude Sonnet 4.5
- Copilot instruction files have been used to keep the LLM work as consistent as possible
- Files that are mostly LLM generated are marked with "This file has been mostly generated by AI"
  - these mainly include the pdf layout generating algorithms
- Most frontend style/layout settings with Material UI are LLM generated with precise prompting
- Tests related to PDF generation are mostly created with LLM assistance with developer review
- Most of the trivial and repetative tests are LLM generated with developer review

## License

MIT License. See [LICENSE](LICENSE) for details.
