const sql = require('seriate')

class DB {
  constructor() {
    this.db_conn = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      requestTimeout: process.env.DB_REQUESTTIMEOUT,
      connectionTimeout: process.env.DB_REQUESTTIMEOUT,
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_GetAllFormsForCitizenAndDeme
  //----------------------------------------------------------------------------------
  async getAllFormsForCitizenAndDeme({ citizenAA, demeAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_GetAllFormsForCitizenAndDeme',
        params: {
          citizenAA: { type: sql.INT, val: citizenAA },
          demeAA: { type: sql.INT, val: demeAA },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_Get
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationGet({ applicationAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_Get',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_AttachmentsGet
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationAttachmentsGet({ applicationAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_AttachmentsGet',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_AttachmentsInsert
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationAttachmentsInsert({
    headeraAA,
    attachmentType,
    attachmentFileName,
    attachment,
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_AttachmentsInsert',
        params: {
          headeraAA: { type: sql.INT, val: headeraAA },
          attachmentType: { type: sql.NVARCHAR, val: attachmentType },
          attachmentFileName: { type: sql.NVARCHAR, val: attachmentFileName },
          attachment: { type: sql.NVARCHAR, val: attachment },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_Attachments_DeleteById
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationAttachmentsDeleteById({ AA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_Attachments_DeleteById',
        params: {
          AA: { type: sql.INT, val: AA },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_InsUpd
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationInsUpd({
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
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_InsUpd',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          demeAA: { type: sql.INT, val: DemeAA },
          surname: { type: sql.NVARCHAR, val: surname },
          firstName: { type: sql.NVARCHAR, val: firstName },
          fatherName: { type: sql.NVARCHAR, val: fatherName },
          vatNumber: { type: sql.NVARCHAR, val: vatNumber },
          dob: { type: sql.NVARCHAR, val: dob },
          idCardNo: { type: sql.NVARCHAR, val: idCardNo },
          address: { type: sql.NVARCHAR, val: address },
          taxAuthority: { type: sql.NVARCHAR, val: taxAuthority },
          email: { type: sql.NVARCHAR, val: email },
          telephone: { type: sql.NVARCHAR, val: telephone },
          zip: { type: sql.NVARCHAR, val: zip },
          recipient: { type: sql.NVARCHAR, val: recipient },
          subject: { type: sql.NVARCHAR, val: subject },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_Submit
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationSubmit({ applicationAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_Submit',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_ReadyForSubmission
  //----------------------------------------------------------------------------------
  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_IsReadyForSubmission
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationIsReadyForSubmission({ applicationAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_IsReadyForSubmission',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }
}

module.exports = DB