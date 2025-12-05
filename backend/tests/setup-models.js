import { Sequelize } from 'sequelize'
import { initModels } from '../models/index.js'
import { afterAll } from 'vitest'

// Get the connection URI from environment (set by global-setup)
const connectionUri = process.env.TEST_DATABASE_URL

if (!connectionUri) {
  throw new Error('TEST_DATABASE_URL not set. Global setup may have failed.')
}

const sequelize = new Sequelize(connectionUri, {
  dialect: 'postgres',
  logging: false,
})

// Initialize models for the test file
initModels(sequelize)
await sequelize.sync({ force: true })
console.log('Database connected and models synchronized for tests.')

afterAll(async () => {
  await sequelize.close()
  console.log('Database connection closed after tests.')
})