const jwt = require('jsonwebtoken')

const getToken = () => {
  return jwt.sign({ user: user }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_TIME,
  })
}

module.exports = { getToken }
