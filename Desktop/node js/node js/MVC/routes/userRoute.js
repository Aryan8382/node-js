const express = require("express")

const { 
    addUser, 
    getUsers, 
    updateUser, 
    deleteUser, 
    login, 
    verify, 
    Home 
} = require("../controller/UserController")

const auth = require("../middleware/auth")

const U_router = express.Router()

// ADD USER
U_router.post("/add", addUser)

// LOGIN
U_router.post("/login", login)

// VERIFY TOKEN
U_router.post("/verify", verify)

// GET USERS
U_router.get("/get", getUsers)

// UPDATE USER
U_router.patch("/update/:id", updateUser)

// DELETE USER
U_router.delete("/delete/:id", deleteUser)

// PROTECTED ROUTE
U_router.get("/", verify, auth, Home)

module.exports = U_router