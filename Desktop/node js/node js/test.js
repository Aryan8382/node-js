const fs=require("fs")

fs.writeFileSync("iii.txt","hello")

fs.appendFileSync("iii.txt","nodejs into")

const a=fs.readFileSync("iii.txt")
console.log(a.toString())

fs.renameSync("iii.txt","hello.txt")

fs.unlinkSync("hello.txt")

const hello=(()=>{
    console.log("hello")
})

module.exports=hello

