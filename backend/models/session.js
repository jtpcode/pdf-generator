import { Model, DataTypes } from 'sequelize'

class Session extends Model {
  static initModel(sequelize) {
    Session.init({
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      tokenHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }, {
      sequelize,
      underscored: true,
      timestamps: true,
      modelName: 'session'
    })
    return Session
  }
}

export default Session