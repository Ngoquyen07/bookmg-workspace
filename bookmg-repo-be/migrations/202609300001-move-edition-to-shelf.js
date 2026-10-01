export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('shelf_entries', 'editionId', { type: Sequelize.STRING(32), allowNull: true })
  await queryInterface.addColumn('shelf_entries', 'totalPages', { type: Sequelize.INTEGER.UNSIGNED, allowNull: true })
  await queryInterface.sequelize.query(`
    UPDATE shelf_entries AS shelf
    JOIN books AS book ON book.id = shelf.bookId
    SET shelf.editionId = book.editionId, shelf.totalPages = book.totalPages
  `)
  await queryInterface.addConstraint('shelf_entries', {
    fields: ['totalPages'], type: 'check', name: 'shelf_entries_total_pages_positive',
    where: { totalPages: { [Sequelize.Op.gt]: 0 } },
  })
  await queryInterface.sequelize.query('ALTER TABLE `books` DROP CHECK `books_total_pages_positive`')
  await queryInterface.removeColumn('books', 'editionId')
  await queryInterface.removeColumn('books', 'totalPages')
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.addColumn('books', 'editionId', { type: Sequelize.STRING(32), allowNull: true })
  await queryInterface.addColumn('books', 'totalPages', { type: Sequelize.INTEGER.UNSIGNED, allowNull: true })
  await queryInterface.sequelize.query(`
    UPDATE books AS book
    JOIN shelf_entries AS shelf ON shelf.bookId = book.id
    SET book.editionId = shelf.editionId, book.totalPages = shelf.totalPages
  `)
  await queryInterface.addConstraint('books', {
    fields: ['totalPages'], type: 'check', name: 'books_total_pages_positive',
    where: { totalPages: { [Sequelize.Op.gt]: 0 } },
  })
  await queryInterface.sequelize.query('ALTER TABLE `shelf_entries` DROP CHECK `shelf_entries_total_pages_positive`')
  await queryInterface.removeColumn('shelf_entries', 'totalPages')
  await queryInterface.removeColumn('shelf_entries', 'editionId')
}
