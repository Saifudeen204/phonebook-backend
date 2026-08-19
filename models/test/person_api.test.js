cat > ~/workspace/tests/person_api.test.js << 'EOF'
const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Person = require('../models/person')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
  await Person.deleteMany({})
  await Person.insertMany(helper.initialPersons)
})

describe('GET /api/persons', () => {
  test('persons are returned as json', async () => {
    await api
      .get('/api/persons')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all persons are returned', async () => {
    const response = await api.get('/api/persons')
    assert.strictEqual(response.body.length, helper.initialPersons.length)
  })

  test('a specific person is within the returned persons', async () => {
    const response = await api.get('/api/persons')
    const names = response.body.map(p => p.name)
    assert(names.includes('Arto Hellas'))
  })
})

after(async () => {
  await mongoose.connection.close()
})
EOF
