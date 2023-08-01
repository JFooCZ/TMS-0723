const jwt = require('jsonwebtoken')

//todo: refactor secret to env variable
const getToken = (username, usergroups) => {
  return jwt.sign({ user: username, role: usergroups }, 'njaksndandnsd', {
    expiresIn: 20000,
  })
}

const verifyToken = (token) => {
  return jwt.verify(token, 'njaksndandnsd')
}

module.exports = { getToken, verifyToken }
