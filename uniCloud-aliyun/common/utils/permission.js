'use strict';

const db = uniCloud.database();
const { ERROR_CODES, ROLES } = require('./constants.js');

// 角色等级映射
const ROLE_MAP = {
  [ROLES.OWNER]: 3,
  [ROLES.ADMIN]: 2,
  [ROLES.MEMBER]: 1
};

// 检查登录态，返回 userId 或抛出未登录错误
function checkLogin(event) {
  const { uid } = event;
  if (!uid || typeof uid !== 'string') {
    uniCloud.throw({
      code: ERROR_CODES.TOKEN_INVALID.code,
      message: ERROR_CODES.TOKEN_INVALID.message
    });
  }
  return uid;
}

// 检查是否家族成员，返回成员信息
async function checkFamilyMembership(userId, familyId) {
  if (!userId || typeof userId !== 'string') {
    uniCloud.throw({ code: ERROR_CODES.PARAM_ERROR.code, message: 'userId 必须为字符串' });
  }
  if (!familyId || typeof familyId !== 'string') {
    uniCloud.throw({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyId 必须为字符串' });
  }

  try {
    const memberRes = await db.collection('familyMember')
      .where({ userId, familyId, isDeleted: false })
      .get();

    if (!memberRes.data || memberRes.data.length === 0) {
      uniCloud.throw({ code: ERROR_CODES.NOT_FAMILY_MEMBER.code, message: ERROR_CODES.NOT_FAMILY_MEMBER.message });
    }

    return memberRes.data[0];
  } catch (e) {
    if (e.code) throw e;
    uniCloud.throw({ code: ERROR_CODES.DB_ERROR.code, message: ERROR_CODES.DB_ERROR.message });
  }
}

// 检查角色权限
function checkFamilyRole(memberInfo, minRole) {
  if (!memberInfo || !memberInfo.role) {
    uniCloud.throw({ code: ERROR_CODES.PARAM_ERROR.code, message: '成员信息不完整' });
  }

  const userRoleLevel = ROLE_MAP[memberInfo.role] || 0;
  const requiredLevel = ROLE_MAP[minRole] || 0;

  if (userRoleLevel < requiredLevel) {
    uniCloud.throw({ code: ERROR_CODES.PERMISSION_DENIED.code, message: ERROR_CODES.PERMISSION_DENIED.message });
  }

  return true;
}

module.exports = {
  checkLogin,
  checkFamilyMembership,
  checkFamilyRole,
  ROLE_MAP
};
