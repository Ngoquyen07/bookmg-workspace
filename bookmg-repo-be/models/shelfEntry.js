import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { MAX_NOTE_LENGTH, READING_STATUS } from '../constants/bookConstants.js'

const ShelfEntry = sequelize.define('ShelfEntry', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  bookId: {
    type: DataTypes.STRING(32), allowNull: false,
    unique: 'shelf_entries_book_id_unique',
    references: { model: 'books', key: 'id' },
    onDelete: 'RESTRICT', onUpdate: 'CASCADE',
    validate: { is: /^OL\d+W$/, len: [1, 32] },
  },
  status: {
    type: DataTypes.ENUM(...Object.values(READING_STATUS)), allowNull: false,
    defaultValue: READING_STATUS.WANT_TO_READ,
    validate: { isIn: [Object.values(READING_STATUS)] },
  },
  currentPage: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0,
    validate: { isInt: true, min: 0, max: 4294967295 },
  },
  editionId: {
    type: DataTypes.STRING(32), allowNull: true,
    validate: { is: /^OL\d+M$/, len: [1, 32] },
  },
  totalPages: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: true,
    validate: { isInt: true, min: 1, max: 4294967295 },
  },
  rating: {
    type: DataTypes.TINYINT.UNSIGNED, allowNull: true,
    validate: { isInt: true, min: 1, max: 5 },
  },
  notes: {
    type: DataTypes.STRING(MAX_NOTE_LENGTH), allowNull: true,
    validate: { len: [0, MAX_NOTE_LENGTH] },
  },
  startedAt: { type: DataTypes.DATEONLY, allowNull: true },
  finishedAt: { type: DataTypes.DATEONLY, allowNull: true },
}, { tableName: 'shelf_entries', timestamps: true })

export default ShelfEntry
