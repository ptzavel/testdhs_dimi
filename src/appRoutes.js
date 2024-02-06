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
const doReport = require('./report')
const { mkdirp } = require('mkdirp')
const fs = require('fs')
const { Transform } = require('stream')
const FormData = require('form-data')
const fs2 = require('fs').promises
const { rimraf, rimrafSync, native, nativeSync } = require('rimraf')
const atob = (base64) => Buffer.from(base64, 'base64').toString('binary')

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

const IRIS_UPLOAD_URL = 'https://test.iridacloud.gov.gr/iris/api/v1/document'
const IRIS_UPLOAD_CONTENT_BOUNDARY = '----eaf02609-1dbb-46b2-a408-69a90a0d409e'
const IRIS_INBOX_URL = 'https://test.iridacloud.gov.gr/iris/api/v1/inbox'
const IRIS_RECIPIENTS_URL = 'https://test.iridacloud.gov.gr/iris/api/v1/recipients'
const IRIS_TOKEN_URL = 'https://test.iridacloud.gov.gr/iris/api/v1/token'

let IRIS_API_KEY = null
let IRIS_RECIPIENT_ID = null

//***************************************************************************
// formatDateTime
//***************************************************************************
function formatDateTime(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${process.env.SERVER_NAME}:${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

//***************************************************************************
// authenticateToken
//***************************************************************************
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  //Bearer Token
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) {
    return res.status(401).json({ success: false, reason: 'Unauthorized!!' })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log(err)
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

//***************************************************************************
// uploadDocumentToIris
//***************************************************************************

async function uploadDocumentToIris(
  pathToPdf,
  pdfName,
  subject,
  registrationNumber,
  sender,
  recipients
) {
  const apiUrl = IRIS_UPLOAD_URL // Replace with your API endpoint

  const form = new FormData()
  form._boundary = IRIS_UPLOAD_CONTENT_BOUNDARY // Manually setting the boundary
  form.append('subject', subject)
  form.append('registrationNumber', registrationNumber)
  form.append('recipients', recipients)
  form.append('sender', sender)
  form.append('file', fs.createReadStream(pathToPdf), pdfName)

  const tr = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk)
    },
  })
  form.pipe(tr)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${IRIS_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
      },
      duplex: 'half', // sos duplex option is required when sending a body
      body: tr,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    return data
  } catch (error) {
    console.error('uploadDocumentToIris error', error)
    throw error // or handle the error as needed
  }
}

//***************************************************************************
// uploadManyDocumentToIris
//***************************************************************************

