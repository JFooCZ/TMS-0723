const cors = require('cors')

const options = {
  origin: 'http://localhost:3000',
}

corsWithOptions = cors(options)

module.exports = corsWithOptions
