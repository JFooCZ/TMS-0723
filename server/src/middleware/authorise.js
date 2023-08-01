const jwtService = require('../routes/auth/jwt.service')

function authorize(roles = []) {
  // roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  if (typeof roles === 'string') {
    roles = [roles]
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    // TODO: refactor message
    res.sendStatus(401).json('missing auth header')
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    // TODO: refactor message
    res.sendStatus(401).json('token is missing')
  }

  const payload = jwtService.verifyToken(token)
  console.log(payload)
  req.user = payload
  if (roles.length && !roles.includes(req.user.role)) {
    // user's role is not authorized
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}

module.exports = authorize
