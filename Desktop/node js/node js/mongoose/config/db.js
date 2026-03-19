const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/aryan123')

const db = mongoose.connection

db.on('connected', () => {
    console.log('Database Connected')
})

db.on('error', (err) => {
    console.log('Database Error:', err)
})

module.exports = db