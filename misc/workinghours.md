Working hours:

| date | hours | tasks  |
| :----: | :-----: | :----- |
| 5.11.2025 | 2 | project initialization, lint config |
|        | 3 | backend initialization, middleware, pipeline workflow |
| 6.11   | 1 | eslint configuration |
| 11.11  | 2 | Postgres with docker  |
| 12.11  | 3 | User -model with controller. Added migrations |
|        | 3 | Backend: Vitest + Supertest initialization. Setup test-database. Test user creation. Update CI workflow. E2E: Playwright initialization. |
| 13.11  | 2 | More User -tests. Study error handling middleware.  |
|        | 2 | Login controller, sessions migration. |
| 26.11  | 3 | Add tests for user login. Disable parallelism in tests to avoid database conflicts. |
| 27.11  | 4 | Unit tests for user. Study unit- and integration testing with in-memory PG-database. |
| 4.12   | 2 | Use @testcontainers for backend testing. Change Sequalize-model initialization accordingly. Update CI-actions. |
|        | 3 | Login page, initial front page with logout. Study and use MaterialUI. |
| 5.12   | 6 | Revert back to basic Docker Postgres for testing: compatible for regular and e2e-Playwright tests. |
| 8.12   | 3 | Adjust backend-, e2e-tests. Streamline CI-pipeline. |
| 10.12  | 2 | Add frontend unit tests for: Login, Welcome -components. Configure Vitest, CI. |
|        | 1 | Add coverage for front and backend via Codecov. |
| 11.12  | 4 | Add file upload functionality to backend and frontend. |
| 12.12  | 2 | Continue: add file upload functionality to backend and frontend. Study error handling. |
|        | 2 | Add logout with session deletion. Uploads are now in /uploads/user.id/file.xlsx |
| 16.12  | 3 | Add backend tests for file upload and logout. Refactor api tests. |
|        | 2 | Debug playwright server removal. |
| 17.12  | 2 | Add e2e tests for file upload, refactor e2e tests. Add test-uploads dir for test files and deletion of them afterwards. |
|        | 3 | Add frontend file upload tests. Debug frontend file upload testing. |
| 5.1.2026 | 4 | Study Copilot: MCP, tools, copilot-instructions.md, agent mode |
| 6.1 | 5 | Create copilot-instructions.md and update README.md. Update name/username/password validation in backend, update tests accordingly. Add stricter rateLimiter-middleware for repeated Login/Create user -requests and looser limiter for other endpoints. |
| 8.1 | 4 | Update login.js, files.js, testing.js, change User-model's username length and copilot instructions. |
|     | 4 | Review frontend code and tests, also services. Improve error handling. Add tests for frontend login loading state. |
| 9.1 | 3 | Refactor API tests: helper functions into helpers.js, enhance user validation tests, and improve file upload error handling. |
|     | 3 | Implement registration flow with validation and error handling; add Register component and update Login component for navigation. Add unit and e2e tests. |
| 13.1 | 6 | Study MUI, refactor e2e tests, add 3 file upload limit + tests. Study Render webservice + Postgres integration.  |
| 15.1 | 5 | Study Render webservice with postgres and persistent disk. Complete CICD pipeline, publish app in Render. |
| 20.1 | 2 | Study Pdf generation: PDFkit vs. Puppeteer |
| 22.1 | 5 | Study Pdf generation: choose PDFkit for implementation. |
| 23.1 | 4 | Implement PDFkit to generate preliminary PDFs. |
| Total   | 105 |
