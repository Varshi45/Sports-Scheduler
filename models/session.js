'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Session.belongsTo(models.Sport, {
        foreignKey: 'sportId',
        onDelete: 'CASCADE',
      });
    }
    static async getAll() {
      try {
        const sessions = await Session.findAll();
        return sessions;
      } catch (error) {
        throw new Error(`Error retrieving sports: ${error.message}`);
      }
    }

    static async createSession(params) {
      try {
        const session = await Session.create(params);
        return session;
      } catch (error) {
        throw new Error(`Error creating session: ${error.message}`);
      }
    };
  }
  Session.init({
    sportId: DataTypes.INTEGER,
    creator: DataTypes.STRING,
    date: DataTypes.DATE,
    time: DataTypes.TIME,
    venue: DataTypes.STRING,
    teamSize: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};