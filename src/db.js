const sql = require('seriate')

class DB {

  constructor() {
    this.db_conn = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      requestTimeout: process.env.DB_REQUESTTIMEOUT,
      connectionTimeout: process.env.DB_REQUESTTIMEOUT
    }
  }

  //----------------------------------------------------------------------------------
  // Node.js DB FOR SP sp_UnifiedLogin
  //----------------------------------------------------------------------------------
  async spUnifiedLogin({ username, pwd, deviceID }){
    try {
      const data = await sql.execute(this.db_conn, {
        procedure: 'pr_Login_UnifiedLogin_V2',
        params: {
          username: { type: sql.NVARCHAR, val: username },
          pwd: { type: sql.NVARCHAR, val: pwd },
          deviceId: { type: sql.NVARCHAR, val: deviceID }
        }
      })
      return data[0]
    } catch (error) {
      global.logger.error(error)
      throw error
    }
  }

}

module.exports = DB