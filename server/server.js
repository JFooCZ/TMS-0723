// normal folder has been updated. May now be used as prototype for jwt testing.
const express = require("express")
const session = require("express-session")
const bodyParser = require("body-parser")
const mysql = require("mysql2/promise")
const cors = require("cors")
const app = express()
const port = 8000
var bcrypt = require("bcryptjs")
const dotenv = require("dotenv")
const jwt = require("jsonwebtoken")
const checkgroup = require("./checkgroup")
app.use(bodyParser.json())
require("dotenv").config()
//whitelist only the requests from localhost:8000. However, does not prevent attacks like SQL injection,XSS,CSRF, etc.
app.use(
  cors({
    origin: "http://localhost:3000"
    // methods: ["GET", "POST"]
  })
)

dotenv.config()
let PORT = process.env.PORT || 8000

// Inititalize the app and add middleware
app.set("view engine", "pug") // Setup the pug
app.use(bodyParser.urlencoded({ extended: true })) // Setup the body parser to handle form submits
app.use(session({ secret: "super-secret" })) // Session setup

// Db Configuration
const dbConfig = {
  host: "localhost",
  port: 3306,
  database: "managesys", //database name
  user: "root",
  password: "admin"
}

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig)

/*-----------------------------------Auth related functionalities----------------------------- */
function getToken(user) {
  return jwt.sign({ user: user }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_TIME })
}

async function verifyToken(token) {
  let verify = await jwt.verify(token, process.env.JWT_SECRET)
  return verify
}

async function verifyUser(token) {
  try {
    let result = await verifyToken(token)
    if (result) {
      return result.user
    }
    console.log("true. " + results)
  } catch (error) {
    console.log(error)

    return null
  }
  console.log("fail")
  return null
}

/* ----------------------------------Verify Functionalities---------------------------------*/
app.post("/verify", async (req, res) => {
  // Get the token from the request body
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  // Verify the token
  const username = await verifyUser(token)
  if (!username) {
    return res.status(401).json({ error: "Invalid token" })
  }

  return res.json({ error: null })
})

/* ----------------------------------Login Functionalities---------------------------------*/
app.post("/login", async (req, res) => {
  console.log(req.body)
  const username = req.body.username
  console.log(req.body.username)
  const usernameRegex = /^[a-zA-Z0-9 ]{1,200}$/
  if (!usernameRegex.test(username)) {
    res.json({ error: "Username is alphanumeric" })
    return
  }

  const password = req.body.password
  console.log(req.body.password)

  // Check if username and password are not empty
  if (!username || !password) {
    res.json({ error: "Please enter your username/password" })
    return
  }

  try {
    // Check the username and password against the database
    const [results] = await pool.execute("SELECT * FROM user WHERE username = ?", [username])

    if (results.length < 1 || results[0].userstatus === 0) {
      return res.json({ error: "Username and/or password is incorrect" })
    }

    let usergroup = results[0].usergroups // Get the usergroup from the database

    // let isAdmin = results[0].usergroups.includes("admin") // Assuming usergroups is a string with group names

    // Check if the provided password matches the stored password
    const match = bcrypt.compareSync(password, results[0].password)
    if (!match) {
      return res.json({ error: "Username and/or password is incorrect" })
    }

    // If user is verified, create a JWT token using getToken function
    const token = getToken(username)

    // Store the username in the session
    req.session.isLoggedIn = true
    req.session.username = username

    // Return the token in the response
    return res.json({ error: null, response: "success", token: token, usergroup: usergroup })
  } catch (err) {
    console.error("Error while comparing username/password:", err)
    return res.json({ error: "Internal server error" })
  }
})

/* ------------------------------------Logout Functionality------------------------------- */
app.get("/logout", (req, res) => {
  // Set isLoggedIn to false to log the user out
  req.session.isLoggedIn = false

  // Destroy the session on the server side
  req.session.destroy((err) => {
    if (err) {
      return res.json({ logout: "Error logging out" })
    }
    return res.json({ logout: "You are logged out" })
  })
})

