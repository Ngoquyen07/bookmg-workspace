import assert from 'node:assert/strict'
import test from 'node:test'
import { DataTypes, Sequelize, Transaction } from 'sequelize'

test('patched uuid supports Sequelize defaults and transaction IDs', async () => {
  const database = new Sequelize('test', 'test', 'test', {
    dialect: 'mysql',
    logging: false,
  })

  try {
    const Entry = database.define('UuidCheck', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      legacyId: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV1 },
    }, { timestamps: false })
    const entry = Entry.build()
    await entry.validate()
    const pattern = version => new RegExp(`^[0-9a-f]{8}-[0-9a-f]{4}-${version}[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`, 'i')
    assert.match(entry.id, pattern(4))
    assert.match(entry.legacyId, pattern(1))
    assert.match(new Transaction(database).id, pattern(4))
  } finally {
    await database.close()
  }
})
