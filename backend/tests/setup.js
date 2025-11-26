import { beforeAll, afterAll } from 'vitest'
import { Sequelize } from 'sequelize'
import { DATABASE_URL } from '../utils/config.js'
import { User, Session } from '../models/index.js'

let testSequelize

beforeAll(async () => {
  // Ensure we're in test environment
  process.env.NODE_ENV = 'test'

  try {
    // Create a new Sequelize instance just for the tests
    testSequelize = new Sequelize(DATABASE_URL, {
      logging: false,
      dialect: 'postgres'
    })

    await testSequelize.authenticate()
    console.log('TEST-database connected for tests')

    await User.sync({ force: true })
    await Session.sync({ force: true })
    console.log('TEST-database tables created')
  } catch (error) {
    console.error('TEST-setup failed:', error)
    throw error
  }
})

afterAll(async () => {
  try {
    await testSequelize.close()
  } catch (error) {
    console.error('TEST-cleanup failed:', error)
  }
})