/* ------------------------------- Create new user functionality-----------------------------*/
app.post("/createnewuser", async (req, res) => {
  // Get the token from the request body
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  // Verify the token
  const username = await verifyUser(token)
  if (!username) {
    res.json({ error: "Invalid token" })
    return
  }

  // Check if the user is part of the admin group
  const isAdmin = await checkgroup(username, ",admin,")
  if (!isAdmin) {
    res.json({ error: "You don't have the necessary permissions to perform this action" })
    return
  }

  const { newUsername, password, email, usergroups, userstatus } = req.body

  // Apply regex to username to prevent sql injection
  const usernameRegex = /^[a-zA-Z0-9 ]{1,200}$/
  if (!usernameRegex.test(newUsername)) {
    res.json({ error: "Username should be alphanumeric" })
    return
  }

  try {
    const [rows] = await pool.execute("SELECT * FROM user WHERE username = ?", [newUsername])

    if (rows.length > 0) {
      // Check if username exists
      if (rows.some((user) => user.username === newUsername)) {
        res.json({ error: "Username is already in use" })
        return
      }
    }

    // Validate password and email
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,10}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!passwordRegex.test(password) || (email && !emailRegex.test(email))) {
      res.json({ error: "Email and/or password is invalid" })
      return
    }

    const hashedDBPassword = bcrypt.hashSync(password, 10)
    let formattedUsergroups = `,${usergroups},` // Append commas to both sides

    // Insert the new user into the database
    await pool.execute("INSERT INTO user (username, email, password, usergroups, userstatus) VALUES (?, ?, ?, ?, ?)", [newUsername, email || null, hashedDBPassword, formattedUsergroups || null, userstatus || null])

    res.json({ error: null, response: "success" })
  } catch (err) {
    console.error("Error executing the query:", err)
    res.json({ error: "Internal server error" })
  }
})

/*--------------------------------------Get all users---------------------------------------- */
app.post("/getallusers", async (req, res) => {
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  let group = "admin"
  // verify if token is valid
  let verify = await verifyUser(req.body.token)
  if (!verify) {
    res.json({ error: "invalid token" })
    return
  }

  // check if user in group to view details
  let checkGroupResult = await checkgroup(verify, group)
  if (checkGroupResult !== true) {
    res.json({ error: "You are not allowed to view this. Please check with your admin for further details" })
    return
  }

  try {
    // Fetch all user details from the database (need remove pw after)
    const [results] = await pool.execute("SELECT username, password, email, usergroups, userstatus FROM user")
    res.json({ error: null, response: results })
  } catch (err) {
    console.error("Error executing the query:", err)
    res.json({ error: "Internal server error" })
  }
})

/* -------------------------------Get all User Groups function-------------------------------- */
app.post("/getallusergroups", async (req, res) => {
  // Get the token from the request body
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  // Verify the token
  const username = await verifyUser(token)
  if (!username) {
    res.json({ error: "Invalid token" })
    return
  }

  // Check if the user is part of the admin group
  const isAdmin = await checkgroup(username, ",admin,")
  if (!isAdmin) {
    res.json({ error: "You don't have the necessary permissions to perform this action" })
    return
  }

  try {
    // Fetch all user group details from the database
    const [results] = await pool.execute("SELECT usergroups FROM usergroups")

    res.json({ error: null, response: results })
  } catch (err) {
    console.error("Error executing the query:", err)
    res.json({ error: "Internal server error" })
  }
})

/*--------------------------------- Create new usergroups------------------------------------*/
app.post("/createusergroup", async (req, res) => {
  const { usergroups, token } = req.body

  // Verify the token
  const username = await verifyUser(token)
  if (!username) {
    res.json({ error: "Invalid token" })
    return
  }

  // Check if the user is part of the admin group
  const isAdmin = await checkgroup(username, ",admin,")
  if (!isAdmin) {
    res.json({ error: "You don't have the necessary permissions to perform this action" })
    return
  }

  // Apply regex to usergroups to prevent sql injection and restrict characters
  const usergroupsRegex = /^[a-zA-Z0-9_\-]{1,200}$/
  if (!usergroupsRegex.test(usergroups)) {
    res.json({ error: "Usergroup name should be alphanumeric; underscore, and hyphen characters are allowed." })
    return
  }

  try {
    // Check if usergroup already exists in the database
    const [results] = await pool.execute("SELECT * FROM usergroups WHERE usergroups = ?", [usergroups])

    if (results.length > 0) {
      res.json({ error: "User group is already in use" })
      return
    }

    // Insert the new user group into the database
    const [result] = await pool.execute("INSERT INTO usergroups (usergroups) VALUES (?)", [usergroups])

    res.json({ error: null, response: "success" })
  } catch (err) {
    console.error("Error executing the query:", err)
    res.json({ error: "Internal server error" })
  }
})

