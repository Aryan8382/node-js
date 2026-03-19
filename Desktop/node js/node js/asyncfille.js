const fs=require("fs").promises


const message= async ()=>{
    const datamessage= await fs.readFile('.././files/History.txt')
    console.log(datamessage.toString())
}
message()

console.log('1. Starting async read...');
fs.readFile('myfile.txt', 'utf8', (err, data) => {
  if (err) throw err;
  console.log('2. File contents:', data);
});

console.log('3. Done starting read operation');
