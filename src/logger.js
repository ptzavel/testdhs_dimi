const winston = require('winston')
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, label, prettyPrint, printf, colorize, align } = format
const moment = require('moment')

const logLevels = {
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		db: 4,
		astm_out: 5,
		astm_in: 6,
		debug: 6
	},
	colors: {
		error: 'red',
		warn: 'red',
		info: 'blue',
		http: 'yellow',
		db: 'green',
		astm_out: 'magenta',
		astm_in: 'cyan',
		debug: 'gray'
	}
}

var logger = {}

//logging in global object
const tsFormat = () => moment().format('YYYY-MM-DD hh:mm:ss:ms').trim()
const myFormat = printf((info) => {
	return `DEME ADMIN SERVER (API) [${tsFormat()} ${info.label}] ${info.level}: ${info.message}`
})
const LogFile = process.cwd() + process.env.APPLICATION_LOGDIR + moment().format('-YYYY-MM-DD__hh.mm.ss__ms') + '.log'

logger.init = function () {
	winston.addColors(logLevels.colors)

	let customLogger = winston.createLogger({
		level: 'debug',
		levels: logLevels.levels,
		format: combine(colorize(), label({ label: 'Server' }), myFormat, align()),
		transports: [
			new winston.transports.File({
				json: false,
				filename: LogFile,
				maxsize: 1024 * 1000 * 100,
				maxFiles: 3,
				colorize: false,
				order: 'desc'
			}),
			new winston.transports.Console({
				json: false,
				colorize: true
			})
		]
	})

	return customLogger
}

module.exports = logger