/*-----------------------------Change User Details function-------------------------*/
// app.post("/changeuserdetails", async (req, res) => {
//   // Get the token from the request body
//   const token = req.body.token
//   if (!token) {
//     return res.status(400).json({ error: "Token must be provided" })
//   }

//   // Verify the token
//   const usernameFromToken = await verifyUser(token)
//   if (!usernameFromToken) {
//     res.json({ error: "Invalid token" })
//     return
//   }

//   // Check if the user is part of the admin group
//   const isAdmin = await checkgroup(usernameFromToken, ",admin,")
//   if (!isAdmin) {
//     res.json({ error: "You don't have the necessary permissions to perform this action" })
//     return
//   }

//   const { username, newPassword, newEmail, newStatus, newUsergroups } = req.body

//   // Admin is not allowed to change the "admin" user, unless it's the admin himself
//   if (username === "admin" && usernameFromToken !== "admin") {
//     res.json({ error: "This user's details cannot be changed" })
//     return
//   }

//   // Apply regex to inputs to prevent SQL injection
//   const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,10}$/
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

//   if (newPassword && !passwordRegex.test(newPassword)) {
//     res.json({ error: "Password is invalid" })
//     return
//   }

//   // Email provided
//   if (newEmail && !emailRegex.test(newEmail)) {
//     res.json({ error: "Email is invalid" })
//     return
//   }

//   // Convert newStatus to boolean
//   const userStatus = Boolean(newStatus)

//   try {
//     // Check if the username exists in the database
//     const [results] = await pool.execute("SELECT * FROM user WHERE username = ?", [username])

//     if (results.length === 0) {
//       res.json({ error: "Username does not exist!" })
//       return
//     }

//     const hashedDBPassword = newPassword ? bcrypt.hashSync(newPassword, 10) : results[0].password

//     let query = newPassword ? "UPDATE user SET password = ?" : "UPDATE user SET"
//     let params = newPassword ? [hashedDBPassword] : []

//     // Add fields to the query if they were provided
//     if (newEmail || newEmail === "") {
//       query += ", email = ?"
//       params.push(newEmail || null)
//     }

//     if (newUsergroups || newUsergroups === "") {
//       let formattedUsergroups = newUsergroups ? `,${newUsergroups},` : null // Append commas to both sides if newUsergroups is not an empty string
//       query += ", usergroups = ?"
//       params.push(formattedUsergroups || null)
//     }

//     query += ", userstatus = ? WHERE username = ?"
//     params.push(userStatus, username)

//     // Update the password, email, and status for the given username
//     await pool.execute(query, params)

//     res.json({ error: null, response: "success" })
//   } catch (err) {
//     console.error("Error executing the query:", err.message)
//     res.status(500).json({ error: err.message })
//   }
// })

