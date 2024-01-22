/*
status code:                       JSON:
  200 OK ...                       διαφορα data, ακομη και κενη απαντηση
  500 Internal server error        { error: 'Internal error occured' } οταν συμβει καποιο error στο server και γινει catch απο error handler
  400 Bad Request                  { error: 'Bad Request' } οταν δεν εχω όλα τα απαρραιτητα data για την κληση η δεν ειναι σωστα (πχ κενο password) (προς υλοποιηση)
  401 Unauthorized                 { error: 'Unauthorized'} οταν δεν εχει jwt token στο Authentication header η κληση, ενω θα επρεπε να εχει
  403 Forbidden                    { error: 'Forbidden' } οταν η κληση εχει ληγμενο/παρανομο JWT
  404 Not Found                    { error: 'Not Found' } μονο οταν πάει να κανει
   με χρηστη που δεν υπαρχει (προς υλοποιηση)
                                                          οταν ζητησει οτηδηποτε άλλο και δεν το βρει, τοτε status 200
  Συνιστω να ελεγχεις πρωτα τον status code και αναλογα να βγαλεις δικο σου μηνυμα όπου χρειαζεται
  */

'use strict'
const axios = require('axios')
const multer = require('multer')
const path = require('path')
const DB = require('./db')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploaded/')
  },
  filename: function (req, file, cb) {
    cb(null, req.body.fileName + path.extname(file.originalname)) //Appending .jpg
  },
})

const upload = multer({ storage: storage })

const express = require('express')
const appRoutes = express.Router()
const jwt = require('jsonwebtoken')
const db = new DB()
//const email = require('../email')

function formatDate(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

function formatDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${process.env.SERVER_NAME}:${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  //Bearer Token
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) {
    return res.status(401).json({ success: false, reason: 'Unauthorized!!' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err?.name === 'TokenExpiredError') {
        return res.status(403).json({ success: false, reason: 'Token Expired' })
      } else {
        return res.status(403).json({ success: false, reason: 'Forbidden' })
      }
    }
    req.user = user
    next()
  })
}




appRoutes.get('/test', authenticateToken, async (req, res, next) => {
  return res.status(200).json({ result: 'OK', user: req.user })
})

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_Vitals_GetVitalsSimple
//----------------------------------------------------------------------------------
appRoutes.get('/vitalsGetVitalsSimple', authenticateToken, async (req, res, next) => {
  /*
    #swagger.tags = ['Vitals']
    #swagger.summary = 'Get vitals for a specific type and date range for a person.'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['actorRoleKey'] = {
        in: 'query',
        description: 'The actorRoleKey of the person for whom to retrieve the vitals.',
        required: true,
        type: 'string',
        example: 'D39CE475-7DBC-48A3-9087-65BF86459901'
      },

    #swagger.parameters['vitalTypeId'] = {
        in: 'query',
        description: 'The ID of the type of vital to retrieve.',
        required: true,
        type: 'integer'
      },

    #swagger.parameters['from'] = {
        in: 'query',
        description: 'The start date of the range to retrieve the vitals for.',
        required: true,
        type: 'string'
      },
    #swagger.parameters['to'] = {
        in: 'query',
        description: 'The end date of the range to retrieve the vitals for.',
        required: true,
        type: 'string'
      }
    }
  */
  console.log(
    formatDateTime(new Date()),
    '/vitalsGetVitalsSimple',
    req.query?.actorRoleKey,
    req.query?.vitalTypeId,
    req.query?.from,
    req.query?.to
  )
  try {
    const actorRoleKey = req.query?.actorRoleKey || null
    const vitalTypeId = req.query?.vitalTypeId || null
    const from = req.query?.from || null
    const to = req.query?.to || null
    if (!actorRoleKey) {
      return res.status(400).json({ success: false, reason: 'Actor role key must be non empty.' })
    }
    if (!vitalTypeId) {
      return res.status(400).json({ success: false, reason: 'VitalTypeId must have a value.' })
    }
    if (!from) {
      return res.status(400).json({ success: false, reason: 'from must have a value.' })
    }
    if (!to) {
      return res.status(400).json({ success: false, reason: 'to must have a value.' })
    }

    let vitalsGetVitalsSimpleData = null
    //vitalsGetVitalsSimpleData = await db.vitalsGetVitalsSimple({ actorRoleKey, vitalTypeId, from, to })

    return res.status(200).json(vitalsGetVitalsSimpleData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

module.exports = appRoutes
