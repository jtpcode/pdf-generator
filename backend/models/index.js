import User from './user.js'
import Session from './session.js'
import File from './file.js'

// Define associations
User.hasMany(Session, { foreignKey: 'userId' })
Session.belongsTo(User, { foreignKey: 'userId' })

User.hasMany(File, { foreignKey: 'userId' })
File.belongsTo(User, { foreignKey: 'userId' })

export { User, Session, File }