import { DataTypes } from 'sequelize'
import { sequelize } from '../config/database.js'
import { normalizeReadingUrl } from '../utils/readingUrl.js'

function stringArray(value) {
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
    throw new Error('Expected an array of strings')
  }
}

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.STRING(32), primaryKey: true, allowNull: false,
    validate: { is: /^OL\d+W$/, len: [1, 32] },
  },
  title: {
    type: DataTypes.STRING(500), allowNull: false,
    validate: { notEmpty: true, len: [1, 500], notBlank(value) {
      if (!value.trim()) throw new Error('Title must not be blank')
    } },
  },
  authors: {
    type: DataTypes.JSON, allowNull: false, defaultValue: [],
    validate: { stringArray },
  },
  coverId: {
    type: DataTypes.INTEGER.UNSIGNED, allowNull: true,
    validate: { isInt: true, min: 1, max: 4294967295 },
  },
  firstPublishYear: {
    type: DataTypes.SMALLINT.UNSIGNED, allowNull: true,
    validate: { isInt: true, min: 1, max: 65535 },
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  readingUrl: {
    type: DataTypes.STRING(2048), allowNull: true, defaultValue: null,
    validate: { safeUrl(value) {
      if (value !== null && normalizeReadingUrl(value) !== value) throw new Error('Expected a trusted HTTPS reading URL')
    } },
  },
  subjects: {
    type: DataTypes.JSON, allowNull: false, defaultValue: [],
    validate: { stringArray },
  },
}, { tableName: 'books', timestamps: true })

export default Book
