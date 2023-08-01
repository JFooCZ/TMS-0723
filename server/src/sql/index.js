const mysql = require('mysql2/promise')

const dbConfig = {
  host: 'localhost',
  port: 3306,
  database: 'managesys', //database name
  user: 'root',
  password: 'admin',
}

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig)

module.exports = pool
