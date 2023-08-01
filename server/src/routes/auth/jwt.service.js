const jwt = require('jsonwebtoken')
//todo: refactor secret to env variable
const getToken = (username) => {
  return jwt.sign({ user: username }, 'njaksndandnsd', {
    expiresIn: 20000,
  })
}

module.exports = { getToken }
