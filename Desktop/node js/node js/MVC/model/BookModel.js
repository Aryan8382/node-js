const mongoos = require('mongoose')

const BookSchema = mongoos.Schema({
    BookName: {
        type: String
    },
    BookAuthor: {
        type: String
    }
})

const BookModel = mongoos.model('book', BookSchema)

module.exports = BookModel