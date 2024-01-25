'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Player extends Model {
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
        const players = await Player.findAll();
        return players;
      } catch (error) {
        throw new Error(`Error retrieving sports: ${error.message}`);
      }
    }
    static async createPlayer({ firstName, lastName, email, password }) {
      try {
        const player = await Player.create({
          firstName,
          lastName,
          email,
          password,
        });

        return player;
      } catch (error) {
        throw new Error(`Error creating admin: ${error.message}`);
      }
    }
  }
  
  Player.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Player',
  });
  return Player;
};