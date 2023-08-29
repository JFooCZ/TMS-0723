const express = require("express")
const session = require("express-session")
const bodyParser = require("body-parser")
const mysql = require("mysql2/promise")
const cors = require("cors")
const app = express()
var bcrypt = require("bcryptjs")
const dotenv = require("dotenv")
const jwt = require("jsonwebtoken")
const checkgroup = require("./Checkgroup")
var nodemailer = require("nodemailer")
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

app.use(bodyParser.urlencoded({ extended: true })) // Setup the body parser to handle form submits
app.use(
  session({
    secret: "your_secret_key",
    resave: false, // Do not force a session that is "uninitialized" to be saved to the store.
    saveUninitialized: true // Forces a session that is "uninitialized" to be saved to the store.
  })
)

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

// const userRoutes = require("./routes/userRoutes")
// const appRoutes = require("./routes/appRoutes")

// app.use("/api/users", userRoutes)
// app.use("/api/apps", appRoutes)

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
    // console.log("true. " + results)
  } catch (error) {
    // console.log(error)

    return null
  }
  // console.log("fail")
  return null
}

async function checkUserEnabled(req, res, next) {
  const token = req.body.token
  const user = await verifyUser(token)

  if (!user) {
    return res.status(401).json({ error: "Invalid token" })
  }

  const [results] = await pool.execute("SELECT userstatus FROM user WHERE username = ?", [user])

  if (results.length < 1 || results[0].userstatus === 0) {
    return res.status(403).json({ error: "User is disabled" })
  }
  next()
}

