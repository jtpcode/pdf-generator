import User from './user.js'
import Session from './session.js'

User.hasMany(Session)
Session.belongsTo(User)

export { User, Session }