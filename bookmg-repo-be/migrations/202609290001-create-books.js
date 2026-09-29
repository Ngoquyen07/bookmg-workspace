// Keep migration definitions fixed; do not import mutable model definitions.
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('books', {
    id: { type: Sequelize.STRING(32), allowNull: false, primaryKey: true },
    title: { type: Sequelize.STRING(500), allowNull: false },
    authors: { type: Sequelize.JSON, allowNull: false },
    coverId: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
    firstPublishYear: { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true },
    description: { type: Sequelize.TEXT, allowNull: true },
    subjects: { type: Sequelize.JSON, allowNull: false },
    totalPages: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
    editionId: { type: Sequelize.STRING(32), allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' })
  await queryInterface.addConstraint('books', {
    fields: ['totalPages'], type: 'check', name: 'books_total_pages_positive',
    where: { totalPages: { [Sequelize.Op.gt]: 0 } },
  })
}

export async function down(queryInterface) {
  await queryInterface.dropTable('books')
}
