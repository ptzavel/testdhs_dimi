const nodemailer = require('nodemailer')
const smtpTransport = require('nodemailer-smtp-transport')

let getSMTPOptions = () => {
  let options = {
    host: process.env.SMTP_HOST,
    //secureConnection: true,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PWD,
    },
    //secure: true,
    tls: { rejectUnauthorized: false },
  }
  //console.log('SMTP options: ', options)
  return options
}

let transport = nodemailer.createTransport(smtpTransport(getSMTPOptions()))

const generateHtmlSubmit = (title, regNo) => {
  const html = `
  <div style="font:12pt arial,sans-serif;background-color:#ffffff;color:#000000">
    <img src="cid:logo@dhs" width:"120px"/>
    <br/>
    <br/>
    <div style="width:800px">Δήμος Λυκόβρυσης Πεύκης
      <br/>
      <br/>
      <p>
      Υποβλήθηκε επιτυχώς η αίτησή σας, με τα ακόλουθα στοιχεία:
      </p>
      <p>
        Αίτηση:  <span style="font-weight:bold">${title}</span>
      </p>
      <p>
        Μοναδικός Αριθμός Αίτησης : <span style="font-weight:bold">${regNo}</span>
      </p>
      <br/>
      <p>
      Μπορείτε να δείτε τα στοιχεία της αίτησής σας,  πατώντας στον παρακάτω σύνδεσμο και πηγαίνοντας στην ενότητα "Οι Αιτήσεις μου"
      </p>
      <div style="width:800px;text-align: center;color:#ADD8E6;font-size:16;font-weight:bold">
        <a href="${process.env.APP_ADDRESS}/" target="_blank">Προβολή Αίτησης</a>
      </div>
      <br/>
      <br/>
      <p>
        Με εκτίμηση,
      </p>
      <br/>
      <p>
        Δήμος Λυκόβρυσης Πεύκης
      </p>
    </div>
  </div>
`
  return html
}


const generateMessageSubmit = (toMail, title, regNo) => {
  const html = generateHtmlSubmit(title, regNo)

  const message = {
    from: process.env.EMAIL_SENDER, // Sender address
    to: toMail, // List of recipients
    subject: `Η αίτηση σας με αριθμό ${regNo} υποβλήθηκε επιτυχώς.`, // Subject line
    html: html,
  }

  return message
}




const sendMailSubmit = ({ toMail, title, regNo }) => {
  console.log('sendMailSubmit data', { toMail, title, regNo })

  const message = generateMessageSubmit(toMail, title, regNo)
  // console.log('message= ', message)
  return new Promise((resolve, reject) => {
    transport.sendMail(message, function (err, info) {
      if (err) {
        return reject(err)
      } else {
        resolve(info)
      }
    })
  })
}


module.exports = { sendMailSubmit }
