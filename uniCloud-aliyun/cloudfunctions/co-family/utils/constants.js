'use strict';

const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
};

const GENERATIONS = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4
};

const ERROR_CODES = {
  PARAM_ERROR: { code: 'PARAM_ERROR', message: '参数错误' },
  TOKEN_INVALID: { code: 'TOKEN_INVALID', message: '登录态已失效，请重新登录' },
  USER_NOT_FOUND: { code: 'USER_NOT_FOUND', message: '用户不存在' },
  DB_ERROR: { code: 'DB_ERROR', message: '数据库操作失败' },
  SYSTEM_ERROR: { code: 'SYSTEM_ERROR', message: '系统错误，请稍后重试' },
  WX_LOGIN_FAILED: { code: 'WX_LOGIN_FAILED', message: '微信登录失败' },
  BIND_PHONE_FAILED: { code: 'BIND_PHONE_FAILED', message: '绑定手机失败' },
  FAMILY_NOT_FOUND: { code: 'FAMILY_NOT_FOUND', message: '家族不存在' },
  NOT_FAMILY_MEMBER: { code: 'NOT_FAMILY_MEMBER', message: '您不是该家族成员' },
  PERMISSION_DENIED: { code: 'PERMISSION_DENIED', message: '权限不足' },
  ALREADY_IN_FAMILY: { code: 'ALREADY_IN_FAMILY', message: '该用户已是家族成员' },
  MEMBER_NOT_FOUND: { code: 'MEMBER_NOT_FOUND', message: '成员不存在' },
  GENERATION_OVERFLOW: { code: 'GENERATION_OVERFLOW', message: '已达到最大代数限制' },
  PARENT_NOT_FOUND: { code: 'PARENT_NOT_FOUND', message: '父节点不存在' }
};

const PAGE_SIZE = 20;
const MAX_GENERATIONS = 4;

module.exports = { ROLES, GENERATIONS, ERROR_CODES, PAGE_SIZE, MAX_GENERATIONS };
