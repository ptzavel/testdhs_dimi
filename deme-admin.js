//  C:\Users\user\Downloads\ngrok-stable-windows-amd64
//  ngrok.exe http -subdomain=swebhooks 19121
// require('dotenv').config()
// const customLogger = require('./src/logger')
// const server = require('./server')
// //const db = require('./src/db')
// const { to } = require('./src/utils')

require('dotenv').config()
const customLogger = require('./src/logger.js')
const server = require('./server')
//const db = require('./src/db')
const { to } = require('./src/utils')


var program = {}

global.logger = customLogger.init()
program.logger = global.logger
program.server = server


program.startServer = (logger, callback) => {
  program.server.init(logger)
  callback()
}

program.startServer(program.logger, () => { global.logger.info('server started') })
//start server



