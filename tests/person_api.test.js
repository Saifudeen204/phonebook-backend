const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const supertest = require('supertest')
const app = require('../app')
const Person = require('../models/person')
const User = require('../models/user')
const helper = require('./test_helper')

const api = supertest(app)

let token
let testUser

beforeEach(async () => {
  await Person.deleteMany({})
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  testUser = new User({ username: 'roottest', name: 'Root Test', passwordHash })
  await testUser.save()

  const loginResponse = await api
    .post('/api/login')
    .send({ username: 'roottest', password: 'sekret' })

  token = loginResponse.body.token

  const personObjects = helper.initialPersons.map(p => new Person({ ...p, user: testUser._id }))
  const promiseArray = personObjects.map(p => p.save())
  const savedPersons = await Promise.all(promiseArray)

  testUser.persons = savedPersons.map(p => p._id)
  await testUser.save()
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
    const newPerson = { name: 'New Name', number: '040-1234567' }

    await api
      .post('/api/persons')
      .set('Authorization', `Bearer ${token}`)
      .send(newPerson)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length + 1)

    const names = personsAtEnd.map(p => p.name)
    expect(names).toContain('New Name')
  })

  test('person cannot be added without a token', async () => {
    const newPerson = { name: 'No Token', number: '040-9999999' }

    await api
      .post('/api/persons')
      .send(newPerson)
      .expect(401)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length)
  })

  test('person without a valid number is not added', async () => {
    const newPerson = { name: 'Bad Number', number: '123' }

    await api
      .post('/api/persons')
      .set('Authorization', `Bearer ${token}`)
      .send(newPerson)
      .expect(400)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length)
  })

  test('person without a name is not added', async () => {
    const newPerson = { number: '39-23-6423122' }

    await api
      .post('/api/persons')
      .set('Authorization', `Bearer ${token}`)
      .send(newPerson)
      .expect(400)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length)
  })
})

describe('DELETE /api/persons/:id', () => {
  test('a person can be deleted by its creator', async () => {
    const personsAtStart = await helper.personsInDb()
    const personToDelete = personsAtStart[0]

    await api
      .delete(`/api/persons/${personToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length - 1)

    const names = personsAtEnd.map(p => p.name)
    expect(names).not.toContain(personToDelete.name)
  })

  test('deleting fails with 401 if no token is provided', async () => {
    const personsAtStart = await helper.personsInDb()
    const personToDelete = personsAtStart[0]

    await api
      .delete(`/api/persons/${personToDelete.id}`)
      .expect(401)

    const personsAtEnd = await helper.personsInDb()
    expect(personsAtEnd).toHaveLength(helper.initialPersons.length)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
