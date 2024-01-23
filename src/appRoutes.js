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
  /*
    #/api/test
    #swagger.tags = ['HEARTBEAT']
    #swagger.summary = 'Heartbeat .'
    #swagger.security = [{"Bearer": []}]
  */

  return res.status(200).json({ result: 'OK', user: req.user })
})

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_GetAllFormsForCitizenAndDeme
//----------------------------------------------------------------------------------
appRoutes.get('/getAllFormsForCitizenAndDeme', authenticateToken, async (req, res, next) => {
  /*
    #/api/getAllFormsForCitizenAndDeme
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Επιστρέφει headers και πληροφορίες γιά όλες τις φόρμες ενός πολίτη σε ενα Δήμο .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['citizenAA'] = {
        in: 'query',
        description: 'Το id του πολίτη.',
        required: true,
        type: 'integer',
        example: '1'
      },
    #swagger.parameters['demeAA'] = {
        in: 'query',
        description: 'Το id του Δήμου.',
        required: true,
        type: 'integer',
        example: '1'
      },

    }
  */
  console.log(
    formatDateTime(new Date()),
    ': /getAllFormsForCitizenAndDeme',
    'citizenAA=',
    req.query?.citizenAA,
    'demeAA=',
    req.query?.demeAA
  )
  try {
    const citizenAA = req.query?.citizenAA || 0
    const demeAA = req.query?.demeAA || 0
    if (!citizenAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, citizenAA must have a value.' })
    }
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }

    const getAllFormsForCitizenAndDemeData = await db.getAllFormsForCitizenAndDeme({
      citizenAA,
      demeAA,
    })

    return res.status(200).json(getAllFormsForCitizenAndDemeData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_App03_GeneralApplication_Get
//----------------------------------------------------------------------------------
appRoutes.get('/app03GeneralApplicationGet', authenticateToken, async (req, res, next) => {
  /*
    #/api/app03GeneralApplicationGet
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Επιστρέφει λεπτομερειες μιας επιλεγμενης φορμας Γενική Αίτηση .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['applicationAA'] = {
        in: 'query',
        description: 'Το id της φόρμας.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }
  */
  console.log(
    formatDateTime(new Date()),
    ': /app03GeneralApplicationGet',
    'applicationAA=',
    req.query?.applicationAA
  )
  try {
    const applicationAA = req.query?.applicationAA || 0
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }

    const app03GeneralApplicationGetData = await db.app03GeneralApplicationGet({ applicationAA })

    return res.status(200).json(app03GeneralApplicationGetData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_App03_GeneralApplication_AttachmentsGet
//----------------------------------------------------------------------------------
appRoutes.get(
  '/app03GeneralApplicationAttachmentsGet',
  authenticateToken,
  async (req, res, next) => {
    /*
    #/api/app03GeneralApplicationAttachmentsGet
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Επιστρέφει πληροφορίες για τα συνημμενα μιας φορμας Γενική Αίτηση .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['applicationAA'] = {
        in: 'query',
        description: 'Το id της φόρμας.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }
  */
    console.log(
      formatDateTime(new Date()),
      ': /app03GeneralApplicationAttachmentsGet',
      'applicationAA=',
      req.query?.applicationAA
    )
    try {
      const applicationAA = req.query?.applicationAA || 0
      if (!applicationAA) {
        return res
          .status(400)
          .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
      }

      const app03GeneralApplicationAttachmentsGetData =
        await db.app03GeneralApplicationAttachmentsGet({ applicationAA })

      return res.status(200).json(app03GeneralApplicationAttachmentsGetData)
    } catch (err) {
      global.logger.error(err)
      return res.status(500).json({ success: false, reason: 'Internal Error' })
    }
  }
)

//----------------------------------------------------------------------------------
// Node.js POST Routes FOR SP pr_App03_GeneralApplication_AttachmentsInsert
//----------------------------------------------------------------------------------
appRoutes.post(
  '/app03GeneralApplicationAttachmentsInsert',
  authenticateToken,
  async (req, res, next) => {
    /*
    #/api/app03GeneralApplicationAttachmentsInsert
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Εισαγωγη συνημμενου για φορμα Γενική Αίτηση'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      description: 'Λεπτομέρειες Συνημμενου.',
      schema: {
        headeraAA: '1',
        attachmentType: 'ΑΛΛΟ ΅ΕΓΓΡΑΦΟ',
        attachmentFileName: 'test.pdf',
        attachment: '<base64 data>',
      }
    }
*/

    console.log(
      formatDateTime(new Date()),
      ': /app03GeneralApplicationAttachmentsInsert',
      'headeraAA =',
      req.body?.headeraAA,
      'attachmentType =',
      req.body?.attachmentType,
      'attachmentFileName =',
      req.body?.attachmentFileName,
      'attachment =',
      req.body?.attachment
    )
    try {
      const headeraAA = req.body?.headeraAA || null
      const attachmentType = req.body?.attachmentType || null
      const attachmentFileName = req.body?.attachmentFileName || null
      const attachment = req.body?.attachment || null
      if (!headeraAA) {
        return res
          .status(400)
          .json({ success: false, reason: 'Bad Request, headeraAA must have a value.' })
      }
      if (!attachmentType) {
        return res
          .status(400)
          .json({ success: false, reason: 'Bad Request, attachmentType must have a value.' })
      }
      if (!attachmentFileName) {
        return res
          .status(400)
          .json({ success: false, reason: 'Bad Request, attachmentFileName must have a value.' })
      }
      if (!attachment) {
        return res
          .status(400)
          .json({ success: false, reason: 'Bad Request, attachment must have a value.' })
      }

      const app03GeneralApplicationAttachmentsInsertData =
        await db.app03GeneralApplicationAttachmentsInsert({
          headeraAA,
          attachmentType,
          attachmentFileName,
          attachment,
        })

      return res.status(200).json(app03GeneralApplicationAttachmentsInsertData)
    } catch (err) {
      global.logger.error(err)
      return res.status(500).json({ success: false, reason: 'Internal Error' })
    }
  }
)

//----------------------------------------------------------------------------------
// Node.js POST Routes FOR SP pr_App03_GeneralApplication_Attachments_DeleteById
//----------------------------------------------------------------------------------
appRoutes.post(
  '/app03GeneralApplicationAttachmentsDeleteById',
  authenticateToken,
  async (req, res, next) => {
    /*
    #/api/app03GeneralApplicationAttachmentsDeleteById
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Διαγραφή συνημμενου για φορμα Γενική Αίτηση'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      description: 'Λεπτομέρειες Συνημμενου.',
      schema: {
        AA: '1',
      }
    }
*/

    console.log(
      formatDateTime(new Date()),
      ': /app03GeneralApplicationAttachmentsDeleteById',
      'AA =',
      req.body?.AA
    )
    try {
      const AA = req.body?.AA || null
      if (!AA) {
        return res
          .status(400)
          .json({ success: false, reason: 'Bad Request, AA must have a value.' })
      }

      const app03GeneralApplicationAttachmentsDeleteByIdData =
        await db.app03GeneralApplicationAttachmentsDeleteById({ AA })

      return res.status(200).json(app03GeneralApplicationAttachmentsDeleteByIdData)
    } catch (err) {
      global.logger.error(err)
      return res.status(500).json({ success: false, reason: 'Internal Error' })
    }
  }
)

//----------------------------------------------------------------------------------
// Node.js POST Routes FOR SP pr_App03_GeneralApplication_InsUpd
//----------------------------------------------------------------------------------
appRoutes.post('/app03GeneralApplicationInsUpd', authenticateToken, async (req, res, next) => {
  /*
    #/api/app03GeneralApplicationInsUpd
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Εισαγωγή/Ενημέρωση φορμας Γενική Αίτηση'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      description: 'Λεπτομέρειες Συνημμενου. Για νεα φορμα το applicationAA να ειναι -1, για ενημερωση να εχει την τιμη του Id της φορμας',
      schema: {
      applicationAA: '-1',
      demeAA: '1',
      surname: 'Τεστοπουλος',
      firstName: '',
      fatherName: '',
      vatNumber: '099999999',
      dob: '',
      idCardNo: '',
      address: '',
      taxAuthority: '',
      email: '',
      telephone: '',
      zip: '',
      recipient: '',
      subject: ''
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
    ': /app03GeneralApplicationInsUpd',
    'applicationAA =',
    req.body?.applicationAA,
    'demeAA =',
    req.body?.demeAA,
    'surname =',
    req.body?.surname,
    'firstName =',
    req.body?.firstName,
    'fatherName =',
    req.body?.fatherName,
    'vatNumber =',
    req.body?.vatNumber,
    'dob =',
    req.body?.dob,
    'idCardNo =',
    req.body?.idCardNo,
    'address =',
    req.body?.address,
    'taxAuthority =',
    req.body?.taxAuthority,
    'email =',
    req.body?.email,
    'telephone =',
    req.body?.telephone,
    'zip =',
    req.body?.zip,
    'recipient =',
    req.body?.recipient,
    'subject =',
    req.body?.subject
  )
  try {
    const applicationAA = req.body?.applicationAA || null
    const demeAA = req.body?.demeAA || null
    const surname = req.body?.surname || null
    const firstName = req.body?.firstName || null
    const fatherName = req.body?.fatherName || null
    const vatNumber = req.body?.vatNumber || null
    const dob = req.body?.dob || ''
    const idCardNo = req.body?.idCardNo || null
    const address = req.body?.address || null
    const taxAuthority = req.body?.taxAuthority || null
    const email = req.body?.email || null
    const telephone = req.body?.telephone || null
    const zip = req.body?.zip || null
    const recipient = req.body?.recipient || null
    const subject = req.body?.subject || null

    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, ApplicationAA must have a value.' })
    }
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, DemeAA must have a value.' })
    }
    if (!surname) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, surname must have a value.' })
    }
    if (!vatNumber) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, vatNumber must have a value.' })
    }

    const app03GeneralApplicationInsUpdData = await db.app03GeneralApplicationInsUpd({
      applicationAA,
      demeAA,
      surname,
      firstName,
      fatherName,
      vatNumber,
      dob,
      idCardNo,
      address,
      taxAuthority,
      email,
      telephone,
      zip,
      recipient,
      subject,
    })

    return res.status(200).json(app03GeneralApplicationInsUpdData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js POST Routes FOR SP pr_App03_GeneralApplication_Submit
//----------------------------------------------------------------------------------
appRoutes.post('/app03GeneralApplicationSubmit', authenticateToken, async (req, res, next) => {
  /*
    #/api/app03GeneralApplicationSubmit
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Υποβολή φορμας Γενική Αίτηση'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
      applicationAA: '1'
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
    ': /app03GeneralApplicationSubmit',
    'applicationAA =',
    req.body?.applicationAA
  )
  try {
    const applicationAA = req.body?.applicationAA || null
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }

    const app03GeneralApplicationSubmitData = await db.app03GeneralApplicationSubmit({
      applicationAA,
    })

    return res.status(200).json(app03GeneralApplicationSubmitData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})


//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_App03_GeneralApplication_IsReadyForSubmission
//----------------------------------------------------------------------------------
appRoutes.get(
  '/app03GeneralApplicationIsReadyForSubmission',
  authenticateToken,
  async (req, res, next) => {
    /*
    #/api/app03GeneralApplicationAttachmentsGet
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Επιστρέφει 1 αν η Γενικη Αιτηση ειναι ετοιμη για υποβολή, 0 αν οχι .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['applicationAA'] = {
        in: 'query',
        description: 'Το id της φόρμας.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }
  */
    console.log(
      formatDateTime(new Date()),
      ': /app03GeneralApplicationIsReadyForSubmission',
      'applicationAA=',
      req.query?.applicationAA
    )
    try {
      const applicationAA = req.query?.applicationAA || 0
      if (!applicationAA) {
        return res
          .status(400)
          .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
      }

      const app03GeneralApplicationIsReadyForSubmissionData =
        await db.app03GeneralApplicationIsReadyForSubmission({ applicationAA })

      return res.status(200).json(app03GeneralApplicationIsReadyForSubmissionData)
    } catch (err) {
      global.logger.error(err)
      return res.status(500).json({ success: false, reason: 'Internal Error' })
    }
  }
)

module.exports = appRoutes
