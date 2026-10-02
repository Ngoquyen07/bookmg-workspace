export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('books', 'readingUrl', {
    type: Sequelize.STRING(2048), allowNull: true, defaultValue: null,
  })
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('books', 'readingUrl')
}
