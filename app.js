const express = require('express')
const app = express()
const cors = require('cors')
const Person = require('./models/person')
const usersRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const middleware = require('./utils/middleware')

app.use(cors())
app.use(express.json())
app.use(express.static('dist'))
app.use(middleware.tokenExtractor)

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', middleware.userExtractor, async (request, response, next) => {
  try {
    const user = request.user
    if (!user) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const person = await Person.findById(request.params.id)
    if (!person) {
      return response.status(404).end()
    }

    if (!person.user || person.user.toString() !== user._id.toString()) {
      return response.status(401).json({ error: 'only the creator can delete this person' })
    }

    await Person.findByIdAndDelete(request.params.id)
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.post('/api/persons', middleware.userExtractor, async (request, response, next) => {
  const body = request.body

  try {
    const user = request.user
    if (!user) {
      return response.status(401).json({ error: 'token invalid' })
    }

    const person = new Person({
      name: body.name,
      number: body.number,
      user: user._id
    })

    const savedPerson = await person.save()
    user.persons = user.persons.concat(savedPerson._id)
    await user.save()

    response.json(savedPerson)
  } catch (error) {
    next(error)
  }
})

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'token invalid' })
  }

  next(error)
}
app.use(errorHandler)

module.exports = app
