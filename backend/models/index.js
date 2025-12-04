import User from './user.js'
import Session from './session.js'

const initModels = (sequelize) => {
  User.initModel(sequelize)
  Session.initModel(sequelize)

  User.hasMany(Session)
  Session.belongsTo(User)
}

export { User, Session, initModels }