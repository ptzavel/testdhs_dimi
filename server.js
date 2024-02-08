//  C:\Users\user\Downloads\ngrok-stable-windows-amd64
//  ngrok.exe http -subdomain=swebhooks 19121
'use strict'
const { Transform } = require('stream')
const fallback = require('express-history-api-fallback')
const express = require('express')
const favicon = require('serve-favicon')
const cors = require('cors')
const bodyParser = require('body-parser')
const mustacheExpress = require('mustache-express')
const path = require('path')
const moment = require('moment')
const passport = require('passport')
const OAuth2Strategy = require('passport-oauth2')
var session = require('express-session')
const convert = require('xml-js')
const appRoutes = require('./src/appRoutes')
const jwt = require('jsonwebtoken')
const { engine } = require('express-handlebars')
const FormData = require('form-data')
const fs = require('fs')
const { Server } = require('socket.io')
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('../swagger-output.json')

global.irisApiKey = null
global.recipientId = null

const GSIS_AUTH_URL = 'https://test.gsis.gr/oauth2server/oauth/authorize'
const GSIS_TOKEN_URL = 'https://test.gsis.gr/oauth2server/oauth/token'
const IRIS_UPLOAD_URL = 'https://test.iridacloud.gov.gr/iris/api/v1/document'
const IRIS_UPLOAD_CONTENT_BOUNDARY = '----eaf02609-1dbb-46b2-a408-69a90a0d409e'
const IRIS_INBOX_URL = 'https://test.iridacloud.gov.gr/iris/api/v1/inbox'
const IRIS_RECIPIENTS_URL = 'https://test.iridacloud.gov.gr/iris/api/v1/recipients'
const IRIS_TOKEN_URL = 'https://test.iridacloud.gov.gr/iris/api/v1/token'

//server object
const root = path.join(__dirname, 'public')
const server = { http: null, app: null, router: null, init: null }
let io

server.http = null
server.app = express()

passport.initialize