app.post("/changeuserdetails", async (req, res) => {
  // Get the token from the request body
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  // Verify the token
  const usernameFromToken = await verifyUser(token)
  if (!usernameFromToken) {
    res.json({ error: "Invalid token" })
    return
  }

  // Check if the user is part of the admin group
  const isAdmin = await checkgroup(usernameFromToken, ",admin,")
  if (!isAdmin) {
    res.json({ error: "You don't have the necessary permissions to perform this action" })
    return
  }

  const { username, newPassword, newEmail, newStatus, newUsergroups } = req.body

  // Admin is not allowed to change the "admin" user, unless it's the admin himself
  if (username === "admin" && usernameFromToken !== "admin") {
    res.json({ error: "This user's details cannot be changed" })
    return
  }

  // Apply regex to inputs to prevent SQL injection
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,10}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (newPassword && !passwordRegex.test(newPassword)) {
    res.json({ error: "Password is invalid" })
    return
  }

  // Email provided
  if (newEmail && !emailRegex.test(newEmail)) {
    res.json({ error: "Email is invalid" })
    return
  }

  // Convert newStatus to boolean
  const userStatus = Boolean(newStatus)

  try {
    // Check if the username exists in the database
    const [results] = await pool.execute("SELECT * FROM user WHERE username = ?", [username])

    if (results.length === 0) {
      res.json({ error: "Username does not exist!" })
      return
    }

    const hashedDBPassword = newPassword ? bcrypt.hashSync(newPassword, 10) : results[0].password

    let query = "UPDATE user SET"
    let params = []

    if (newPassword) {
      query += " password = ?,"
      params.push(hashedDBPassword)
    }

    if (newEmail || newEmail === "") {
      query += " email = ?,"
      params.push(newEmail || null)
    }

    if (newUsergroups || newUsergroups === "") {
      let formattedUsergroups = newUsergroups ? `,${newUsergroups},` : null
      query += " usergroups = ?,"
      params.push(formattedUsergroups || null)
    }

    // Remove trailing comma before adding userstatus and username
    /*if (query.slice(-1) === ",") {
      query = query.slice(0, -1)
    }*/

    query += " userstatus = ? WHERE username = ?"
    params.push(userStatus, username)

    console.log("Executing query:", query) // <== Add this line
    console.log("With parameters:", params)

    // Update the password, email, and status for the given username
    console.log(query)
    await pool.execute(query, params)

    res.json({ error: null, response: "success" })
  } catch (err) {
    console.error("Error executing the query:", err.message)
    res.status(500).json({ error: err.message })
  }
})

/*---------------------------------Checkgroup------------------------------------ */
app.post("/checkgroup", async (req, res) => {
  // Get the token from the request body
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  // Verify the token
  const username = await verifyUser(token)
  if (!username) {
    res.json({ error: "Invalid token" })
    return
  }

  try {
    // Check if the user is part of the admin group
    const isAdmin = await checkgroup(username, ",admin,")
    if (isAdmin) {
      res.json({ error: null, response: "User is part of the admin group" })
    } else {
      res.json({ error: null, response: "User is not part of the admin group" })
    }
  } catch (err) {
    console.error("Error checking user group:", err)
    res.json({ error: "Internal server error" })
  }
})

//app listening at port 8000
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`)
})

/*-----------------------CHANGE Password functionality-------------- */
// app.post("/changepassword", async (req, res) => {
//   const { username, newPassword, token } = req.body

//   // Check if the user is logged in
//   if (!token) {
//     return res.json({ error: "Missing token" })
//   }

//   const usernameFromToken = await verifyUser(token)

//   if (!usernameFromToken) {
//     return res.json({ error: "Invalid token" })
//   }

//   // Check if the user is an admin and is trying to change their own password
//   const isAdmin = await checkgroup(usernameFromToken, ",admin,")
//   const isSelf = usernameFromToken === username

//   if (!(isAdmin && isSelf)) {
//     return res.json({ error: "User is not authorized to change this password" })
//   }

//   const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,10}$/
//   if (!passwordRegex.test(newPassword)) {
//     res.json({ error: "Password is invalid" })
//     return
//   }

//   // Check if the username exists in the database
//   try {
//     const [results] = await pool.execute("SELECT * FROM user WHERE username = ?", [username])
//     if (results.length === 0) {
//       res.json({ error: "Username does not exist!" })
//       return
//     }

//     const hashedDBPassword = bcrypt.hashSync(newPassword, 10)

//     // Update the password for the given username
//     await pool.execute("UPDATE user SET password = ? WHERE username = ?", [hashedDBPassword, username])

//     res.json({ error: null, response: "success" })
//   } catch (err) {
//     console.error("Error executing the query:", err)
//     res.json({ error: "Internal server error" })
//   }
// })
