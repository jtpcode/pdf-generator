import { beforeAll, afterAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { Sequelize } from 'sequelize'
import { initModels } from '../models/index.js'

let container
let sequelize

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('testdb')
    .withUsername('testuser')
    .withPassword('testpass')
    .start()

  sequelize = new Sequelize(container.getConnectionUri(), {
    logging: false,
  })

  // Initialize models with the test sequelize instance
  initModels(sequelize)
  await sequelize.sync({ force: true })

  console.log('Test database container started')
}, 60000)

afterAll(async () => {
  await sequelize?.close()
  await container?.stop()
})

export { sequelize }