server.init = function (logger) {
  server.app.use(cors({ origin: true, credentials: true }))
  server.app.engine('handlebars', engine())
  server.app.set('view engine', 'handlebars')
  server.app.set('views', `${__dirname}/views`)

  //********************************************************* */
  // UPLOAD DOCUMENT(S) TO IRIS
  //********************************************************* */
  server.app.post('/uploadDocumentToIris', async (req, res) => {
    const apiUrl = IRIS_UPLOAD_URL // Replace with your API endpoint

    const pathToPdf1 = path.join(__dirname, 'public', 'iris', 'test.pdf')
    const pathToPdf2 = path.join(__dirname, 'public', 'iris', 'test2.pdf')
    const pathToPdf3 = path.join(__dirname, 'public', 'iris', 'test3.pdf')

    const form = new FormData()
    form._boundary = IRIS_UPLOAD_CONTENT_BOUNDARY // Manually setting the boundary
    form.append('subject', 'Δοκιμαστικό Έγγραφο with sender απο server')
    form.append('registrationNumber', '1200')
    form.append('recipients', '5afd5b3b1e649f35bc10fa3b')
    form.append('sender', 'TEST_SENDER_NUMBER_999')
    form.append('file', fs.createReadStream(pathToPdf1), 'test.pdf')
    form.append('file', fs.createReadStream(pathToPdf2), 'test2.pdf')
    form.append('file', fs.createReadStream(pathToPdf3), 'test3.pdf')

    //SOS!!! formdata needs transform to work properly!!!!
    // otherwise error NodeJS fetch failed (object2 is not iterable) when uploading file via POST request
    // https://stackoverflow.com/questions/72568850/nodejs-fetch-failed-object2-is-not-iterable-when-uploading-file-via-post-reque
    const tr = new Transform({
      transform(chunk, encoding, callback) {
        callback(null, chunk)
      },
    })
    form.pipe(tr)

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${global.irisApiKey}`,
        'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
      },
      duplex: 'half', // sos  duplex option is required when sending a body https://github.com/nodejs/node/issues/46221
      body: tr,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('uploadDocumentToIris data=', data)
        res.json(data)
      })
      .catch((error) => {
        console.log('uploadDocumentToIris error', error)
        res.status(500).json({ error: 'uploadDocumentToIris ' + error.message })
      })
  })

  //********************************************************* */
  //GET DOCUMENT FILES FROM IRIS
  //********************************************************* */
  server.app.get('/getDocumentFiles/:docId/:fileId', (req, res) => {
    let docId = req.params.docId
    let fileId = req.params.fileId
    fetch(`https://test.iridacloud.gov.gr/iris/api/v1/document/${docId}/file/${fileId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${global.irisApiKey}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        console.error('There was an error:', error.message)
      })
  })

  //********************************************************* */
  //GET DOCUMENT DETAILS FROM IRIS
  //********************************************************* */
  server.app.get('/getDocumentDetails/:docId', (req, res) => {
    let docId = req.params.docId
    fetch(`https://test.iridacloud.gov.gr/iris/api/v1/document/${docId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${global.irisApiKey}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        console.error('There was an error:', error.message)
      })
  })

  //********************************************************* */
  //GET INBOX FROM IRIS
  //********************************************************* */
  server.app.get('/getIrisInbox', (req, res) => {
    fetch(IRIS_INBOX_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${global.irisApiKey}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        res.json(data)
      })
      .catch((error) => {
        console.error('There was an error:', error.message)
      })
  })

  //********************************************************* */
  //GET RECIPIENTS FROM IRIS
  //********************************************************* */
  server.app.get('/getIrisRecipients', (req, res) => {
    fetch(IRIS_RECIPIENTS_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${global.irisApiKey}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        let filtered = data.filter((item) => {
          return item.Description.includes('ΠΕΥΚΗ')
        })

        global.recipientId = filtered[0].Id
        console.log('global.recipientId:', global.recipientId)
        res.json(filtered[0])
      })
      .catch((error) => {
        console.error('There was an error:', error.message)
      })
  })

  //********************************************************* */
  //GET IRIS TOKEN
  //********************************************************* */
  server.app.post('/getIrisToken', (req, res) => {
    const apiUrl = IRIS_TOKEN_URL // Replace with your API endpoint

    var details = {
      username: process.env.IRIS_USERNAME,
      password: process.env.IRIS_PASSWORD,
    }

    var formBody = []
    for (var property in details) {
      var encodedKey = encodeURIComponent(property)
      var encodedValue = encodeURIComponent(details[property])
      formBody.push(encodedKey + '=' + encodedValue)
    }
    formBody = formBody.join('&')

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    })
      .then((apiResponse) => apiResponse.text())
      .then((apiData) => {
        console.log('apiData=', apiData)
        global.irisApiKey = apiData
        res.json({ key: apiData })
      })
      .catch((error) => {
        res.status(500).json({ error: error.message })
      })
  })

  //********************************************************* */
  //INITIALIZE PASSPORT
  //********************************************************* */

  server.app.use(
    session({
      secret: '291fc1a4-d17b-4db0-94f7-099e020ab72f',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: true },
    })
  )
  server.app.use(passport.initialize())
  server.app.use(passport.session())
  passport.use(
    new OAuth2Strategy(
      {
        authorizationURL: GSIS_AUTH_URL,
        tokenURL: GSIS_TOKEN_URL,
        clientID: process.env.GSIS_CLIENT_ID,
        clientSecret: process.env.GSIS_CLIENT_SECRET,
        callbackURL: process.env.GSIS_CALLBACK_URL,
      },
      function (accessToken, refreshToken, profile, cb) {
        console.log('---------accessToken===', accessToken)
      }
    )
  )

  //********************************************************* */
  //FIRST STEP OF THE OAuth2 FLOW (gsis.gr) REDIRECT HERE TO LOGIN
  //********************************************************* */
  server.app.get('/auth', passport.authenticate('oauth2'))

  //********************************************************* */
  // LOGOUT FROM GSIS
  //********************************************************* */
  server.app.get('/logout', function (req, res) {
    res.redirect(process.env.GSIS_LOGOUT_URL)
  })

  //********************************************************* */
  //
  //********************************************************* */
  // server.app.get(
  //   '/callback',
  //   passport.authenticate('oauth2', { failureRedirect: '/login' }),
  //   function (req, res) {
  //     console.log('callback called!!!')
  //     console.log('authenticated !!!')
  //     // Successful authentication, redirect home.
  //     res.redirect('/')
  //   }
  // )

  //********************************************************* */
  // ENRTYPOINT FOR THE OAuth2 FLOW (gsis.gr) (STEP 2,3)
  //********************************************************* */
  server.app.get('/', async (req, res) => {
    const code = req.query.code

    if (!code) {
      res.render('logout')
      return
    }

    const params = new URLSearchParams()
    params.append('client_id', process.env.GSIS_CLIENT_ID)
    params.append('client_secret', process.env.GSIS_CLIENT_SECRET)
    params.append('code', code)
    params.append('state', 'PEH5Nb_hpQnZpdzxdI20N')
    params.append('scope', 'read')
    params.append('grant_type', 'authorization_code')
    params.append('redirect_uri', process.env.GSIS_CALLBACK_URL)

    let user

    // outer fetch (step 2)
    fetch(GSIS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
      .then((response) => response.json())
      .then((tokenData) => {
        console.log(tokenData)
        const url = 'https://test.gsis.gr/oauth2server/userinfo?format=xml'
        const accessToken = tokenData.access_token // Replace with your actual access token
        // inner  fetch (step 3)
        fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
          .then((response) => response.text())
          .then((userInfoData) => {
            console.log('res=', userInfoData) // or response.xml() if you expect a direct XML response
            try {
              let jsonData = JSON.parse(convert.xml2json(userInfoData))
              user = jsonData.elements[0].elements[0].attributes
            } catch (e) {
              console.log('error user=null', e)
            }

            /*
              user= {
                  userid: 'User660074100   ',
                  taxid: '660074100   ',
                  lastname: 'ΧΑΛΚΕΟΝΙΔΗΣ ΠΑΠΑΔΟΠΟΥΛΟΣ',
                  firstname: 'ΕΥΣΤΡΑΤΙΟΣ',
                  fathername: 'ΠΑΤΡΟΚΛΟΣ',
                  mothername: 'ΜΥΡΣΙΝΗ',
                  birthyear: '1970'
              }
			      */

            console.log(' code:', code, ' access_token:', accessToken, 'user:', user)
            console.log('process.env.ACCESS_TOKEN_SECRET=', process.env.ACCESS_TOKEN_SECRET)
            const jwtAccesstoken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
              expiresIn: 6000,
            })

            console.log('jwtAccesstoken=', jwtAccesstoken)
            let isPerson = user.userid ? true : false
            res.render('login', {
              code: code,
              jwtAccesstoken: jwtAccesstoken,
              user: user,
              isPerson: isPerson,
            })
          })
          .then((data) => {
            console.log(data)
          })
          .catch((error) => {
            console.error('Error:', error)
          })
      })
      .catch((error) => {
        console.error('Error:', error)
        res.render('index', { code: code })
      })

  })

  server.app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }))

  server.app.use(bodyParser.json())
  server.app.use(express.static(root))
  server.app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))
  server.app.use('/api', appRoutes)
  server.app.use(fallback('index.html', { root: root }))
  server.app.use(favicon(path.join(__dirname, 'public', '/img/favicon.ico')))
  //********************************************************* */
  // SEND TOKEN TO CLIENT
  //********************************************************* */
  server.app.post('/sendToken', (req, res) => {
    const socket_id = req?.body?.socket_id
    const jwtAccesstoken = req?.body?.jwtAccesstoken

    if (socket_id) {
      let thisSocket = io.sockets.sockets.get(socket_id)
      if (thisSocket) {
        thisSocket.emit('tokenEvent', jwtAccesstoken)
        res.status(200).json({ status: 'OK' })
      } else {
        res.status(400).json({ error: 'socket not found' })
      }
    } else {
      res.status(400).json({ error: 'socket_id is null' })
    }
  })

  let PORT = null
  let openingMsg = ''

  //decide http or https

  PORT = process.env.HTTPS_PORT

  server.http = require('http').Server(server.app)
  openingMsg = `HTTPS Server Listening on ${PORT}`

  //********************************************************* */
  // INITIALIZE SOCKET.IO
  //********************************************************* */
  io = new Server(server.http, {
    transports: ['websocket'],
    cors: {
      origin: '*',
    },
  })

  io.on('connection', (socket) => {
    console.log('ws user connected socket.id=', socket.id)

    socket.on('disconnect', () => {
      console.log('ws user disconnected socket.id=', socket.id)
    })
  })

  //start server
  server.http.listen(PORT, '0.0.0.0', function () {
    logger.info(`Running on port ${PORT}`)
  })
}

module.exports = server
