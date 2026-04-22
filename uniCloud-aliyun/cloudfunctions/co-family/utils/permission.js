'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const { ERROR_CODES, ROLES } = require('./constants.js');

const ROLE_MAP = {
  [ROLES.OWNER]: 3,
  [ROLES.ADMIN]: 2,
  [ROLES.MEMBER]: 1
};

// 通过 token 查数据库获取 uid
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

async function checkFamilyMembership(userId, familyId) {
  if (!userId || typeof userId !== 'string') {
    throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'userId 必须为字符串' });
  }
  if (!familyId || typeof familyId !== 'string') {
    throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyId 必须为字符串' });
  }

  try {
    const memberRes = await db.collection('familyMember')
      .where({ userId, familyId, isDeleted: false })
      .get();

    if (!memberRes.data || memberRes.data.length === 0) {
      throw ({ code: ERROR_CODES.NOT_FAMILY_MEMBER.code, message: ERROR_CODES.NOT_FAMILY_MEMBER.message });
    }

    return memberRes.data[0];
  } catch (e) {
    if (e.code) throw e;
    throw ({ code: ERROR_CODES.DB_ERROR.code, message: ERROR_CODES.DB_ERROR.message });
  }
}

function checkFamilyRole(memberInfo, minRole) {
  if (!memberInfo || !memberInfo.role) {
    throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '成员信息不完整' });
  }

  const userRoleLevel = ROLE_MAP[memberInfo.role] || 0;
  const requiredLevel = ROLE_MAP[minRole] || 0;

  if (userRoleLevel < requiredLevel) {
    throw ({ code: ERROR_CODES.PERMISSION_DENIED.code, message: ERROR_CODES.PERMISSION_DENIED.message });
  }

  return true;
}

module.exports = { checkLogin, checkFamilyMembership, checkFamilyRole, ROLE_MAP };
