'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Join extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
    static async getAll() {
      try {
        const joins = await Join.findAll();
        return joins;
      } catch (error) {
        throw new Error(`Error retrieving sports: ${error.message}`);
      }
    }
  }
  Join.init({
    playerId: DataTypes.INTEGER,
    sessionId: DataTypes.INTEGER,
    teamSize: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Join',
  });
  return Join;
};