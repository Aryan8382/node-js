const express = require("express")
const db=require("./config/db")

const U_router=require("./routes/userRoute")
const B_router = require("./routes/BookRoute") 
const app = express()

app.use(express.json())

// app.use("/user",U_router)
app.use("/book", B_router)

app.listen(8990, () => {
    console.log("server listen")

})