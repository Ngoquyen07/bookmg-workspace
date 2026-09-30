import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import request from 'supertest'
import { API_ERRORS } from '../constants/responseConstants.js'
import { sendError, sendSuccess } from '../utils/apiResponse.js'

test('responses support pagination metadata and conflicts', async () => {
  const fixture = express()
  fixture.get('/list', (_req, res) => sendSuccess(res, [], { meta: { page: 1, total: 0 } }))
  fixture.post('/duplicate', (_req, res) => sendError(res, API_ERRORS.BOOK_ALREADY_IN_SHELF))

  await request(fixture).get('/list').expect(200, { data: [], meta: { page: 1, total: 0 } })
  await request(fixture).post('/duplicate').expect(409, {
    error: { code: 'BOOK_ALREADY_IN_SHELF', message: 'Book is already in the shelf' },
  })
})
