import Sequelize from 'sequelize'
import { DATABASE_URL } from './config.js'
import { Umzug, SequelizeStorage } from 'umzug'
import { pathToFileURL } from 'url'

const isTest = process.env.NODE_ENV === 'test'

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: isTest ? false : console.log,
})

// If you need to use SSL connection, uncomment below and comment the above line
//
// const sequelize = new Sequelize(DATABASE_URL, {
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false
//     }
//   },
// })

const connectToDatabase = async () => {
  try {
    await sequelize.authenticate()
    await runMigrations()
    console.log('Database connected successfully')
  } catch (err) {
    console.log('connecting database failed:', err)
    return process.exit(1)
  }

  return null
}

const migrationConf = {
  migrations: {
    glob: 'migrations/*.js',
    // For ESM: import file and use default export as a migration object
    resolve: ({ name, path }) => {
      return {
        name,
        up: async (params) => {
          const mod = await import(pathToFileURL(path))
          return mod.default.up(params)
        },
        down: async (params) => {
          const mod = await import(pathToFileURL(path))
          return mod.default.down(params)
        }
      }
    }
  },
  storage: new SequelizeStorage({ sequelize, tableName: 'migrations' }),
  context: sequelize.getQueryInterface(),
  logger: console,
}

const runMigrations = async () => {
  const migrator = new Umzug(migrationConf)
  const migrations = await migrator.up()
  console.log('Migrations up to date', {
    files: migrations.map((mig) => mig.name),
  })
}

const rollbackMigration = async () => {
  await sequelize.authenticate()
  const migrator = new Umzug(migrationConf)
  await migrator.down()
}

export { connectToDatabase, sequelize, rollbackMigration }