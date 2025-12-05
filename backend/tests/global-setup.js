// backend/tests/global-setup.js
import { PostgreSqlContainer } from '@testcontainers/postgresql'

export default async function setup() {
  console.log('Starting PostgreSQL test container...')

  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('testdb')
    .withUsername('testuser')
    .withPassword('testpass')
    .start()

  const connectionUri = container.getConnectionUri()

  // Set as environment variable so tests can use it
  process.env.TEST_DATABASE_URL = connectionUri

  console.log('Test database container started')

  // Return teardown function
  return async () => {
    console.log('Stopping PostgreSQL test container...')
    await container?.stop()
  }
}