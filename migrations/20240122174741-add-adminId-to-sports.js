'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Sports', 'adminId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Admins',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Sports', 'adminId');
  }
};
