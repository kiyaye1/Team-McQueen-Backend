const mysql = require('mysql');

//make a database connection
const db = mysql.createConnection({
    host : 'db-1.ckkvuqjth30g.us-east-2.rds.amazonaws.com',
    port : 3306,
    user : 'admin',
    password : 'tZtp9E7n7J4j2o3aIv17',
    database : 'GyroCar',
    multipleStatements: true
});

module.exports = db;