const express = require('express')
const authService = require('./auth.service')
const authorise = require('../../middleware/authorise')
const Role = require('../../types/userRole')

const router = express.Router()

router.post('/login', authorise(Role.Admin), async (req, res) => {
  console.log(req.body)
  const { username, password } = req.body

  // TODO: Probably can use a validation library for this and regex
  if (!username || !password) {
    return res.status(400).json({ error: 'Username or password is missing' })
  }

  const usernameRegex = /^[a-zA-Z0-9 ]{1,200}$/
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Username is alphanumeric' })
  }

  const result = await authService.login(username, password)
  if (!result.success) {
    return res
      .status(401)
      .json({ error: 'Username and/or password is incorrect' })
  }

  // Store the username in the session
  // req.session.isLoggedIn = true
  // req.session.username = username
  res.status(201).json(result.data)
})

module.exports = router
