const http = require("http");

http.createServer((request, response) => {
    console.log("Method:", request.method);
    console.log("URL:", request.url);

    if(request.method === "GET" && request.url==="/abc"){
        response.write("world");
    }else{
        response.write("page");
    }
    response.write(" hello world");
    response.end();
}).listen(5005);

console.log("Server running at http://localhost:5005");