/* ----------------------------------Verify Functionalities---------------------------------*/
app.post("/verify", checkUserEnabled, async (req, res) => {
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

/*-----------------------------------Check belong group------------------------------- */
app.post("/belonggroup", checkUserEnabled, async (req, res) => {
  const token = req.body.token
  const groupToCheck = req.body.group

  if (!groupToCheck) {
    return res.status(400).json({ error: "Group to check must be provided" })
  }

  const username = await verifyUser(token)
  if (!username) {
    return res.status(401).json({ error: "Invalid token" })
  }

  const isPartOfGroup = await checkgroup(username, groupToCheck)
  return res.json({ isPartOfGroup })
})

/* ----------------------------------Login Functionalities---------------------------------*/
app.post("/login", async (req, res) => {
  // console.log(req.body)
  const username = req.body.username
  // console.log(req.body.username)
  const usernameRegex = /^[a-zA-Z0-9]{1,200}$/
  if (!usernameRegex.test(username)) {
    res.json({ error: "Username is alphanumeric" })
    return
  }

  const password = req.body.password
  // console.log(req.body.password)

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
    // console.error("Error while comparing username/password:", err)
    return res.json({ error: "Internal server error" })
  }
})

/* ------------------------------------Logout Functionality------------------------------- */
app.get("/logout", (req, res) => {
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
app.post("/createnewuser", checkUserEnabled, async (req, res) => {
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
  const isAdmin = await checkgroup(username, "admin")
  if (!isAdmin) {
    return res.status(403).json({ error: "You don't have the necessary permissions to perform this action" })
  }

  const { newUsername, password, email, usergroups, userstatus } = req.body

  // Apply regex to username to prevent sql injection
  const usernameRegex = /^[a-zA-Z0-9]{1,200}$/
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

    // Pw got at least 1 letter, 1 digit, 1 special character, from 8-10 characters, email: X@X.X where X != whitespace or @
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
    res.json(err)
  }
})

/*--------------------------------------Get all users---------------------------------------- */
app.post("/getallusers", checkUserEnabled, async (req, res) => {
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
    // console.error("Error executing the query:", err)
    res.json({ error: "Internal server error" })
  }
})

/* -------------------------------Get all User Groups function-------------------------------- */
app.post("/getallusergroups", checkUserEnabled, async (req, res) => {
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

  // // Check if the user is part of the admin group, I need non-admins to see so I'm removing this
  // const isAdmin = await checkgroup(username, "admin")
  // if (!isAdmin) {
  //   return res.status(403).json({ error: "You don't have the necessary permissions to perform this action" })
  // }

  try {
    // Fetch all user group details from the database
    const [results] = await pool.execute("SELECT usergroups FROM usergroups")

    res.json({ error: null, response: results })
  } catch (err) {
    // console.error("Error executing the query:", err)
    res.json({ error: "Internal server error" })
  }
})

/*--------------------------------- Create new usergroups------------------------------------*/
app.post("/createusergroup", checkUserEnabled, async (req, res) => {
  const { usergroups, token } = req.body

  // Verify the token
  const username = await verifyUser(token)
  if (!username) {
    res.json({ error: "Invalid token" })
    return
  }

  // Check if the user is part of the admin group
  const isAdmin = await checkgroup(username, "admin")
  if (!isAdmin) {
    return res.status(403).json({ error: "You don't have the necessary permissions to perform this action" })
  }

  const usergroupsRegex = /^[a-zA-Z0-9_\-]{1,200}$/
  if (!usergroupsRegex.test(usergroups)) {
    res.json({ error: "Usergroup name should be alphanumeric; underscore, hyphens are allowed." })
    return
  }

  try {
    const [results] = await pool.execute("SELECT * FROM usergroups WHERE usergroups = ?", [usergroups])

    if (results.length > 0) {
      res.json({ error: "User group is already in use" })
      return
    }

    const [result] = await pool.execute("INSERT INTO usergroups (usergroups) VALUES (?)", [usergroups])

    res.json({ error: null, response: "success" })
  } catch (err) {
    // console.error("Error executing the query:", err)
    res.json({ error: "Internal server error" })
  }
})

/*-----------------------------Change User Details function-------------------------*/
app.post("/changeuserdetails", checkUserEnabled, async (req, res) => {
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  const usernameFromToken = await verifyUser(token)
  if (!usernameFromToken) {
    res.json({ error: "Invalid token" })
    return
  }

  // Check if the user is part of the admin group
  const isAdmin = await checkgroup(usernameFromToken, "admin")
  if (!isAdmin) {
    return res.status(403).json({ error: "You don't have the necessary permissions to perform this action" })
  }

  const { username, newPassword, newEmail, newStatus, newUsergroups } = req.body

  // Admins are not allowed to change the "admin" user, unless it's the admin himself
  if (username === "admin" && usernameFromToken !== "admin") {
    res.json({ error: "This user's details cannot be changed" })
    return
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,10}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (newPassword && !passwordRegex.test(newPassword)) {
    res.json({ error: "Password is Password contains at least 1 alphabet, 1 number and 1 special character" })
    return
  }

  // Email provided
  if (newEmail && !emailRegex.test(newEmail)) {
    res.json({ error: "Email should follow the format of X@X.X, where X is not a whitespace or @" })
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
      let formattedUsergroups = Array.isArray(newUsergroups) ? `,${newUsergroups.filter(Boolean).join(",")},` : null
      query += " usergroups = ?,"
      params.push(formattedUsergroups || null)
    }

    query += " userstatus = ? WHERE username = ?"
    params.push(userStatus, username)

    await pool.execute(query, params)

    res.json({ error: null, response: "success" })
  } catch (err) {
    // console.error("Error executing the query:", err.message)
    res.status(500).json({ error: err.message })
  }
})

/*---------------------------------Check Admin------------------------------------ */
app.post("/checkgroup", checkUserEnabled, async (req, res) => {
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
    const isAdmin = await checkgroup(username, "admin")
    if (isAdmin) {
      res.json({ error: null, response: "User is part of the admin group" })
    } else {
      res.json({ error: "User is not part of the admin group", response: null })
    }
  } catch (err) {
    // console.error("Error checking user group:", err)
    res.json({ error: "Internal server error" })
  }
})

/*---------------------------------Profile------------------------------------ */
app.post("/profile", checkUserEnabled, async (req, res) => {
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

  const { newPassword, newEmail } = req.body

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,10}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (newPassword && !passwordRegex.test(newPassword)) {
    res.json({ error: "Password is Password contains at least 1 alphabet, 1 number and 1 special character" })
    return
  }

  // Email provided
  if (newEmail && !emailRegex.test(newEmail)) {
    res.json({ error: "Email should follow the format of X@X.X, where X is not a whitespace or @" })
    return
  }

  try {
    // Check if the username exists in the database
    const [results] = await pool.execute("SELECT * FROM user WHERE username = ?", [username])

    if (results.length === 0) {
      res.json({ error: "Username does not exist!" })
      return
    }

    let query = "UPDATE user SET"
    let params = []

    if (newPassword) {
      const hashedDBPassword = newPassword ? bcrypt.hashSync(newPassword, 10) : results[0].password
      query += " password = ?,"
      params.push(hashedDBPassword)
    }

    if (newEmail || newEmail === "") {
      query += " email = ? "
      params.push(newEmail || null)
    }

    if (query.slice(-1) === ",") {
      query = query.slice(0, -1)
    }

    query += " WHERE username = ?"
    params.push(username)

    console.log("Executing query:", query)
    console.log("With parameters:", params)
    console.log(query)
    await pool.execute(query, params)

    res.json({ error: null, response: "success" })
  } catch (err) {
    // console.error("Error executing the query:", err.message)
    res.status(500).json({ error: err.message })
  }
})

