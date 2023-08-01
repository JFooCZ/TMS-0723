const pool = require('../../sql')

const findUser = async (username) => {
  const [results] = await pool.execute(
    'SELECT * FROM user WHERE username = ?',
    [username]
  )
  return results
}

module.exports = { findUser }
