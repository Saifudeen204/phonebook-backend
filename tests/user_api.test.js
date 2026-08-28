const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
  await User.deleteMany({})
})

describe('POST /api/users', () => {
  test('a valid user can be created', async () => {
    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await User.find({})
    expect(usersAtEnd).toHaveLength(1)
    expect(usersAtEnd[0].username).toBe(newUser.username)
  })

  test('creation fails if username is missing', async () => {
    const newUser = {
      name: 'No Username',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    const usersAtEnd = await User.find({})
    expect(usersAtEnd).toHaveLength(0)
  })

  test('creation fails if password is too short', async () => {
    const newUser = {
      username: 'shortpass',
      name: 'Short Password',
      password: 'ab',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    const usersAtEnd = await User.find({})
    expect(usersAtEnd).toHaveLength(0)
  })

  test('creation fails with a duplicate username', async () => {
    const newUser = {
      username: 'duplicate',
      name: 'First',
      password: 'salainen',
    }

    await api.post('/api/users').send(newUser).expect(201)

    await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    const usersAtEnd = await User.find({})
    expect(usersAtEnd).toHaveLength(1)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
