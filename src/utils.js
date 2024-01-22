const jwt = require('jsonwebtoken')

function isTokenValid (token, okCallback, errCallback) {
  if (token === null) {
    errCallback()
    return false
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      errCallback()
      return false
    }
    okCallback()
    return true
  })
}




const getDbConnection = () => {
  const db_conn = {
    "host": process.env.DB_HOST,
    "user": process.env.DB_USER,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_DATABASE,
    "requestTimeout": process.env.DB_REQUESTTIMEOUT
  }
  return db_conn
}




/**
 * @param { Promise } promise
 * @param { Object } improved - If you need to enhance the error.
 * @return { Promise }
 * https://javascript.plainenglish.io/how-to-avoid-try-catch-statements-nesting-chaining-in-javascript-a79028b325c5
 */
function to (promise, improved) {
  if (!promise) {
    console.log('error null promise')
    return ['error null promise']
  }


  return promise
    .then((data) => [null, data])
    .catch((err) => {
      if (improved) {
        Object.assign(err, improved);
      }
      console.log(err)
      return [err]; // which is same as [err, undefined];
    });
}

module.exports = {
  getDbConnection: getDbConnection,
  isTokenValid: isTokenValid,
  to: to
}