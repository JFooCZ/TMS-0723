const express = require('express')
const corsWithOptions = require('./middleware/cors')
const authRoute = require('./routes/auth/auth.controller')

const app = express()

app.use(corsWithOptions)
app.use(express.json())

// Routes
app.use('/auth', authRoute)

// TODO: refactor to env var
const port = 8000

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`)
})
