const  mysql = require("mysql2");
const  con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "123",
    database: "company",
  });

module.exports=con;