/*--------------------------------- A2 begins here---------------------------- */

/*---------------------------- Create App------------------------------- */
app.post("/createapp", checkUserEnabled, async (req, res) => {
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  const username = await verifyUser(token)
  if (!username) {
    return res.json({ error: "Invalid token" })
  }

  const isPL = await checkgroup(username, "PL")
  if (!isPL) {
    return res.status(403).json({ error: "You don't have the necessary permissions to perform this action" })
  }

  let { App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done, App_permit_create } = req.body

  App_Rnumber = Number(App_Rnumber)

  if (App_Rnumber < 0 || !Number.isInteger(App_Rnumber) || App_Acronym === "") {
    return res.status(400).json({ error: "Your R number is less than zero/not number" })
  }

  if (!App_Acronym) {
    return res.status(400).json({ error: "App Acronym and R number are required." })
  }

  try {
    await pool.execute("INSERT INTO Application (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done, App_permit_create) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [App_Acronym, App_Description || null, App_Rnumber, App_startDate || null, App_endDate || null, App_permit_Open || null, App_permit_toDoList || null, App_permit_Doing || null, App_permit_Done || null, App_permit_create])
    return res.json({ error: null, response: "App created successfully" })
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      // This error code is for duplicate entry
      return res.status(400).json({ error: "Application Acronym in Use." })
    } else {
      console.error("Error executing the query:", err)
      return res.status(500).json({ error: "Internal server error" })
    }
  }
})

