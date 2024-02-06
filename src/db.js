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
    headerAA,
    attachmentType,
    attachmentFileName,
    attachment,
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_AttachmentsInsert',
        params: {
          headerAA: { type: sql.INT, val: headerAA },
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
          demeAA: { type: sql.INT, val: demeAA },
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
      return data[0][0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_TaxAuthority
  //----------------------------------------------------------------------------------
  async taxAuthority() {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_TaxAuthority',
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_Pdf
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationPdf({ applicationAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_Pdf',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
        },
      })
      return data[0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_FormAttachmentInsUpd
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationFormAttachmentInsUpd({
    headerAA,
    attachmentType,
    attachmentFileName,
    attachment,
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_FormAttachmentInsUpd',
        params: {
          headerAA: { type: sql.INT, val: headerAA },
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
  // Node.js DB FOR SP pr_App03_GeneralApplication_IrisUploads_Ins
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationIrisUploadsIns({ applicationAA, irisId }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_IrisUploads_Ins',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          irisId: { type: sql.NVARCHAR, val: irisId },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }
  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_App03_GeneralApplication_New
  //----------------------------------------------------------------------------------
  async app03GeneralApplicationNew({ demeAA, surname, firstName, fatherName, vatNumber }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_New',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
          surname: { type: sql.NVARCHAR, val: surname },
          firstName: { type: sql.NVARCHAR, val: firstName },
          fatherName: { type: sql.NVARCHAR, val: fatherName },
          vatNumber: { type: sql.NVARCHAR, val: vatNumber },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  async app03GeneralApplicationAttachmentsGetForIris({ applicationAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_App03_GeneralApplication_AttachmentsGetForIris',
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
  // Node.js DB FOR SP pr_GetCitizenByVatNumber
  //----------------------------------------------------------------------------------
  async getCitizenByVatNumber({ vatNumber }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_GetCitizenByVatNumber',
        params: {
          vatNumber: { type: sql.NVARCHAR, val: vatNumber },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }
  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_GetFormData
  //----------------------------------------------------------------------------------
  async getFormData() {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_GetFormData',
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_Application_InsUpd
  //----------------------------------------------------------------------------------
  async applicationInsUpd({
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
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Application_InsUpd',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          demeAA: { type: sql.INT, val: demeAA },
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
          formKey: { type: sql.NVARCHAR, val: formKey },
          jsonData: { type: sql.NVARCHAR, val: jsonData },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

<<<<<<< HEAD
  //GENERIC FORM SP

  async applicationGet({ applicationAA, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Application_Get',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_GetAllFormsForAdmin
  //----------------------------------------------------------------------------------
  async getAllFormsForAdmin({ demeAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_GetAllFormsForAdmin',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_AttachmentsGet
  //----------------------------------------------------------------------------------
  async attachmentsGet({ applicationAA, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_AttachmentsGet',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  // Node.js DB FOR SP pr_GetAllFormsForAdminFiltered
  //----------------------------------------------------------------------------------
  async getAllFormsForAdminFiltered({
    demeAA,
    sortingField,
    sortingOrder,
    formKey,
    appStatus,
    surname,
    irisRegNo,
    regNo,
    vatNumber,
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_GetAllFormsForAdminFiltered',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
          sortingField: { type: sql.NVARCHAR, val: sortingField },
          sortingOrder: { type: sql.NVARCHAR, val: sortingOrder },
          formKey: { type: sql.NVARCHAR, val: formKey },
          appStatus: { type: sql.INT, val: appStatus },
          surname: { type: sql.NVARCHAR, val: surname },
          irisRegNo: { type: sql.NVARCHAR, val: irisRegNo },
          regNo: { type: sql.NVARCHAR, val: regNo },
          vatNumber: { type: sql.NVARCHAR, val: vatNumber },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_AttachmentsGetForIris
  //----------------------------------------------------------------------------------
  async attachmentsGetForIris({ applicationAA, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_AttachmentsGetForIris',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  // Node.js DB FOR SP pr_Adm_UserCreate
  //----------------------------------------------------------------------------------
  async admUserCreate({ demeAA, userName, lastName, firstName, pwd, isAdmin, forms }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_UserCreate',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
          userName: { type: sql.NVARCHAR, val: userName },
          lastName: { type: sql.NVARCHAR, val: lastName },
          firstName: { type: sql.NVARCHAR, val: firstName },
          pwd: { type: sql.NVARCHAR, val: pwd },
          isAdmin: { type: sql.BOOLEAN, val: isAdmin },
          forms: { type: sql.NVARCHAR, val: forms },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_AttachmentsInsert
  //----------------------------------------------------------------------------------
  async attachmentsInsert({ headerAA, attachmentType, attachmentFileName, attachment, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_AttachmentsInsert',
        params: {
          headerAA: { type: sql.INT, val: headerAA },
          attachmentType: { type: sql.NVARCHAR, val: attachmentType },
          attachmentFileName: { type: sql.NVARCHAR, val: attachmentFileName },
          attachment: { type: sql.NVARCHAR, val: attachment },
          formKey: { type: sql.NVARCHAR, val: formKey },
        },
      })
      return data[0][0]
=======
  // Node.js DB FOR SP pr_Adm_UserLogin
  //----------------------------------------------------------------------------------
  async admUserLogin({ userName, pwd, demeAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_UserLogin',
        params: {
          userName: { type: sql.NVARCHAR, val: userName },
          pwd: { type: sql.NVARCHAR, val: pwd },
          demeAA: { type: sql.INT, val: demeAA },
        },
      })
      return data[0][0][0]
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_Form_IsReadyForSubmission
  //----------------------------------------------------------------------------------
  async formIsReadyForSubmission({ applicationAA, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Form_IsReadyForSubmission',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  // Node.js DB FOR SP pr_GetLastFormsForAdmin
  //----------------------------------------------------------------------------------
  async getLastFormsForAdmin({ demeAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_GetLastFormsForAdmin',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

<<<<<<< HEAD
  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_Form_New
  //----------------------------------------------------------------------------------
  async formNew({ demeAA, surname, firstName, fatherName, vatNumber, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Form_New',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
          surname: { type: sql.NVARCHAR, val: surname },
          firstName: { type: sql.NVARCHAR, val: firstName },
          fatherName: { type: sql.NVARCHAR, val: fatherName },
          vatNumber: { type: sql.NVARCHAR, val: vatNumber },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  //-------------- HERE ------------------------------------------------------------------------------------------------------------------------------------------------------

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_Adm_GetAllFormsFiltered
  //----------------------------------------------------------------------------------
  async admGetAllFormsFiltered({
    demeAA,
    sortingField,
    sortingOrder,
    formKey,
    appStatus,
    surname,
    irisRegNo,
    regNo,
    vatNumber,
    userAA,
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_GetAllFormsFiltered',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
          sortingField: { type: sql.NVARCHAR, val: sortingField },
          sortingOrder: { type: sql.NVARCHAR, val: sortingOrder },
          formKey: { type: sql.NVARCHAR, val: formKey },
          appStatus: { type: sql.INT, val: appStatus },
          surname: { type: sql.NVARCHAR, val: surname },
          irisRegNo: { type: sql.NVARCHAR, val: irisRegNo },
          regNo: { type: sql.NVARCHAR, val: regNo },
          vatNumber: { type: sql.NVARCHAR, val: vatNumber },
          userAA: { type: sql.INT, val: userAA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_Form_Pdf
  //----------------------------------------------------------------------------------
  async formPdf({ applicationAA, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Form_Pdf',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  // Node.js DB FOR SP pr_Adm_SubmitFormForCorrections
  //----------------------------------------------------------------------------------
  async admSubmitFormForCorrections({ applicationAA, formKey, appStatusComments, userAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_SubmitFormForCorrections',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
          appStatusComments: { type: sql.NVARCHAR, val: appStatusComments },
          userAA: { type: sql.INT, val: userAA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_Form_Submit
  //----------------------------------------------------------------------------------
  async formSubmit({ applicationAA, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Form_Submit',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  // Node.js DB FOR SP pr_Adm_SubmitFormRejected
  //----------------------------------------------------------------------------------
  async admSubmitFormRejected({ applicationAA, formKey, appStatusComments, userAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_SubmitFormRejected',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
          appStatusComments: { type: sql.NVARCHAR, val: appStatusComments },
          userAA: { type: sql.INT, val: userAA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_FormAttachmentInsUpd
  //----------------------------------------------------------------------------------
  async formAttachmentInsUpd({
    headerAA,
    attachmentType,
    attachmentFileName,
    attachment,
    formKey,
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_FormAttachmentInsUpd',
        params: {
          headerAA: { type: sql.INT, val: headerAA },
          attachmentType: { type: sql.NVARCHAR, val: attachmentType },
          attachmentFileName: { type: sql.NVARCHAR, val: attachmentFileName },
          attachment: { type: sql.NVARCHAR, val: attachment },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  // Node.js DB FOR SP pr_ADM_GetLastForms
  //----------------------------------------------------------------------------------
  async aDMGetLastForms({ demeAA, userAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_ADM_GetLastForms',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
          userAA: { type: sql.INT, val: userAA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_IrisUploads_Ins
  //----------------------------------------------------------------------------------
  async irisUploadsIns({ applicationAA, irisId, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_IrisUploads_Ins',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          irisId: { type: sql.NVARCHAR, val: irisId },
          formKey: { type: sql.NVARCHAR, val: formKey },
=======
  // Node.js DB FOR SP pr_Adm_ApplicationStatistics
  //----------------------------------------------------------------------------------
  async admApplicationStatistics({ demeAA, userAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_ApplicationStatistics',
        params: {
          demeAA: { type: sql.INT, val: demeAA },
          userAA: { type: sql.INT, val: userAA },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }
  async admFormHistory({ applicationAA, formAA, userAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_FormHistory',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formAA: { type: sql.INT, val: formAA },
          userAA: { type: sql.INT, val: userAA },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_Adm_UndoAction
  //----------------------------------------------------------------------------------
  async admUndoAction({ applicationAA, formKey, userAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_UndoAction',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
          userAA: { type: sql.INT, val: userAA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_Application_Delete
  //----------------------------------------------------------------------------------
  async applicationDelete({ applicationAA, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Application_Delete',
=======
  // Node.js DB FOR SP pr_Adm_AttachmentsGet
  //----------------------------------------------------------------------------------
  async admAttachmentsGet({ applicationAA, formKey }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_AttachmentsGet',
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_Citizen_MyApplications
  //----------------------------------------------------------------------------------
  async citizenMyApplications({ citizenAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Citizen_MyApplications',
        params: {
          citizenAA: { type: sql.INT, val: citizenAA },
=======
  // Node.js DB FOR SP pr_Adm_AttachmentsInsert
  //----------------------------------------------------------------------------------//----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_Adm_AttachmentsInsert
  //----------------------------------------------------------------------------------
  async admAttachmentsInsert({
    headerAA,
    attachmentType,
    attachmentFileName,
    attachmentSize,
    attachment,
    formKey,
  }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_AttachmentsInsert',
        params: {
          headerAA: { type: sql.INT, val: headerAA },
          attachmentType: { type: sql.NVARCHAR, val: attachmentType },
          attachmentFileName: { type: sql.NVARCHAR, val: attachmentFileName },
          attachmentSize: { type: sql.INT, val: attachmentSize },
          attachment: { type: sql.NVARCHAR, val: attachment },
          formKey: { type: sql.NVARCHAR, val: formKey },
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP pr_Adm_Attachments_DeleteById
  //----------------------------------------------------------------------------------
  async admAttachmentsDeleteById({ AA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_Attachments_DeleteById',
        params: {
          AA: { type: sql.INT, val: AA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        },
      })
      return data[0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_AttachmentsGetForDisplay
  //----------------------------------------------------------------------------------
  async attachmentsGetForDisplay({ AA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_AttachmentsGetForDisplay',
=======
  // Node.js DB FOR SP pr_Adm_AttachmentsGetForDisplay
  //----------------------------------------------------------------------------------
  async admAttachmentsGetForDisplay({ AA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_AttachmentsGetForDisplay',
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
        params: {
          AA: { type: sql.INT, val: AA },
        },
      })
      return data[0][0][0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

  //----------------------------------------------------------------------------------
<<<<<<< HEAD
  // Node.js DB FOR SP pr_Attachments_DeleteById
  //----------------------------------------------------------------------------------
  async attachmentsDeleteById({ AA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Attachments_DeleteById',
        params: {
          AA: { type: sql.INT, val: AA },
=======
  // Node.js DB FOR SP pr_Adm_SubmitFormAnswer
  //----------------------------------------------------------------------------------
  async admSubmitFormAnswer({ applicationAA, formKey, userAA }) {
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Adm_SubmitFormAnswer',
        params: {
          applicationAA: { type: sql.INT, val: applicationAA },
          formKey: { type: sql.NVARCHAR, val: formKey },
          userAA: { type: sql.INT, val: userAA },
>>>>>>> 946be05288b686e69043fc20d734dd1f0d4b7b28
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
