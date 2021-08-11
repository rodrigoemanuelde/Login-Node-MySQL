const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'node-login-mysql',
  password: process.env.PASS,
});

connection.connect();

module.exports = connection;
