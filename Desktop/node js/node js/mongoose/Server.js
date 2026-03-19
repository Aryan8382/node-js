const express = require("express")
const db = require("./config/db")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const app = express()

const User = require("./model/usermodel")

app.set("view engine", "ejs")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/upload", express.static(path.join(__dirname, "upload")))


// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "upload/")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage }).single("image")


// Insert Data
app.post('/insertData', upload, async (req, res) => {

    const { username, password } = req.body
    let image = ""

    if (req.file) {
        image = req.file.path
    }

    await User.create({
        username,
        password,
        image
    })

    res.redirect('/')

})


// Show Data
app.get("/", async (req, res) => {

    const data = await User.find({})

    res.render("home", { data })

})


// Delete User
app.get("/delete/:id", async (req,res)=>{

    const id = req.params.id

    const user = await User.findById(id)

    if(user.image){
        fs.unlinkSync(user.image)
    }

    await User.findByIdAndDelete(id)

    res.redirect("/")

})


// Open Edit Page
app.get('/edit/:id', async(req, res) => {

    const data = await User.findById(req.params.id)

    res.render('edit', { data })

})


// Update User
app.post('/update/:id', upload, async(req, res) => {

    const user = await User.findById(req.params.id)

    const updateData = {
        username: req.body.username,
        password: req.body.password
    }

    if (req.file) {

        if (user.image) {
            fs.unlinkSync(user.image)
        }

        updateData.image = req.file.path
    }

    await User.findByIdAndUpdate(req.params.id, updateData)

    res.redirect('/')

})


app.listen(8203, () => {

    console.log("Server running on port 8203")

})