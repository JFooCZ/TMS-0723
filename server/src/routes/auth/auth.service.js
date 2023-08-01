const bcrypt = require('bcryptjs')
const authRepository = require('./auth.respository')
const jwtService = require('./jwt.service')

const login = async (username, password) => {
  const result = await authRepository.findUser(username)
  let user = result[0]

  if (!user || user?.userstatus === 0) {
    return { success: false }
  }

  // let isAdmin = results[0].usergroups.includes("admin") // Assuming usergroups is a string with group names

  const isValidPassword = bcrypt.compareSync(user.password, password)
  if (!isValidPassword) {
    return { success: false }
  }

  const token = jwtService.getToken(username)

  return { success: true, data: { token, usergroup: user.usergroup } }
}

module.exports = { login }
