export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('shelf_entries', 'lastProgressAt', {
    type: Sequelize.DATE, allowNull: true, defaultValue: null,
  })
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('shelf_entries', 'lastProgressAt')
}
