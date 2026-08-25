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
    expect(response.body).toHaveLength(helper.initialPersons.length)
  })

  test('a specific person is within the returned persons', async () => {
    const response = await api.get('/api/persons')
    const names = response.body.map(p => p.name)
    expect(names).toContain('Arto Hellas')
  })
})

describe('POST /api/persons', () => {
  test('a valid person can be added', async () => {
    const newPerson = {
      name: 'Mary Poppendieck',
      number: '39-23-6423122',
    }

    await api
      .post('/api/persons')
      .send(newPerson)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length + 1)

    const names = personsAtEnd.map(p => p.name)
    expect(names).toContain('Mary Poppendieck')
  })

  test('person without a valid number is not added', async () => {
    const newPerson = {
      name: 'Missing Number Person',
      number: 'not-a-valid-number',
    }

    await api
      .post('/api/persons')
      .send(newPerson)
      .expect(400)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length)
  })

  test('person without a name is not added', async () => {
    const newPerson = {
      number: '39-23-6423122',
    }

    await api
      .post('/api/persons')
      .send(newPerson)
      .expect(400)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length)
  })
})

describe('DELETE /api/persons/:id', () => {
  test('a person can be deleted', async () => {
    const personsAtStart = await helper.personsInDb()
    const personToDelete = personsAtStart[0]

    await api
      .delete(/api/persons/${personToDelete.id})
      .expect(204)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length - 1)

    const names = personsAtEnd.map(p => p.name)
    expect(names).not.toContain(personToDelete.name)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
