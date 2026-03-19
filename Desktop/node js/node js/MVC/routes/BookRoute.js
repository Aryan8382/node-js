const express = require("express");
const { addBook, editBook, deleteBook,getBook } = require("../controller/BookController");

const B_router = express.Router();

B_router.post("/add", addBook);
B_router.get("/all", getBook);
B_router.patch("/:id", editBook);   
B_router.delete("/:id", deleteBook);

module.exports = B_router;