'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Sports', {
      type: 'unique',
      fields: ['name','adminId'],
      name: 'unique_name_constraint'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Sports', 'unique_name_constraint');
  }
};
