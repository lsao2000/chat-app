
const db = require("mysql2");
const PORT = 3000;
const HOST = "localhost";
const mydb = db.createConnection(
    {
        host: HOST,
        user: "root",
        password: "lsao@2000",
        database: "learn_node"
    }
);

mydb.connect((err) => {
    if (err) {
        console.log("DATABASE ERROR: " + err.stack)
        return;
    }
    console.log("Connected to database succesfully")
});
module.exports = mydb
