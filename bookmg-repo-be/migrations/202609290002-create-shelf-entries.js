export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('shelf_entries', {
    id: { type: Sequelize.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
    bookId: {
      type: Sequelize.STRING(32), allowNull: false,
      references: { model: 'books', key: 'id' }, onDelete: 'RESTRICT', onUpdate: 'CASCADE',
    },
    status: {
      type: Sequelize.ENUM('want_to_read', 'reading', 'finished'),
      allowNull: false, defaultValue: 'want_to_read',
    },
    currentPage: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    rating: { type: Sequelize.TINYINT.UNSIGNED, allowNull: true },
    notes: { type: Sequelize.STRING(1000), allowNull: true },
    startedAt: { type: Sequelize.DATEONLY, allowNull: true },
    finishedAt: { type: Sequelize.DATEONLY, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  }, { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' })
  await queryInterface.addConstraint('shelf_entries', {
    fields: ['bookId'], type: 'unique', name: 'shelf_entries_book_id_unique',
  })
  await queryInterface.addConstraint('shelf_entries', {
    fields: ['rating'], type: 'check', name: 'shelf_entries_rating_range',
    where: { rating: { [Sequelize.Op.between]: [1, 5] } },
  })
}

export async function down(queryInterface) {
  await queryInterface.dropTable('shelf_entries')
}