async function uploadManyDocumentToIris(pdfArray, subject, registrationNumber, sender, recipients) {
  const apiUrl = IRIS_UPLOAD_URL // Replace with your API endpoint

  const form = new FormData()
  form._boundary = IRIS_UPLOAD_CONTENT_BOUNDARY // Manually setting the boundary
  form.append('subject', subject)
  form.append('registrationNumber', registrationNumber)
  form.append('recipients', recipients)
  form.append('sender', sender)
  //form.append('file', fs.createReadStream(pathToPdf), pdfName)
  for (let i = 0; i < pdfArray.length; i++) {
    form.append('file', fs.createReadStream(pdfArray[i].pathToPdf), pdfArray[i].pdfName)
  }

  const tr = new Transform({
    transform(chunk, encoding, callback) {
      callback(null, chunk)
    },
  })
  form.pipe(tr)

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${IRIS_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${form._boundary}`,
      },
      duplex: 'half', // sos duplex option is required when sending a body
      body: tr,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()

    return data
  } catch (error) {
    console.error('uploadDocumentToIris error', error)
    throw error // or handle the error as needed
  }
}

//***************************************************************************
// getIrisCredentials
//***************************************************************************
async function getIrisCredentials() {
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

  try {
    const response = await axios.post(apiUrl, formBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  } catch (error) {
    console.error({ error: error.message })
    return { key: null }
  }
}
//***************************************************************************
// getIrisRecipients
//***************************************************************************
async function getIrisRecipients() {
  try {
    const response = await axios.get(IRIS_RECIPIENTS_URL, {
      headers: {
        Authorization: `Bearer ${IRIS_API_KEY}`,
      },
    })

    const data = response.data
    let filtered = data.filter((item) => item.Description.includes('ΠΕΥΚΗ'))

    return filtered[0].Id // Assuming you want to return the first filtered item
  } catch (error) {
    console.error('There was an error:', error.message)
    throw error // or handle it as per your application's needs
  }
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
        headerAA: '1',
        attachmentType: 'ΑΛΛΟ ΅ΕΓΓΡΑΦΟ',
        attachmentFileName: 'test.pdf',
        attachment: '<base64 data>',
      }
    }
*/

    console.log(
      formatDateTime(new Date()),
      ': /app03GeneralApplicationAttachmentsInsert',
      'headerAA =',
      req.body?.headerAA,
      'attachmentType =',
      req.body?.attachmentType,
      'attachmentFileName =',
      req.body?.attachmentFileName,
      'attachment length=',
      req.body?.attachment.length
    )
    try {
      const headerAA = req.body?.headerAA || null
      const attachmentType = req.body?.attachmentType || null
      const attachmentFileName = req.body?.attachmentFileName || null
      const attachment = req.body?.attachment || null
      if (!headerAA) {
        return res
          .status(400)
          .json({ success: false, reason: 'Bad Request, headerAA must have a value.' })
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
          headerAA,
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

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_TaxAuthority
//----------------------------------------------------------------------------------
appRoutes.get('/taxAuthority', authenticateToken, async (req, res, next) => {
  /*
    #/api/taxAuthority
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Επιστρέφει τις εφοριες του συστηματος .'
    #swagger.security = [{"Bearer": []}]
  */
  console.log(formatDateTime(new Date()), ': /taxAuthority')
  try {
    const taxAuthorityData = await db.taxAuthority()

    return res.status(200).json(taxAuthorityData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js POST Routes FOR SP pr_App03_GeneralApplication_New
//----------------------------------------------------------------------------------
appRoutes.post('/app03GeneralApplicationNew', authenticateToken, async (req, res, next) => {
  /*
    #/api/app03GeneralApplicationNew
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Αρχική Εισαγωγή Φόρμας Γενική Αίτηση'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      description: 'Αρχική Εισαγωγή Φόρμας Γενική Αίτηση με μειωμενα πεδια',
      schema: {
      demeAA: '1',
      surname: 'Τεστοπουλος',
      firstName: '',
      fatherName: '',
      vatNumber: '099999999',
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
    ': /app03GeneralApplicationNew',
    'demeAA =',
    req.body?.demeAA,
    'surname =',
    req.body?.surname,
    'firstName =',
    req.body?.firstName,
    'fatherName =',
    req.body?.fatherName,
    'vatNumber =',
    req.body?.vatNumber
  )
  try {
    const demeAA = req.body?.demeAA || null
    const surname = req.body?.surname || null
    const firstName = req.body?.firstName || null
    const fatherName = req.body?.fatherName || null
    const vatNumber = req.body?.vatNumber || null
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }
    if (!surname) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, surname must have a value.' })
    }
    if (!firstName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, firstName must have a value.' })
    }
    if (!fatherName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, fatherName must have a value.' })
    }
    if (!vatNumber) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, vatNumber must have a value.' })
    }

    const app03GeneralApplicationNewData = await db.app03GeneralApplicationNew({
      demeAA,
      surname,
      firstName,
      fatherName,
      vatNumber,
    })

    return res.status(200).json(app03GeneralApplicationNewData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_GetCitizenByVatNumber
//----------------------------------------------------------------------------------
appRoutes.get('/getCitizenByVatNumber', authenticateToken, async (req, res, next) => {
  /*
    #/api/getCitizenByVatNumber
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Επιστρέφει τα στοιχεια ενος πολιτη ψαχνοντας με το ΑΦΜ του .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['vatNumber'] = {
        in: 'query',
        description: 'Το ΑΦΜ του πολιτη.',
        required: true,
        type: 'string',
        example: '660074100'
      }
    }
  */
  console.log(
    formatDateTime(new Date()),
    ': /getCitizenByVatNumber',
    'vatNumber=',
    req.query?.vatNumber
  )
  try {
    const vatNumber = req.query?.vatNumber || null
    if (!vatNumber) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, vatNumber must have a value.' })
    }

    const getCitizenByVatNumberData = await db.getCitizenByVatNumber({ vatNumber })

    return res.status(200).json(getCitizenByVatNumberData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_GetFormData
//----------------------------------------------------------------------------------
appRoutes.get('/getFormData', async (req, res, next) => {
  /*
    #/api/getFormData
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Επιστρέφει χρησιμες πληροφοριες για τις φορμες του συτηματος.'
    #swagger.security = [{"Bearer": []}]
  */
  console.log(formatDateTime(new Date()), ': /getFormData')
  try {
    const getFormDataData = await db.getFormData()

    return res.status(200).json(getFormDataData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js POST Routes FOR SP pr_Application_InsUpd
//----------------------------------------------------------------------------------
appRoutes.post('/applicationInsUpd', authenticateToken, async (req, res, next) => {
  /*
    #/api/applicationInsUpd
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Εισαγωγή/Ενημέρωση οποιασδηποτε φορμας'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      description: 'Για νεα φορμα το applicationAA να ειναι -1, για ενημερωση να εχει την τιμη του Id της φορμας',
      schema: {
      applicationAA: '-1',
      demeAA: '1',
      surname: 'Τεστοπουλος',
      firstName: 'Τεστ',
      fatherName: 'Τεστ',
      vatNumber: '099999999',
      dob: '',
      idCardNo: '',
      address: '',
      taxAuthority: '',
      email: '',
      telephone: '',
      zip: '',
      formKey: 'RelocationDueToTwoYearRes',
      jsonData: '{\"yearsOfResidenceInTheMunicipality\" : 3}'
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
    ': /applicationInsUpd',
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
    'formKey =',
    req.body?.formKey,
    'jsonData =',
    req.body?.jsonData
  )
  try {
    const applicationAA = req.body?.applicationAA || -1
    const demeAA = req.body?.demeAA || null
    const surname = req.body?.surname || null
    const firstName = req.body?.firstName || null
    const fatherName = req.body?.fatherName || null
    const vatNumber = req.body?.vatNumber || null
    const dob = req.body?.dob || null
    const idCardNo = req.body?.idCardNo || null
    const address = req.body?.address || null
    const taxAuthority = req.body?.taxAuthority || null
    const email = req.body?.email || null
    const telephone = req.body?.telephone || null
    const zip = req.body?.zip || null
    const formKey = req.body?.formKey || null
    const jsonData = req.body?.jsonData || null
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }
    if (!surname) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, surname must have a value.' })
    }
    if (!firstName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, firstName must have a value.' })
    }
    if (!fatherName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, fatherName must have a value.' })
    }
    if (!vatNumber) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, vatNumber must have a value.' })
    }
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }


console.log('object = ', {
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
  formKey,
  jsonData,
})

    const applicationInsUpdData = await db.applicationInsUpd({
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
      formKey,
      jsonData,
    })

    return res.status(200).json(applicationInsUpdData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js POST Routes FOR SP pr_App03_GeneralApplication_Submit
//----------------------------------------------------------------------------------
appRoutes.post('/app03GeneralApplicationSubmit', authenticateToken, async (req, res, next) => {
  /*
    #/api/app03GeneralApplicationSubmit
    #swagger.tags = ['DEME_CLIENT']
    #swagger.summary = 'Υποβολή φορμας Γενική Αίτηση'
=======
// Node.js GET Routes FOR SP pr_GetAllFormsForAdmin
//----------------------------------------------------------------------------------
appRoutes.get('/getAllFormsForAdmin', authenticateToken, async (req, res, next) => {
  /*
    #/api/getFormData
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Επιστρέφει τις υποβληθείσες φορμες του συτηματος.'
    #swagger.security = [{"Bearer": []}]
  */
  console.log(formatDateTime(new Date()), ': /getAllFormsForAdmin', 'demeAA=', req.query?.demeAA)
  try {
    const demeAA = req.query?.demeAA || 0
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }

    const getAllFormsForAdminData = await db.getAllFormsForAdmin({ demeAA })

    return res.status(200).json(getAllFormsForAdminData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js POST Routes FOR SP pr_Adm_SubmitFormForCorrections
//----------------------------------------------------------------------------------
appRoutes.post('/admSubmitFormForCorrections', authenticateToken, async (req, res, next) => {
  /*
    #/api/admSubmitFormForCorrections
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Επιστροφη φορμας στον πολιτη για διορθωση'
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
<<<<<<< HEAD
      applicationAA: '1'
=======
      applicationAA: '1',
      formKey: 'RelocationDueToTwoYearRes',
      appStatusComments: 'Παρακαλουμε να υποβαλλετε την φορμα ξανα με τις σωστες πληροφοριες'
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
<<<<<<< HEAD
    ': /app03GeneralApplicationSubmit',
    'applicationAA =',
    req.body?.applicationAA
  )
  try {
    const applicationAA = req.body?.applicationAA || null
=======
    ': /admSubmitFormForCorrections',
    'applicationAA =',
    req.body?.applicationAA,
    'formKey =',
    req.body?.formKey,
    'appStatusComments =',
    req.body?.appStatusComments
  )
  try {
    const applicationAA = req.body?.applicationAA || null
    const formKey = req.body?.formKey || null
    const appStatusComments = req.body?.appStatusComments || null
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }
<<<<<<< HEAD

    const isFormReadyForSubmission = await db.app03GeneralApplicationIsReadyForSubmission({
      applicationAA,
    })
    console.log('isFormReadyForSubmission=', isFormReadyForSubmission)
    if (!isFormReadyForSubmission.readyToSubmit) {
      return res.status(200).json({ success: false, reason: isFormReadyForSubmission.reason })
    }

    const formPdfData = await db.app03GeneralApplicationPdf({ applicationAA })

    const irisSubject = isFormReadyForSubmission.irisSubject
    const vatNumber = isFormReadyForSubmission.vatNumber
    const registrationNumber = isFormReadyForSubmission.regno
    const sender = isFormReadyForSubmission.sender

    const OUT_PATH = path.resolve(__dirname, '../pdfs/' + vatNumber.trim())
    await mkdirp(OUT_PATH)

    console.log('OUT_PATH ', OUT_PATH)
    const fileName = 'FORM.pdf'
    //const PATH_TO_PDF = OUT_PATH + '\\' + fileName
    const PATH_TO_PDF = path.join(OUT_PATH, fileName)

    IRIS_API_KEY = await getIrisCredentials()
    IRIS_RECIPIENT_ID = await getIrisRecipients()

    console.log('IRIS_RECIPIENT_ID=', IRIS_RECIPIENT_ID)

    await doReport(OUT_PATH, fileName, formPdfData, vatNumber, async function (pdfDocString) {
      console.log('pdfDocString')
      const FormAttachmentInsUpdRes = await db.app03GeneralApplicationFormAttachmentInsUpd({
        headerAA: applicationAA,
        attachmentType: 'FORM',
        attachmentFileName: 'FORM.pdf',
        attachment: pdfDocString,
      })
    })

    let attachmentsForIris = await db.app03GeneralApplicationAttachmentsGetForIris({
      applicationAA,
    })

    let pdfArray = [{ pathToPdf: PATH_TO_PDF, pdfName: fileName }]
    //pdfArray[i].pathToPdf), pdfArray[i].pdfName
    for (let i = 0; i < attachmentsForIris.length; i++) {
      console.log(
        'attachmentsForIris[i].attachmentFileName=',
        attachmentsForIris[i].attachmentFileName
      )
      let pdfEncoded = attachmentsForIris[i].attachment
      pdfEncoded = pdfEncoded.replace('data:application/pdf;base64,', '')
      var bin = atob(pdfEncoded)
      let pathToNextPdf = path.join(OUT_PATH, attachmentsForIris[i].attachmentFileName)
      await fs2.writeFile(pathToNextPdf, bin, 'binary')
      pdfArray.push({ pathToPdf: pathToNextPdf, pdfName: attachmentsForIris[i].attachmentFileName })
    }

    let irisData = await uploadManyDocumentToIris(
      pdfArray,
      irisSubject,
      registrationNumber,
      sender,
      IRIS_RECIPIENT_ID
    )
    rimraf(OUT_PATH, { preserveRoot: false })

    // console.log('{ applicationAA: applicationAA, irisId: irisData[0].id }=', {
    //   applicationAA: applicationAA,
    //   irisId: irisData[0].id,
    // })
    //     console.log('irisData=', irisData)

    await db.app03GeneralApplicationIrisUploadsIns({
      applicationAA: applicationAA,
      irisId: irisData[0].Id,
    })

    const app03GeneralApplicationSubmitData = await db.app03GeneralApplicationSubmit({
      applicationAA,
    })

    return res.status(200).json(app03GeneralApplicationSubmitData)
=======
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }
    if (!appStatusComments) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, appStatusComments must have a value.' })
    }

    let user = req.user
    const admSubmitFormForCorrectionsData = await db.admSubmitFormForCorrections({
      applicationAA,
      formKey,
      appStatusComments,
      userAA: user.AA,
    })

    return res.status(200).json(admSubmitFormForCorrectionsData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
//GENERIC SP ROUTES
//----------------------------------------------------------------------------------

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_Application_Get
//----------------------------------------------------------------------------------
appRoutes.get('/applicationGet', authenticateToken, async (req, res, next) => {
  /*
    #/api/applicationGet
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Επιστρέφει λεπτομερειες μιας επιλεγμενης φορμας .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['applicationAA'] = {
        in: 'query',
        description: 'Το id της φόρμας.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }
    #swagger.parameters['formKey'] = {
        in: 'query',
        description: 'Το formKey της φόρμας.',
        required: true,
        type: 'string',
        example: 'ApplicationToACollectiveBo'
      }
    }
  */
  console.log(
    formatDateTime(new Date()),
    ': /applicationGet',
    'applicationAA=',
    req.query?.applicationAA,
    'formKey=',
    req.query?.formKey
  )
  try {
    const applicationAA = req.query?.applicationAA || 0
    const formKey = req.query?.formKey || null
=======
// Node.js POST Routes FOR SP pr_Adm_SubmitFormRejected
//----------------------------------------------------------------------------------
appRoutes.post('/admSubmitFormRejected', authenticateToken, async (req, res, next) => {
  /*
    #/api/admSubmitFormRejected
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Απόρριψη αίτησης πολίτη'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
      applicationAA: '1',
      formKey: 'RelocationDueToTwoYearRes',
      appStatusComments: 'το αιτημα σας δεν εγκριθηκε'
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
    ': /admSubmitFormRejected',
    'applicationAA =',
    req.body?.applicationAA,
    'formKey =',
    req.body?.formKey,
    'appStatusComments =',
    req.body?.appStatusComments
  )
  try {
    const applicationAA = req.body?.applicationAA || null
    const formKey = req.body?.formKey || null
    const appStatusComments = req.body?.appStatusComments || null
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }
<<<<<<< HEAD

    const applicationGetData = await db.applicationGet({ applicationAA, formKey })

    return res.status(200).json(applicationGetData)
=======
    if (!appStatusComments) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, appStatusComments must have a value.' })
    }

    let user = req.user
    console.log('user = ', user)
    const admSubmitFormRejectedData = await db.admSubmitFormRejected({
      applicationAA,
      formKey,
      appStatusComments,
      userAA: user.AA,
    })

    return res.status(200).json(admSubmitFormRejectedData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js GET Routes FOR SP pr_AttachmentsGet
//----------------------------------------------------------------------------------
appRoutes.get('/attachmentsGet', authenticateToken, async (req, res, next) => {
  /*
    #/api/attachmentsGet
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Επιστρέφει πληροφορίες για τα συνημμενα μιας φορμας .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['applicationAA'] = {
        in: 'query',
        description: 'Το id της φόρμας.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }
    #swagger.parameters['formKey'] = {
        in: 'query',
        description: 'Το formKey της φόρμας.',
        required: true,
=======
// Node.js GET Routes FOR SP pr_GetAllFormsForAdminFiltered
//----------------------------------------------------------------------------------
appRoutes.get('/getAllFormsForAdminFiltered', authenticateToken, async (req, res, next) => {
  /*
    #/api/getAllFormsForAdminFiltered
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Επιστρέφει αιτησεις βασει κριτηριων αναζητησης .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['demeAA'] = {
        in: 'query',
        description: 'Α/Α Δημου.',
        required: false,
        type: 'number',
        example: '1'
      }
    #swagger.parameters['sortingField'] = {
        in: 'query',
        description: 'Πεδιο ταξινομησης.',
        required: false,
        type: 'string',
        example: 'surname'
      }
    }
    #swagger.parameters['sortingOrder'] = {
        in: 'query',
        description: 'Σειρά ταξινομησης.',
        required: false,
        type: 'string',
        example: 'ASC'
      }
    }
    #swagger.parameters['formKey'] = {
        in: 'query',
        description: 'Κλειδί φορμας.',
        required: false,
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        type: 'string',
        example: 'ApplicationToACollectiveBo'
      }
    }
<<<<<<< HEAD
  */
  console.log(
    formatDateTime(new Date()),
    ': /attachmentsGet',
    'applicationAA=',
    req.query?.applicationAA,
    'formKey=',
    req.query?.formKey
  )
  try {
    const applicationAA = req.query?.applicationAA || 0
    const formKey = req.query?.formKey || null
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }

    const attachmentsGetData = await db.attachmentsGet({ applicationAA, formKey })

    return res.status(200).json(attachmentsGetData)
=======
    #swagger.parameters['appStatus'] = {
        in: 'query',
        description: 'Status αίτησης.',
        required: false,
        type: 'number',
        example: '1'
      }
    }
    #swagger.parameters['surname'] = {
        in: 'query',
        description: 'Επώνυμο η μερος επωνυμου πολίτη.',
        required: false,
        type: 'string',
        example: 'ΧΑΛΚ'
      }
    }
    #swagger.parameters['irisRegNo'] = {
        in: 'query',
        description: 'Αρ. Πρωτοκόλλου ΙΡΙΔΑ.',
        required: false,
        type: 'string',
        example: '1212'
      }
    }
    #swagger.parameters['regNo'] = {
        in: 'query',
        description: 'Μοναδικός Αρ. Αίτησης',
        required: false,
        type: 'number',
        example: '291'
      }
    }
    #swagger.parameters['vatNumber'] = {
        in: 'query',
        description: 'ΑΦΜ',
        required: false,
        type: 'string',
        example: '034998765'
      }
    }
  */

  console.log(
    formatDateTime(new Date()),
    ': /getAllFormsForAdminFiltered',
    'demeAA=',
    req.query?.demeAA,
    'sortingField=',
    req.query?.sortingField,
    'sortingOrder=',
    req.query?.sortingOrder,
    'formKey=',
    req.query?.formKey,
    'appStatus=',
    req.query?.appStatus,
    'surname=',
    req.query?.surname,
    'irisRegNo=',
    req.query?.irisRegNo,
    'regNo=',
    req.query?.regNo,
    'vatNumber=',
    req.query?.vatNumber
  )
  try {
    const demeAA = req.query?.demeAA ?? 1
    const sortingField = req.query?.sortingField ?? ''
    const sortingOrder = req.query?.sortingOrder ?? ''
    const formKey = req.query?.formKey ?? ''
    const appStatus = req.query?.appStatus ?? -1
    const surname = req.query?.surname ?? ''
    const irisRegNo = req.query?.irisRegNo ?? ''
    const regNo = req.query?.regNo ?? ''
    const vatNumber = req.query?.vatNumber ?? ''
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }
    console.log(
      '{demeAA,sortingField,sortingOrder,formKey,appStatus,surname,irisRegNo,regNo,vatNumber,}',
      {
        demeAA,
        sortingField,
        sortingOrder,
        formKey,
        appStatus,
        surname,
        irisRegNo,
        regNo,
        vatNumber,
      }
    )

    let user = req.user
    console.log('user = ', user)

    const getAllFormsForAdminFilteredData = await db.admGetAllFormsFiltered({
      demeAA,
      sortingField,
      sortingOrder,
      formKey,
      appStatus,
      surname,
      irisRegNo,
      regNo,
      vatNumber,
      userAA: user.AA,
    })

    return res.status(200).json(getAllFormsForAdminFilteredData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js POST Routes FOR SP pr_AttachmentsInsert
//----------------------------------------------------------------------------------
appRoutes.post('/attachmentsInsert', authenticateToken, async (req, res, next) => {
  /*
    #/api/app03GeneralApplicationAttachmentsInsert
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Εισαγωγη συνημμενου για φορμα Γενική Αίτηση'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      description: 'Λεπτομέρειες Συνημμενου.',
      schema: {
        headerAA: '1',
        attachmentType: 'ΑΛΛΟ ΅ΕΓΓΡΑΦΟ',
        attachmentFileName: 'test.pdf',
        attachment: '<base64 data>',
        formKey: 'ApplicationToACollectiveBo'
=======
// Node.js POST Routes FOR SP pr_Adm_UserCreate
//----------------------------------------------------------------------------------
appRoutes.post('/admUserCreate', authenticateToken, async (req, res, next) => {
  /*
    #/api/admUserCreate
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Δημιουργια νεου χρηστη'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
      demeAA: 1,
      userName: 'user1',
      lastName: 'Τεστ1',
      firstName: 'Τεστ2',
      pwd:'123',
      isAdmin:0,
      forms:'F1,F2,F3'
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
<<<<<<< HEAD
    ': /attachmentsInsert',
    'headerAA =',
    req.body?.headerAA,
    'attachmentType =',
    req.body?.attachmentType,
    'attachmentFileName =',
    req.body?.attachmentFileName,
    'attachment =',
    req.body?.attachment,
    'formKey =',
    req.body?.formKey
  )
  try {
    const headerAA = req.body?.headerAA || null
    const attachmentType = req.body?.attachmentType || null
    const attachmentFileName = req.body?.attachmentFileName || null
    const attachment = req.body?.attachment || null
    const formKey = req.body?.formKey || null
    if (!headerAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, headerAA must have a value.' })
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
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }

    const attachmentsInsertData = await db.attachmentsInsert({
      headerAA,
      attachmentType,
      attachmentFileName,
      attachment,
      formKey,
    })

    return res.status(200).json(attachmentsInsertData)
  } catch (err) {
=======
    ': /admUserCreate',
    'demeAA =',
    req.body?.demeAA,
    'userName =',
    req.body?.userName,
    'lastName =',
    req.body?.lastName,
    'firstName =',
    req.body?.firstName,
    'pwd =',
    req.body?.pwd,
    'isAdmin =',
    req.body?.isAdmin,
    'forms =',
    req.body?.forms
  )
  try {
    const demeAA = req.body?.demeAA || 1
    const userName = req.body?.userName || null
    const lastName = req.body?.lastName || null
    const firstName = req.body?.firstName || null
    const pwd = req.body?.pwd || null
    const isAdmin = req.body?.isAdmin || 0
    const forms = req.body?.forms || null
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }
    if (!userName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, userName must have a value.' })
    }
    if (!lastName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, lastName must have a value.' })
    }
    if (!firstName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, firstName must have a value.' })
    }
    if (!pwd) {
      return res.status(400).json({ success: false, reason: 'Bad Request, pwd must have a value.' })
    }
    if (!isAdmin) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, isAdmin must have a value.' })
    }
    if (!forms) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, forms must have a value.' })
    }

    const admUserCreateData = await db.admUserCreate({
      demeAA,
      userName,
      lastName,
      firstName,
      pwd,
      isAdmin,
      forms,
    })

    return res.status(200).json(admUserCreateData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js POST Routes FOR SP pr_Persons_Login
//----------------------------------------------------------------------------------
appRoutes.post('/Login', async (req, res, next) => {
  /*
    #Login
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Login to the application.'
    #swagger.parameters['obj'] = {
        in: 'body',
        description: 'Login details...',
        schema: {
                    $userName: 'test',
                    $pwd: '123'
                }

    }
  */
  console.log(formatDateTime(new Date()), ':  /Login', req.body?.userName)
  try {
    const userName = req?.body?.userName || null
    const pwd = req?.body?.pwd || null
    if (!userName) {
      console.log('400. User name must be non empty')
      return res.status(400).json({ success: false, reason: 'User name must be non empty.' })
    }
    if (!pwd) {
      console.log('400. Password must be non empty')
      return res.status(400).json({ success: false, reason: 'password must be non empty.' })
    }

    const userData = await db.admUserLogin({ userName, pwd, demeAA: 1 })
    console.log('userData=', userData)
    const accessToken = jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: 5000,
    })

    return res.status(200).json({ ...userData, accessToken: accessToken })
  } catch (err) {
    console.log('500.Internal Error')
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js GET Routes FOR SP pr_Form_IsReadyForSubmission
//----------------------------------------------------------------------------------
appRoutes.get('/formIsReadyForSubmission', authenticateToken, async (req, res, next) => {
  /*
    #/api/formIsReadyForSubmission
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Επιστρέφει 1 αν η form ειναι ετοιμη για υποβολή, 0 αν οχι .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['applicationAA'] = {
        in: 'query',
        description: 'Το id της φόρμας.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }
    #swagger.parameters['formKey'] = {
        in: 'query',
        description: 'Το formKey της φόρμας.',
        required: true,
        type: 'string',
        example: 'ApplicationToACollectiveBo'
      }
    }
  */
  console.log(
    formatDateTime(new Date()),
    ': /formIsReadyForSubmission',
    'applicationAA=',
    req.query?.applicationAA,
    'formKey=',
    req.query?.formKey
  )
  try {
    const applicationAA = req.query?.applicationAA || 0
    const formKey = req.query?.formKey || null
=======
// Node.js GET Routes FOR SP pr_Adm_ApplicationStatistics
//----------------------------------------------------------------------------------
appRoutes.get('/admApplicationStatistics', authenticateToken, async (req, res, next) => {
  /*
    #/api/getAllFormsForAdminFiltered
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Επιστρέφει στατιστικες αιτησεων .'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['demeAA'] = {
        in: 'query',
        description: 'Α/Α Δημου.',
        required: false,
        type: 'number',
        example: '1'
      }

  */
  console.log(
    formatDateTime(new Date()),
    ': /admApplicationStatistics',
    'demeAA=',
    req.query?.demeAA
  )
  try {
    const demeAA = req.query?.demeAA || 0
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }

    let user = req.user
    console.log('user = ', user)
    const admApplicationStatisticsData = await db.admApplicationStatistics({
      demeAA,
      userAA: user.AA,
    })

    return res.status(200).json(admApplicationStatisticsData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_GetLastFormsForAdmin
//----------------------------------------------------------------------------------
appRoutes.get('/getLastFormsForAdmin', authenticateToken, async (req, res, next) => {
  /*
    #/api/getAllFormsForAdminFiltered
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Επιστρέφει το πολυ 10 τελευταιες αιτησεις.'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['demeAA'] = {
        in: 'query',
        description: 'Α/Α Δημου.',
        required: false,
        type: 'number',
        example: '1'
      }

  */
  console.log(formatDateTime(new Date()), ': /getLastFormsForAdmin', 'demeAA=', req.query?.demeAA)
  try {
    const demeAA = req.query?.demeAA || 0
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }

    let user = req.user
    console.log('user = ', user)

    const getLastFormsForAdminData = await db.aDMGetLastForms({ demeAA, userAA: user.AA })

    return res.status(200).json(getLastFormsForAdminData)
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
// Node.js GET Routes FOR SP pr_Adm_FormHistory
//----------------------------------------------------------------------------------
appRoutes.get('/admFormHistory', authenticateToken, async (req, res, next) => {
  /*
    #/api/getAllFormsForAdminFiltered
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Επιστρέφει το πολυ 10 τελευταιες αιτησεις.'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['applicationAA'] = {
        in: 'query',
        description: 'Α/Α Αιτησης.',
        required: false,
        type: 'number',
        example: '1'
      }
    #swagger.parameters['formAA'] = {
        in: 'query',
        description: 'Α/Α Φόρμας.',
        required: false,
        type: 'number',
        example: '1'
      }
  */
  console.log(
    formatDateTime(new Date()),
    ': /admFormHistory',
    'applicationAA=',
    req.query?.applicationAA,
    'formAA=',
    req.query?.formAA
  )
  try {
    const applicationAA = req.query?.applicationAA || 0
    const formAA = req.query?.formAA || 0

>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }
<<<<<<< HEAD
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }

    const formIsReadyForSubmissionData = await db.formIsReadyForSubmission({
      applicationAA,
      formKey,
    })

    return res.status(200).json(formIsReadyForSubmissionData)
=======
    if (!formAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formAA must have a value.' })
    }

    let user = req.user
    console.log('user = ', user)
    const admFormHistoryData = await db.admFormHistory({
      applicationAA,
      formAA,
      userAA: user.AA,
    })

    return res.status(200).json(admFormHistoryData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js POST Routes FOR SP pr_Form_New
//----------------------------------------------------------------------------------
appRoutes.post('/formNew', authenticateToken, async (req, res, next) => {
  /*
    #/api/formNew
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Αρχική Εισαγωγή Φόρμας με μειωμενα πεδια'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      description: 'Αρχική Εισαγωγή Φόρμας με μειωμενα πεδια',
      schema: {
      demeAA: '1',
      surname: 'Τεστοπουλος',
      firstName: '',
      fatherName: '',
      vatNumber: '099999999',
=======
// Node.js POST Routes FOR SP pr_Adm_UndoAction
//----------------------------------------------------------------------------------
appRoutes.post('/admUndoAction', authenticateToken, async (req, res, next) => {
  /*
    #/api/admUndoAction
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Undo Action σε φορμα. Η φορμα επιστρεφει σε κατασταση Υποβληθείσα.'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
      applicationAA: '1',
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
      formKey: 'RelocationDueToTwoYearRes'
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
<<<<<<< HEAD
    ': /formNew',
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
=======
    ': /admUndoAction',
    'applicationAA =',
    req.body?.applicationAA,
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    'formKey =',
    req.body?.formKey
  )
  try {
<<<<<<< HEAD
    const demeAA = req.body?.demeAA || null
    const surname = req.body?.surname || null
    const firstName = req.body?.firstName || null
    const fatherName = req.body?.fatherName || null
    const vatNumber = req.body?.vatNumber || null
    const formKey = req.body?.formKey || null
    if (!demeAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, demeAA must have a value.' })
    }
    if (!surname) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, surname must have a value.' })
    }
    if (!firstName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, firstName must have a value.' })
    }
    if (!fatherName) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, fatherName must have a value.' })
    }
    if (!vatNumber) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, vatNumber must have a value.' })
=======
    const applicationAA = req.body?.applicationAA || null
    const formKey = req.body?.formKey || null

    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    }
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }
<<<<<<< HEAD

    const formNewData = await db.formNew({
      demeAA,
      surname,
      firstName,
      fatherName,
      vatNumber,
      formKey,
    })

    return res.status(200).json(formNewData)
=======
    let user = req.user
    console.log('user = ', user)

    const admUndoActionData = await db.admUndoAction({ applicationAA, formKey, userAA: user.AA })

    return res.status(200).json(admUndoActionData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js POST Routes FOR SP pr_Form_Submit
//----------------------------------------------------------------------------------
appRoutes.post('/formSubmit', authenticateToken, async (req, res, next) => {
  /*
    #/api/formSubmit
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Υποβολή φορμας '
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
      applicationAA: '1',
      formKey: 'RelocationDueToTwoYearRes'
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
    ': /formSubmit',
    'applicationAA =',
    req.body?.applicationAA,
    'formKey =',
    req.body?.formKey
  )
  try {
    const applicationAA = req.body?.applicationAA || null
    const formKey = req.body?.formKey || null
=======
// Node.js GET Routes FOR SP pr_Adm_AttachmentsGet
//----------------------------------------------------------------------------------
appRoutes.get('/admAttachmentsGet', authenticateToken, async (req, res, next) => {
  /*
    #/api/getAllFormsForAdminFiltered
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Επιστρέφει attachmens μιας απαντησης αιτησης.'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['applicationAA'] = {
        in: 'query',
        description: 'Α/Α Αιτησης.',
        required: false,
        type: 'number',
        example: '1'
      }
    #swagger.parameters['formKey'] = {
        in: 'query',
        description: 'Κλειδι Φόρμας.',
        required: false,
        type: 'string',
        example: 'ApplicationToACollectiveBo'
      }
  */
  console.log(
    formatDateTime(new Date()),
    ': /admAttachmentsGet',
    'applicationAA=',
    req.query?.applicationAA,
    'formKey=',
    req.query?.formKey
  )
  try {
    const applicationAA = req.query?.applicationAA || 0
    const formKey = req.query?.formKey || null
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }

<<<<<<< HEAD
    const formSubmitData = await db.formSubmit({ applicationAA, formKey })

    return res.status(200).json(formSubmitData)
=======
    const admAttachmentsGetData = await db.admAttachmentsGet({ applicationAA, formKey })

    return res.status(200).json(admAttachmentsGetData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js POST Routes FOR SP pr_Application_Delete
//----------------------------------------------------------------------------------
appRoutes.post('/applicationDelete', authenticateToken, async (req, res, next) => {
  /*
    #/api/applicationDelete
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Διαγραφή προσωρινά αποθηκευμένης αίτησης'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
      applicationAA: '1',
      formKey: 'RelocationDueToTwoYearRes'
=======
// Node.js POST Routes FOR SP pr_Adm_AttachmentsInsert
//----------------------------------------------------------------------------------
appRoutes.post('/admAttachmentsInsert', authenticateToken, async (req, res, next) => {
  /*
    #/api/admAttachmentsInsert
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Εισαγωγη συνημμενου απάντησης αίτησης '
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      description: 'Λεπτομέρειες Συνημμενου.',
      schema: {
        headerAA: '1',
        attachmentType: 'ΑΛΛΟ ΅ΕΓΓΡΑΦΟ',
        attachmentFileName: 'test.pdf',
        attachmentSize: '10MB',
        attachment: '<base64 data>',
        formKey: 'RelocationDueToTwoYearRes'
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
      }
    }
*/
  console.log(
    formatDateTime(new Date()),
<<<<<<< HEAD
    ': /applicationDelete',
    'applicationAA =',
    req.body?.applicationAA,
=======
    ': /admAttachmentsInsert',
    'headerAA =',
    req.body?.headerAA,
    'attachmentType =',
    req.body?.attachmentType,
    'attachmentFileName =',
    req.body?.attachmentFileName,
    'attachmentSize =',
    req.body?.attachmentSize,
    'attachment =',
    req.body?.attachment,
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    'formKey =',
    req.body?.formKey
  )
  try {
<<<<<<< HEAD
    const applicationAA = req.body?.applicationAA || null
    const formKey = req.body?.formKey || null
    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
=======
    const headerAA = req.body?.headerAA || null
    const attachmentType = req.body?.attachmentType || null
    const attachmentFileName = req.body?.attachmentFileName || null
    const attachmentSize = req.body?.attachmentSize || null
    const attachment = req.body?.attachment || null
    const formKey = req.body?.formKey || null
    if (!headerAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, headerAA must have a value.' })
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
    if (!attachmentSize) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, attachmentSize must have a value.' })
    }
    if (!attachment) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, attachment must have a value.' })
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    }
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }

<<<<<<< HEAD
    const applicationDeleteData = await db.applicationDelete({ applicationAA, formKey })

    return res.status(200).json(applicationDeleteData)
=======
    const admAttachmentsInsertData = await db.admAttachmentsInsert({
      headerAA,
      attachmentType,
      attachmentFileName,
      attachmentSize,
      attachment,
      formKey,
    })

    return res.status(200).json(admAttachmentsInsertData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js GET Routes FOR SP pr_Citizen_MyApplications
//----------------------------------------------------------------------------------
appRoutes.get('/citizenMyApplications', authenticateToken, async (req, res, next) => {
  /*
    #/api/citizenMyApplications
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Οι φορμες μου (πρωτη σελιδα)'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['citizenAA'] = {
        in: 'query',
        description: 'Το id του πολιτη.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }

  */
  console.log(
    formatDateTime(new Date()),
    ': /citizenMyApplications',
    'citizenAA=',
    req.query?.citizenAA
  )
  try {
    const citizenAA = req.query?.citizenAA || 0
    if (!citizenAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, citizenAA must have a value.' })
    }

    const citizenMyApplicationsData = await db.citizenMyApplications({ citizenAA })

    return res.status(200).json(citizenMyApplicationsData)
=======
// Node.js POST Routes FOR SP pr_Adm_Attachments_DeleteById
//----------------------------------------------------------------------------------
appRoutes.post('/admAttachmentsDeleteById', authenticateToken, async (req, res, next) => {
  /*
    #/api/admAttachmentsDeleteById
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Διαγραφη συνημμενου απάντησης αίτησης '
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
        ΑΑ: '1'
      }
    }
*/
  console.log(formatDateTime(new Date()), ': /admAttachmentsDeleteById', 'AA =', req.body?.AA)
  try {
    const AA = req.body?.AA || null
    if (!AA) {
      return res.status(400).json({ success: false, reason: 'Bad Request, AA must have a value.' })
    }

    const admAttachmentsDeleteByIdData = await db.admAttachmentsDeleteById({ AA })

    return res.status(200).json(admAttachmentsDeleteByIdData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js GET Routes FOR SP pr_AttachmentsGetForDisplay
//----------------------------------------------------------------------------------
appRoutes.get('/attachmentsGetForDisplay', authenticateToken, async (req, res, next) => {
  /*
    #/api/attachmentsGetForDisplay
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'Φερνει 1 attachment στιε φορμς πολιτη σε μορφη base 64 encoded PDF'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['citizenAA'] = {
        in: 'query',
        description: 'Το id του πολιτη.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }

  */
  console.log(formatDateTime(new Date()), ': /attachmentsGetForDisplay', 'AA=', req.query?.AA)
=======
// Node.js GET Routes FOR SP pr_Adm_AttachmentsGetForDisplay
//----------------------------------------------------------------------------------
appRoutes.get('/admAttachmentsGetForDisplay', authenticateToken, async (req, res, next) => {
  /*
    #/api/getAllFormsForAdminFiltered
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'Επιστρέφει attachmens μιας απαντησης αιτησης.'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['AA'] = {
        in: 'query',
        description: 'Attachment Α/Α.',
        required: false,
        type: 'number',
        example: '1'
      }
  */
  console.log(formatDateTime(new Date()), ': /admAttachmentsGetForDisplay', 'AA=', req.query?.AA)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  try {
    const AA = req.query?.AA || 0
    if (!AA) {
      return res.status(400).json({ success: false, reason: 'Bad Request, AA must have a value.' })
    }

<<<<<<< HEAD
    const attachmentsGetForDisplayData = await db.attachmentsGetForDisplay({ AA })

    return res.status(200).json(attachmentsGetForDisplayData)
=======
    const admAttachmentsGetForDisplayData = await db.admAttachmentsGetForDisplay({ AA })

    return res.status(200).json(admAttachmentsGetForDisplayData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})

//----------------------------------------------------------------------------------
<<<<<<< HEAD
// Node.js POST Routes FOR SP pr_Attachments_DeleteById
//----------------------------------------------------------------------------------
appRoutes.post('/attachmentsDeleteById', authenticateToken, async (req, res, next) => {
  /*
    #/api/attachmentsDeleteById
    #swagger.tags = ['DEME_CLIENT_ALL']
    #swagger.summary = 'διαγραφη ενςο ενος συνημμενου απο τον πολιτη.'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['AA'] = {
        in: 'query',
        description: 'Το id του συνημμενου.',
        required: true,
        type: 'integer',
        example: '1'
      }
    }

  */
  console.log(formatDateTime(new Date()), ': /attachmentsDeleteById', 'AA =', req.body?.AA)
  try {
    const AA = req.body?.AA || null
    if (!AA) {
      return res.status(400).json({ success: false, reason: 'Bad Request, AA must have a value.' })
    }

    const attachmentsDeleteByIdData = await db.attachmentsDeleteById({ AA })

    return res.status(200).json(attachmentsDeleteByIdData)
=======
// Node.js POST Routes FOR SP pr_Adm_SubmitFormAnswer
//----------------------------------------------------------------------------------
appRoutes.post('/admSubmitFormAnswer', authenticateToken, async (req, res, next) => {
  /*
    #/api/admSubmitFormAnswer
    #swagger.tags = ['ADMIN']
    #swagger.summary = 'αποδοχή και απαντηση αιτησης πολίτη'
    #swagger.security = [{"Bearer": []}]
    #swagger.parameters['obj'] = {
      in: 'body',
      schema: {
        applicationAA: '1',
        formKey: 'RelocationDueToTwoYearRes',
      }
    }
*/


  console.log(
    formatDateTime(new Date()),
    ': /admSubmitFormAnswer',
    'applicationAA =',
    req.body?.applicationAA,
    'formKey =',
    req.body?.formKey
  )
  try {
    const applicationAA = req.body?.applicationAA || null
    const formKey = req.body?.formKey || null

    if (!applicationAA) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, applicationAA must have a value.' })
    }
    if (!formKey) {
      return res
        .status(400)
        .json({ success: false, reason: 'Bad Request, formKey must have a value.' })
    }
    let user = req.user
    console.log('user = ', user)

    const admSubmitFormAnswerData = await db.admSubmitFormAnswer({
      applicationAA,
      formKey,
      userAA: user.AA,
    })

    return res.status(200).json(admSubmitFormAnswerData)
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
  } catch (err) {
    global.logger.error(err)
    return res.status(500).json({ success: false, reason: 'Internal Error' })
  }
})
<<<<<<< HEAD

=======
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
module.exports = appRoutes
