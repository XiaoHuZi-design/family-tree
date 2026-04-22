'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const { checkLogin } = require('./utils/permission.js');
const { ERROR_CODES } = require('./utils/constants.js');

module.exports = {
  // 微信登录，直接处理不依赖 uni-id-cf
  async wxLogin(code) {
    if (!code || typeof code !== 'string') {
      throw ({
        code: ERROR_CODES.PARAM_ERROR.code,
        message: 'code 参数必填且为字符串'
      });
    }

    try {
      // 尝试获取微信 openid（简化处理，用 code 作为标识）
      let wxOpenid = '';

      // 用 openid 或 code 的哈希作为用户唯一标识
      const userIdentifier = wxOpenid || ('wx_' + code.substring(0, 16));

      // 查找已有用户
      let uid;
      let isNewUser = false;

      const existUserRes = await db.collection('uni-id-users')
        .where({ wx_openid: userIdentifier })
        .limit(1)
        .get();

      if (existUserRes.data && existUserRes.data.length > 0) {
        uid = existUserRes.data[0]._id;
      } else {
        // 也通过 openid 字段查找（兼容旧数据）
        const existUserRes2 = await db.collection('uni-id-users')
          .where({ openid: userIdentifier })
          .limit(1)
          .get();

        if (existUserRes2.data && existUserRes2.data.length > 0) {
          uid = existUserRes2.data[0]._id;
        }
      }

      if (!uid) {
        // 新用户，创建账号
        const addRes = await db.collection('uni-id-users').add({
          nickname: '微信用户',
          avatar: 'https://cdn.uviewui.com/uview/album/1.jpg',
          wx_openid: userIdentifier,
          openid: userIdentifier,
          familyIds: [],
          role: 'member',
          register_date: Date.now(),
          createTime: Date.now(),
          updateTime: Date.now()
        });
        uid = addRes.id;
        isNewUser = true;
      }

      // 生成 token
      const token = uid + '_' + Date.now() + '_' + Math.random().toString(36).substr(2);
      const tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000;

      // 更新登录态
      await db.collection('uni-id-users').doc(uid).update({
        token,
        tokenExpired,
        last_login_date: Date.now(),
        updateTime: Date.now()
      });

      // 获取用户信息
      const userInfoRes = await db.collection('uni-id-users').doc(uid).get();
      const userInfo = userInfoRes.data && userInfoRes.data[0] ? userInfoRes.data[0] : {};

      return {
        token,
        tokenExpired,
        newUser: isNewUser,
        userInfo: {
          _id: uid,
          uid,
          nickname: userInfo.nickname || '微信用户',
          avatar: userInfo.avatar || '',
          role: userInfo.role || 'member'
        }
      };
    } catch (e) {
      if (e.code) throw e;
      throw ({
        code: ERROR_CODES.WX_LOGIN_FAILED.code,
        message: e.message || '微信登录异常'
      });
    }
  },

  // 获取当前用户资料
  async getProfile() {
    const uid = await checkLogin(this);

    try {
      const userRes = await db.collection('uni-id-users')
        .doc(uid)
        .field({ _id: true, nickname: true, avatar: true, phone: true, gender: true, familyIds: true, createTime: true, updateTime: true })
        .get();

      if (!userRes.data || userRes.data.length === 0) {
        throw ({
          code: ERROR_CODES.USER_NOT_FOUND.code,
          message: ERROR_CODES.USER_NOT_FOUND.message
        });
      }

      const user = userRes.data[0];
      // 手机号脱敏
      if (user.phone) {
        user.phone = user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
      }

      return { code: 0, msg: 'success', data: user };
    } catch (e) {
      throw ({
        code: e.code || ERROR_CODES.DB_ERROR.code,
        message: e.message || ERROR_CODES.DB_ERROR.message
      });
    }
  },

  // 更新用户资料
  async updateProfile(data) {
    const uid = await checkLogin(this);

    if (!data || typeof data !== 'object') {
      throw ({
        code: ERROR_CODES.PARAM_ERROR.code,
        message: 'data 参数必填且为对象'
      });
    }

    const allowedFields = ['nickname', 'avatar', 'gender'];
    const updates = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        // 字段类型校验
        if (field === 'gender' && typeof data[field] !== 'number') {
          throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'gender 必须为数字(0:未知,1:男,2:女)' });
        }
        if ((field === 'nickname' || field === 'avatar') && typeof data[field] !== 'string') {
          throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: `${field} 必须为字符串` });
        }
        updates[field] = data[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '至少更新一个有效字段' });
    }

    try {
      await db.collection('uni-id-users').doc(uid).update({
        ...updates,
        updateTime: Date.now()
      });

      return { code: 0, msg: 'success' };
    } catch (e) {
      throw ({
        code: e.code || ERROR_CODES.DB_ERROR.code,
        message: e.message || ERROR_CODES.DB_ERROR.message
      });
    }
  },

  // 绑定手机号（uniId 内置手机绑定接口）
  async bindPhone(phoneData) {
    const uid = await checkLogin(this);

    if (!phoneData || typeof phoneData !== 'object') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'phoneData 参数必填' });
    }

    const { phone, code } = phoneData;

    if (!phone || typeof phone !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'phone 必填且为字符串' });
    }

    if (!code || typeof code !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'code 必填且为字符串' });
    }

    // 手机号正则校验
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '手机号格式不正确' });
    }

    try {
      // 调用 uniId 官方绑定手机接口（含验证码校验）
      const bindRes = await uniCloud.callFunction({
        name: 'uni-id-cf',
        data: {
          action: 'bindMobile',
          uid,
          params: { mobile: phone, code }
        }
      });

      if (bindRes.errCode || !bindRes.result || bindRes.result.code !== 0) {
        throw ({
          code: bindRes.result?.code || ERROR_CODES.BIND_PHONE_FAILED.code,
          message: bindRes.result?.message || '绑定手机失败'
        });
      }

      return { code: 0, msg: 'success' };
    } catch (e) {
      throw ({
        code: e.code || ERROR_CODES.BIND_PHONE_FAILED.code,
        message: e.message || ERROR_CODES.BIND_PHONE_FAILED.message
      });
    }
  },

  // 发送短信验证码
  async sendSmsCode(data) {
    if (!data || !data.phone) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '手机号必填' });
    }

    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(data.phone)) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '手机号格式不正确' });
    }

    try {
      // 生成6位验证码
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expireTime = Date.now() + 5 * 60 * 1000; // 5分钟有效

      // 存储验证码
      await db.collection('uni-id-users').add({
        type: 'sms-code',
        phone: data.phone,
        code,
        expireTime,
        used: false,
        createTime: Date.now()
      });

      // 通过 uniCloud 发送短信（免费开发环境使用虚拟发送）
      // 生产环境需开通短信服务
      console.log(`[SMS] 验证码: ${code}, 手机号: ${data.phone}`);

      return { code: 0, msg: '验证码已发送' };
    } catch (e) {
      throw ({
        code: ERROR_CODES.SYSTEM_ERROR.code,
        message: '发送验证码失败'
      });
    }
  },

  // 手机号验证码登录
  async phoneLogin(data) {
    if (!data || !data.phone || !data.code) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '手机号和验证码必填' });
    }

    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(data.phone)) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '手机号格式不正确' });
    }

    if (!/^\d{6}$/.test(data.code)) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '验证码格式不正确' });
    }

    try {
      // 查找验证码记录
      const codeRes = await db.collection('uni-id-users')
        .where({
          type: 'sms-code',
          phone: data.phone,
          code: data.code,
          used: false,
          expireTime: dbCmd.gt(Date.now())
        })
        .orderBy('createTime', 'desc')
        .limit(1)
        .get();

      if (!codeRes.data || codeRes.data.length === 0) {
        throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '验证码错误或已过期' });
      }

      // 标记验证码已使用
      await db.collection('uni-id-users').doc(codeRes.data[0]._id).update({ used: true });

      // 查找该手机号是否已注册
      const userRes = await db.collection('uni-id-users')
        .where({ phone: data.phone, mobile_confirmed: 1 })
        .limit(1)
        .get();

      let uid;
      let isNewUser = false;

      if (userRes.data && userRes.data.length > 0) {
        // 已有账号，直接登录
        uid = userRes.data[0]._id;
      } else {
        // 新用户，创建账号
        const addRes = await db.collection('uni-id-users').add({
          phone: data.phone,
          mobile_confirmed: 1,
          nickname: '用户' + data.phone.slice(-4),
          avatar: 'https://cdn.uviewui.com/uview/album/1.jpg',
          familyIds: [],
          register_date: Date.now(),
          createTime: Date.now(),
          updateTime: Date.now()
        });
        uid = addRes.id;
        isNewUser = true;
      }

      // 生成 token
      const token = uid + '_' + Date.now() + '_' + Math.random().toString(36).substr(2);
      const tokenExpired = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7天

      // 存储登录态
      await db.collection('uni-id-users').doc(uid).update({
        token,
        tokenExpired,
        last_login_date: Date.now(),
        updateTime: Date.now()
      });

      // 获取用户信息
      const userInfoRes = await db.collection('uni-id-users').doc(uid).get();
      const userInfo = userInfoRes.data && userInfoRes.data[0] ? userInfoRes.data[0] : {};

      return {
        token,
        tokenExpired,
        newUser: isNewUser,
        userInfo: {
          _id: uid,
          uid,
          nickname: userInfo.nickname || '',
          avatar: userInfo.avatar || '',
          phone: data.phone,
          role: userInfo.role || 'member'
        }
      };
    } catch (e) {
      if (e.code) throw e;
      throw ({
        code: ERROR_CODES.SYSTEM_ERROR.code,
        message: e.message || '登录失败'
      });
    }
  },

  // 退出登录
  async logout() {
    const token = this.getUniIdToken && this.getUniIdToken();
    if (token) {
      try {
        // 清除用户 token
        const userRes = await db.collection('uni-id-users')
          .where({ token })
          .limit(1)
          .get();
        if (userRes.data && userRes.data.length > 0) {
          await db.collection('uni-id-users').doc(userRes.data[0]._id).update({
            token: '',
            tokenExpired: 0,
            updateTime: Date.now()
          });
        }
      } catch (e) {
        // ignore
      }
    }
    return { code: 0, msg: 'success' };
  },

  // 兜底错误处理
  _beforeError(err) {
    console.error('[co-user] error:', JSON.stringify(err))
    return {
      code: err.code || -1,
      msg: err.message || '系统错误',
      message: err.message || '系统错误'
    };
  }
};
