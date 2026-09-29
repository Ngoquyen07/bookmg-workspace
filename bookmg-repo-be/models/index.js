import Book from './book.js'
import ShelfEntry from './shelfEntry.js'

Book.hasOne(ShelfEntry, {
  as: 'shelfEntry', foreignKey: 'bookId', onDelete: 'RESTRICT', onUpdate: 'CASCADE',
})
ShelfEntry.belongsTo(Book, {
  as: 'book', foreignKey: 'bookId', onDelete: 'RESTRICT', onUpdate: 'CASCADE',
})

export { Book, ShelfEntry }
