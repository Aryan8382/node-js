const userModel = require("../model/usermodel")
const jwt = require("jsonwebtoken")

// ADD USER
const addUser = async (req, res) => {
    const { username, password, role } = req.body

    const data = await userModel.create({
        username: username,
        password: password,
        role: role || "user"
    })

    return res.send(data)
}

// GET ALL USERS
const getUsers = async (req, res) => {
    const data = await userModel.find()
    return res.send(data)
}

// UPDATE USER
const updateUser = async (req, res) => {
    const data = await userModel.findByIdAndUpdate(req.params.id, req.body)
    return res.send(data)
}

// DELETE USER
const deleteUser = async (req, res) => {
    const data = await userModel.findByIdAndDelete(req.params.id)
    return res.send(data)
}

// LOGIN
const login = async (req, res) => {
    const { username, password, role } = req.body

    const data = await userModel.findOne({ username })

    if (!data) {
        return res.send("username not exist")
    }
    else if (data.password !== password) {
        return res.send("password mismatch")
    }
    else {
        let payload = {
            username,
            password,
            role: role || "user"
        }

        const info = jwt.sign(payload, "secret-key")
        return res.send(info)
    }
}

// VERIFY TOKEN (middleware style like madam)
const verify = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];

        if (!token) {
            return res.status(401).send("Token missing")
        }

        const info = jwt.verify(token, "secret-key")
        console.log(info)

        req.user = info
        next()

    } catch (err) {
        res.status(401).send("Invalid Token")
    }
}

// HOME ROUTE
const Home = (req, res) => {
    res.send("home")
}

module.exports = {
    addUser,
    getUsers,
    updateUser,
    deleteUser,
    login,
    verify,
    Home
}