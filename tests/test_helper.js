const Person = require('../models/person')

const initialPersons = [
  { name: 'Arto Hellas', number: '040-123456' },
  { name: 'Ada Lovelace', number: '39-5323523' },
]

const personsInDb = async () => {
  const persons = await Person.find({})
  return persons.map(person => person.toJSON())
}

module.exports = { initialPersons, personsInDb }