/*----------------------------------Get All Applications----------------------------- */
app.post("/getapplications", checkUserEnabled, async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM application")
    return res.json({ error: null, response: rows })
  } catch (err) {
    console.error("Error executing the query:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

/*---------------------------------Get Specific App for permit------------------------ */
app.post("/getappdetails", checkUserEnabled, async (req, res) => {
  const { app_Acronym } = req.body

  if (!app_Acronym) {
    return res.status(400).json({ error: "App Acronym must be provided" })
  }

  try {
    const [rows] = await pool.execute("SELECT * FROM application WHERE App_Acronym = ?", [app_Acronym])
    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid App Acronym" })
    }

    return res.json({ error: null, response: rows[0] }) // returning the first matching application details
  } catch (err) {
    console.error("Error executing the query:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

/*----------------------------------Edit Application----------------------------- */
app.post("/editapp", checkUserEnabled, async (req, res) => {
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  const username = await verifyUser(token)
  if (!username) {
    return res.json({ error: "Invalid token" })
  }

  const isPL = await checkgroup(username, "PL")
  if (!isPL) {
    return res.status(403).json({ error: "You don't have the necessary permissions to perform this action" })
  }

  const { App_Acronym, App_startDate, App_endDate, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done, App_permit_create } = req.body

  if (!App_Acronym) {
    return res.status(400).json({ error: "App_Acronym must be provided" })
  }

  try {
    await pool.execute("UPDATE Application SET App_startDate = ?, App_endDate = ?, App_permit_Open = ?, App_permit_toDoList = ?, App_permit_Doing = ?, App_permit_Done = ?, App_permit_create = ? WHERE App_Acronym = ?", [App_startDate, App_endDate, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done, App_permit_create, App_Acronym])
    return res.json({ error: null, response: "Application details updated successfully" })
  } catch (err) {
    console.error("Error executing the query:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

/*------------------------------------Create Plan--------------------------------- */
app.post("/createplan", checkUserEnabled, async (req, res) => {
  console.log(req.body)

  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  const username = await verifyUser(token)
  if (!username) {
    return res.json({ error: "Invalid token" })
  }

  const isPM = await checkgroup(username, "PM")
  if (!isPM) {
    return res.status(403).json({ error: "You don't have the necessary permissions to perform this action" })
  }

  const { Plan_MVP_Name, Plan_startDate, Plan_endDate, Plan_color, App_Acronym } = req.body

  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!colorRegex.test(Plan_color)) {
    return res.status(400).json({ error: "Invalid color format." })
  }

  if (!Plan_MVP_Name || !App_Acronym) {
    return res.status(400).json({ error: "Plan Name and App Acronym are required." })
  }

  const [rows] = await pool.execute("SELECT App_Acronym FROM application WHERE App_Acronym = ?", [App_Acronym])
  if (rows.length === 0) {
    return res.status(400).json({ error: "App Acronym does not exist in the Application table." })
  }

  const Plan_app_Acronym = App_Acronym

  try {
    await pool.execute("INSERT INTO Plan (Plan_MVP_Name, Plan_startDate, Plan_endDate, Plan_color, Plan_app_Acronym) VALUES (?, ?, ?, ?, ?)", [Plan_MVP_Name, Plan_startDate || null, Plan_endDate || null, Plan_color || null, Plan_app_Acronym])
    return res.json({ error: null, response: "Plan created successfully" })
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Plan name already exists." })
    } else {
      console.error("Error executing the query:", err)
      return res.status(500).json({ error: "Internal server error" })
    }
  }
})

/*------------------------Get all plans--------------------------------------- */
app.post("/getplans", checkUserEnabled, async (req, res) => {
  const { app_Acronym } = req.body
  if (!app_Acronym) {
    return res.status(400).json({ error: "App Acronym must be provided" })
  }
  try {
    const [rows] = await pool.execute("SELECT * FROM plan WHERE Plan_app_Acronym = ?", [app_Acronym])
    return res.json({ error: null, response: rows })
  } catch (err) {
    console.error("Error executing the query:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

/*------------------------Edit plan--------------------------------------- */
app.post("/editplan", checkUserEnabled, async (req, res) => {
  console.log("Received request body:", req.body)
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  const username = await verifyUser(token)
  if (!username) {
    return res.json({ error: "Invalid token" })
  }

  const isPM = await checkgroup(username, "PM")
  if (!isPM) {
    return res.status(403).json({ error: "You don't have the necessary permissions to perform this action" })
  }

  const { Plan_MVP_Name, Plan_startDate, Plan_endDate, Plan_color } = req.body

  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  if (!colorRegex.test(Plan_color)) {
    return res.status(400).json({ error: "Invalid color format." })
  }

  if (!Plan_MVP_Name) {
    return res.status(400).json({ error: "Plan name does not exist" })
  }

  try {
    console.log("Received color:", Plan_color)

    await pool.execute("UPDATE Plan SET Plan_startDate = ?, Plan_endDate = ?, Plan_color = ? WHERE Plan_MVP_Name = ?", [Plan_startDate, Plan_endDate, Plan_color, Plan_MVP_Name])

    return res.json({ error: null, response: "Plan details updated successfully" })
  } catch (err) {
    console.error("Error executing the query:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

/*------------------------------------Create Task-------------------------------- */
app.post("/createtask", checkUserEnabled, async (req, res) => {
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  const username = await verifyUser(token)
  if (!username) {
    return res.json({ error: "Invalid token" })
  }

  const { Task_name, Task_description, Task_plan, App_Acronym } = req.body

  const [appRows] = await pool.execute("SELECT App_permit_create FROM application WHERE App_Acronym = ?", [App_Acronym])
  if (appRows.length === 0) {
    return res.status(400).json({ error: "Invalid App Acronym" })
  }
  const permittedGroup = appRows[0].App_permit_create
  const isPermittedToCreate = await checkgroup(username, permittedGroup)

  if (!isPermittedToCreate) {
    return res.status(403).json({ error: "You don't have the necessary permissions to create a task for this application." })
  }

  if (!Task_name || !App_Acronym) {
    return res.status(400).json({ error: "Task name and App Acronym are required." })
  }

  const initialNote = {
    username: username,
    state: "Open",
    timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),
    note: "Task created"
  }
  const Task_notes_serialized = JSON.stringify([initialNote])

  try {
    let [rows] = await pool.execute("SELECT App_Rnumber FROM application WHERE App_Acronym = ?", [App_Acronym])

    if (rows.length === 0) {
      return res.status(400).json({ error: "App Acronym not found." })
    }

    let App_Rnumber = rows[0].App_Rnumber

    if (Task_plan) {
      const [planRows] = await pool.execute("SELECT Plan_MVP_name FROM plan WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?", [Task_plan, App_Acronym])
      if (planRows.length === 0) {
        return res.status(400).json({ error: "Invalid Task Plan or Task Plan doesn't belong to the specified application." })
      }
    }
    const validatedTaskPlan = Task_plan || null

    App_Rnumber += 1
    const Task_id = `${App_Acronym}_${App_Rnumber}`

    const Task_state = "Open"
    const Task_creator = username
    const Task_owner = username
    const Task_createDate = new Date().toISOString().slice(0, 19).replace("T", " ")

    await pool.execute("INSERT INTO Task (Task_name, Task_description, Task_notes, Task_plan, Task_app_Acronym, Task_state, Task_creator, Task_owner, Task_createDate, Task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [Task_name, Task_description || null, Task_notes_serialized || null, validatedTaskPlan, App_Acronym, Task_state, Task_creator, Task_owner, Task_createDate, Task_id])

    // Now, update the incremented App_Rnumber in the Application table
    await pool.execute("UPDATE Application SET App_Rnumber = ? WHERE App_Acronym = ?", [App_Rnumber, App_Acronym])

    return res.json({ error: null, response: "Task created successfully" })
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      // This error code is for duplicate entry
      return res.status(400).json({ error: "Task name already in use within system." })
    } else {
      console.error("Error executing the query:", err)
      return res.status(500).json({ error: "Internal server error" })
    }
  }
})

/*-----------------------------------Get all tasks------------------------------ */
app.post("/gettasks", checkUserEnabled, async (req, res) => {
  const { app_Acronym } = req.body
  if (!app_Acronym) {
    return res.status(400).json({ error: "App Acronym must be provided" })
  }
  try {
    const query = `
    SELECT Task.*, Plan.Plan_color 
    FROM Task 
    LEFT JOIN Plan ON Task.Task_plan = Plan.Plan_MVP_Name 
    WHERE Task.Task_app_Acronym = ?
  `
    const [rows] = await pool.execute(query, [app_Acronym])
    return res.json({ error: null, response: rows })
  } catch (err) {
    console.error("Error executing the query:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

/*-----------------------------------Edit Task--------------------------------- */
app.post("/edittask", checkUserEnabled, async (req, res) => {
  const token = req.body.token
  if (!token) {
    return res.status(400).json({ error: "Token must be provided" })
  }

  const username = await verifyUser(token)
  if (!username) {
    return res.json({ error: "Invalid token" })
  }

  const { Task_name, Task_plan, Task_owner, Task_notes } = req.body

  if (!Task_name) {
    return res.status(400).json({ error: "Task name must be provided" })
  }

  try {
    if (Task_plan) {
      const [planRows] = await pool.execute("SELECT Plan_MVP_Name FROM plan WHERE Plan_MVP_Name = ? AND Plan_app_Acronym = (SELECT Task_app_Acronym FROM task WHERE Task_name = ?)", [Task_plan, Task_name])
      if (planRows.length === 0) {
        return res.status(400).json({ error: "Provided Plan does not match the application acronym for this task." })
      }
    }

    // Fetch the current task's notes from the database
    const [taskRows] = await pool.execute("SELECT Task_notes, Task_state, Task_app_Acronym, Task_plan, Task_owner FROM task WHERE Task_name = ?", [Task_name])
    const [appRows] = await pool.execute("SELECT App_permit_" + taskRows[0].Task_state + " FROM application WHERE App_Acronym = ?", [taskRows[0].Task_app_Acronym])
    const permittedGroup = appRows[0]["App_permit_" + taskRows[0].Task_state]
    const isPermittedToEdit = await checkgroup(username, permittedGroup)
    if (!isPermittedToEdit) {
      return res.status(403).json({ error: "You don't have the necessary permissions to edit a task in this state." })
    }

    const currentTask = taskRows[0]
    let updatedNotes = currentTask.Task_notes ? JSON.parse(currentTask.Task_notes) : []
    const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ")

    // Add the new note as an object to the existing notes
    updatedNotes.unshift({
      user: username,
      state: currentTask.Task_state,
      date: currentDate,
      note: `New Task Plan: "${Task_plan}". New Task Owner: "${username}".` + (Task_notes ? ` Additional Notes: ${Task_notes}` : "")
    })

    await pool.execute("UPDATE Task SET Task_plan = ?, Task_owner = ?, Task_notes = ? WHERE Task_name = ?", [Task_plan || null, username, JSON.stringify(updatedNotes), Task_name])

    return res.json({ error: null, response: "Task updated successfully" })
  } catch (err) {
    console.error("Error executing the query:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

/*-----------------------------------Change task state--------------------------------- */
app.post("/changeTaskState", checkUserEnabled, async (req, res) => {
  const token = req.body.token
  const taskName = req.body.taskName
  const newState = req.body.newState
  const note = req.body.taskNote // Sending note along with the state change request
  const taskPlan = req.body.Task_plan || null // Check if Task_plan is sent in the request

  if (!token || !taskName || !newState) {
    return res.status(400).json({ error: "Token, task name, and new state must be provided" })
  }

  const username = await verifyUser(token)
  if (!username) {
    return res.json({ error: "Invalid token" })
  }

  try {
    // Fetch the task details from the database
    const [taskRows] = await pool.execute("SELECT Task_state, Task_app_Acronym, Task_notes FROM task WHERE Task_name = ?", [taskName])
    const currentTaskState = taskRows[0].Task_state
    const taskAppAcronym = taskRows[0].Task_app_Acronym

    const transitions = {
      Open: ["toDoList"],
      toDoList: ["Doing"],
      Doing: ["Done", "toDoList"],
      Done: ["Closed", "Doing"]
    }
    console.log("newState: ", newState)

    // 1. Check transitioning for group
    if (!transitions[currentTaskState].includes(newState)) {
      return res.status(400).json({ error: `Cannot transition from ${currentTaskState} to ${newState}` })
    }

    // 2. Check which group got permit
    const [appRows] = await pool.execute("SELECT App_permit_" + currentTaskState + " FROM application WHERE App_Acronym = ?", [taskAppAcronym])
    const currentPermit = appRows[0]["App_permit_" + currentTaskState]

    // 3. Check if the user belongs to the fetched group
    const [userRows] = await pool.execute("SELECT usergroups FROM user WHERE username = ?", [username])
    const userGroups = userRows[0].usergroups || ""

    if (!userGroups.split(",").includes(currentPermit)) {
      return res.status(403).json({ error: "User does not have permission to change FROM this state." })
    }

    async function sendEmailInBackground(email, transporter, mailOptions) {
      try {
        await transporter.sendMail(mailOptions)
        console.log(`Email sent to ${email}`)
      } catch (err) {
        console.error(`Failed to send email to ${email}`)
      }
    }
    if (newState === "Done") {
      const [appRows] = await pool.execute("SELECT App_permit_Done FROM application WHERE App_Acronym = ?", [taskAppAcronym]) // Fetch the permitted groups for the "Done" state of the application.
      const permittedGroup = appRows[0].App_permit_Done
      const [userRows] = await pool.execute("SELECT email FROM user WHERE usergroups LIKE ?", [`%,${permittedGroup},%`]) // Fetch associated emails for the fetched group.
      const userEmails = userRows.map((row) => row.email)

      userEmails.forEach((email) => {
        const mailOptions = {
          from: "ck'sfav@godacc.com",
          to: email,
          subject: "Task State Change",
          text: `A task has changed state to "Done".`
        }
        sendEmailInBackground(email, transporter, mailOptions) // Send the email in the background without awaiting
      })
    }

    const currentNotes = taskRows[0].Task_notes ? JSON.parse(taskRows[0].Task_notes) : []
    console.log(note)

    // Create the log message
    const currentDate = new Date().toISOString().slice(0, 19).replace("T", " ")
    const logObject = {
      username: username,
      state: newState,
      timestamp: currentDate,
      note: `State changed: ${currentTaskState} -> ${newState} | Task Plan: ${taskPlan ? `${taskPlan}` : ""} | New Task Owner: ${username}${note ? ` | Note: ${note}` : ""}`
    }
    currentNotes.unshift(logObject)

    // Update task state
    await pool.execute("UPDATE Task SET Task_state = ?, Task_notes = ?, Task_owner = ?, Task_plan = ? WHERE Task_name = ?", [newState, JSON.stringify(currentNotes), username, taskPlan, taskName])
    return res.json({ error: null, response: `Task state changed to ${newState} successfully.` })
  } catch (err) {
    console.error("Error executing the query:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
})

/*--------------------------------Nodemailer-------------------------- */
var transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "b81274af1225c2",
    pass: "6cb5738b73d155"
  }
})

/*-----------------------------------App.listen--------------------------------- */
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`)
})
