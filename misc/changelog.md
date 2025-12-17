Changelog:

| date | tasks |
| :----: | :----- |
| 5.11   | project initialization, middleware, pipeline workflow |
| 6.11   | eslint configuration |
| 11.11  | Initialize Postgres with docker |
| 12.11  | User -model with controller. Added migrations. Vitest + Supertest initialization. Test user creation. |
| 13.11  | More User -tests, Login controller, sessions migration. |
| 26.11  | Add tests for user login. Disable parallelism in tests to avoid database conflicts. |
| 4.12   | Use @testcontainers for backend testing. Login page, initial front page with logout. |
| 8.12   | Revert back to basic Docker Postgres for testing: compatible for regular and e2e-Playwright tests. |
| 10.12  | Add frontend unit tests for: Login, Welcome -components. Configure Vitest, CI. Add coverage for front and backend via Codecov. |
| 12.12  | Add file upload functionality to backend and frontend. Add logout with session deletion. Uploads are now in /uploads/user.id/file.xlsx |
| 16.12  | Add backend tests for file upload and logout. |
| 17.12  | Add e2e tests for file upload, refactor e2e tests. Add test-uploads dir for test files and deletion of them afterwards. Add frontend file upload tests. |

