const BookModel = require("../model/BookModel");

const addBook = async (req, res) => {
    const data = await BookModel.create(req.body);
    res.send(data);
};

const getBook  = async (req, res) => {
    const data = await BookModel.find();
    res.send(data);
};

const deleteBook  = async (req, res) => {
    const data = await BookModel.findByIdAndDelete(req.params.id);
    res.send("Book Deleted");
};

const editBook  = async (req, res) => {
    const id = req.params.id;
    const data = await BookModel.findByIdAndUpdate(id, req.body, { new: true });
    res.send(data);
};


module.exports = { addBook, editBook, deleteBook,getBook };