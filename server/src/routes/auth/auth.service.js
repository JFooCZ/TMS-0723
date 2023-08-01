const bcrypt = require('bcryptjs')
const authRepository = require('./auth.respository')
const jwtService = require('./jwt.service')

const login = async (username, password) => {
  const result = await authRepository.findUser(username)
  let user = result[0]
  console.log(user)
  if (!user || user?.userstatus === 0) {
    return { success: false }
  }

  // let isAdmin = results[0].usergroups.includes("admin") // Assuming usergroups is a string with group names
  // console.log(user.password)
  // console.log(password)
  // // const isValidPassword = bcrypt.compareSync(user.password, password)
  // console.log(isValidPassword)
  // if (!isValidPassword) {
  //   return { success: false }
  // }

  const token = jwtService.getToken(username)

  return { success: true, data: { token, usergroup: user.usergroup } }
}

module.exports = { login }
