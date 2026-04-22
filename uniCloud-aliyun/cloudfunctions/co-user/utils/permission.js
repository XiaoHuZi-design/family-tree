'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const { ERROR_CODES, ROLES } = require('./constants.js');

async function checkLogin(context) {
  const token = context.getUniIdToken && context.getUniIdToken();
  if (!token) {
    throw ({ code: ERROR_CODES.TOKEN_INVALID.code, message: ERROR_CODES.TOKEN_INVALID.message });
  }

  const userRes = await db.collection('uni-id-users')
    .where({ token: token, tokenExpired: dbCmd.gt(Date.now()) })
    .field({ _id: true })
    .limit(1)
    .get();

  if (!userRes.data || !userRes.data.length) {
    throw ({ code: ERROR_CODES.TOKEN_INVALID.code, message: ERROR_CODES.TOKEN_INVALID.message });
  }

  return userRes.data[0]._id;
}

module.exports = { checkLogin };
