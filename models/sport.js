'use strict';
const { Model } = require('sequelize');
const { Admin } = require('./admin');

module.exports = (sequelize, DataTypes) => {
  class Sport extends Model {
    static associate(models) {
      Sport.belongsTo(models.Admin, {
        foreignKey: 'adminId',
        onDelete: 'CASCADE',
      });
    }

    static async createSport(adminId, { name }) {
      try {
        const sport = await Sport.create({
          name,
          adminId,
        });
        return sport;
      } catch (error) {
        throw new Error(`Error creating sport: ${error.message}`);
      }
    }

    static async getAllSports(adminId) {
      try {
        const sports = await Sport.findAll({
          where: { adminId }
        });
        return sports;
      } catch (error) {
        throw new Error(`Error retrieving sports: ${error.message}`);
      }
    }
    static async getAll() {
      try {
        const sports = await Sport.findAll();
        return sports;
      } catch (error) {
        throw new Error(`Error retrieving sports: ${error.message}`);
      }
    }

    static async deleteSport(sportId) {
      try {
        // Delete the sport
        const sport = await Sport.findOne({
          where: { id: sportId },
        });
        await sport.destroy();

        return { message: 'Sport deleted successfully' };
      } catch (error) {
        throw new Error(`Error deleting sport: ${error.message}`);
      }
    }
  }

  Sport.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Sport',
  });

  return Sport;
};