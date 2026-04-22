'use strict';

const db = uniCloud.database();
const dbCmd = db.command;
const { checkLogin, checkFamilyMembership, checkFamilyRole } = require('./utils/permission.js');
const { ROLES, GENERATIONS, ERROR_CODES, PAGE_SIZE, MAX_GENERATIONS } = require('./utils/constants.js');

module.exports = {
  // 创建家族，自动成为族主
  async createFamily(data) {
    const uid = await checkLogin(this);

    if (!data || typeof data !== 'object') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'data 参数必填' });
    }

    const { familyName, description, coverImage } = data;

    if (!familyName || typeof familyName !== 'string' || familyName.length < 2 || familyName.length > 20) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyName 必填且长度为2-20字符' });
    }

    if (description && typeof description !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'description 必须为字符串' });
    }

    try {
      // 创建家族
      const familyRes = await db.collection('family').add({
        familyName,
        description: description || '',
        ownerId: uid,
        memberCount: 1,
        coverImage: coverImage || '',
        createTime: Date.now(),
        updateTime: Date.now(),
        isDeleted: false
      });

      const familyId = familyRes.id;

      // 创建族主成员记录
      const userRes = await db.collection('uni-id-users').doc(uid).get();
      const user = userRes.data[0];

      await db.collection('familyMember').add({
        familyId,
        userId: uid,
        name: user.nickname || '族主',
        generation: GENERATIONS.FIRST,
        parentId: '',
        avatar: user.avatar || '',
        gender: user.gender || 0,
        birthday: null,
        relation: '族主',
        role: ROLES.OWNER,
        createTime: Date.now(),
        updateTime: Date.now(),
        isDeleted: false
      });

      // 更新用户家族列表
      await db.collection('uni-id-users').doc(uid).update({
        familyIds: dbCmd.push([familyId]),
        updateTime: Date.now()
      });

      return { code: 0, msg: 'success', data: { familyId } };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 获取完整家族树（四代）
  async getFamilyTree(familyId) {
    const uid = await checkLogin(this);

    if (!familyId || typeof familyId !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyId 必填' });
    }

    // 校验家族成员权限
    await checkFamilyMembership(uid, familyId);

    try {
      // 获取所有成员
      const membersRes = await db.collection('familyMember')
        .where({ familyId, isDeleted: false })
        .orderBy('createTime', 'asc')
        .get();

      const members = membersRes.data;

      // 递归构建树形结构
      function buildTree(parentId = '', depth = 1) {
        if (depth > MAX_GENERATIONS) return [];

        const children = members.filter(m => m.parentId === parentId);
        return children.map(member => ({
          id: member._id,
          name: member.name,
          generation: member.generation,
          avatar: member.avatar,
          gender: member.gender,
          relation: member.relation,
          role: member.role,
          children: buildTree(member._id, depth + 1)
        }));
      }

      const tree = buildTree();

      return { code: 0, msg: 'success', data: { tree, total: members.length } };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 获取成员详情含联系方式
  async getMemberDetail(memberId) {
    const uid = await checkLogin(this);

    if (!memberId || typeof memberId !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'memberId 必填' });
    }

    try {
      const memberRes = await db.collection('familyMember').doc(memberId).get();
      if (!memberRes.data || memberRes.data.length === 0) {
        throw ({ code: ERROR_CODES.MEMBER_NOT_FOUND.code, message: ERROR_CODES.MEMBER_NOT_FOUND.message });
      }

      const member = memberRes.data[0];
      const { familyId } = member;

      // 校验同族权限（敏感字段需同族）
      await checkFamilyMembership(uid, familyId);

      // 获取联系方式
      const contactRes = await db.collection('memberContact')
        .where({ memberId, isDeleted: false })
        .get();

      const contact = contactRes.data[0] || {};

      return {
        code: 0,
        msg: 'success',
        data: {
          id: member._id,
          familyId: member.familyId,
          name: member.name,
          generation: member.generation,
          avatar: member.avatar,
          gender: member.gender,
          birthday: member.birthday,
          relation: member.relation,
          role: member.role,
          // 敏感字段已校验同族
          phone: contact.phone,
          wechat: contact.wechat,
          email: contact.email,
          homeAddress: contact.homeAddress,
          graveAddress: contact.graveAddress
        }
      };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 添加家族成员
  async addMember(data) {
    const uid = await checkLogin(this);

    if (!data || typeof data !== 'object') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'data 参数必填' });
    }

    const { familyId, name, generation, parentId, avatar, gender, birthday, relation, contact } = data;

    if (!familyId || typeof familyId !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyId 必填' });
    }

    if (!name || typeof name !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'name 必填' });
    }

    if (!generation || typeof generation !== 'number' || generation < 1 || generation > 4) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'generation 必须为1-4' });
    }

    // 校验权限：管理员以上
    const memberInfo = await checkFamilyMembership(uid, familyId);
    checkFamilyRole(memberInfo, ROLES.ADMIN);

    try {
      // 添加成员
      const addRes = await db.collection('familyMember').add({
        familyId,
        userId: '', // 待绑定用户时填写
        name,
        generation,
        parentId: parentId || '',
        avatar: avatar || '',
        gender: gender || 0,
        birthday: birthday || null,
        relation: relation || '',
        role: ROLES.MEMBER,
        createTime: Date.now(),
        updateTime: Date.now(),
        isDeleted: false
      });

      const memberId = addRes.id;

      // 添加联系方式
      if (contact && typeof contact === 'object') {
        await db.collection('memberContact').add({
          memberId,
          phone: contact.phone || '',
          wechat: contact.wechat || '',
          email: contact.email || '',
          homeAddress: contact.homeAddress || {},
          graveAddress: contact.graveAddress || {},
          createTime: Date.now(),
          updateTime: Date.now()
        });
      }

      // 更新家族成员数
      await db.collection('family').doc(familyId).update({
        memberCount: dbCmd.inc(1),
        updateTime: Date.now()
      });

      return { code: 0, msg: 'success', data: { memberId } };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 更新成员信息
  async updateMember(memberId, data) {
    const uid = await checkLogin(this);

    if (!memberId || typeof memberId !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'memberId 必填' });
    }

    if (!data || typeof data !== 'object') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'data 参数必填' });
    }

    try {
      const memberRes = await db.collection('familyMember').doc(memberId).get();
      if (!memberRes.data || memberRes.data.length === 0) {
        throw ({ code: ERROR_CODES.MEMBER_NOT_FOUND.code, message: ERROR_CODES.MEMBER_NOT_FOUND.message });
      }

      const member = memberRes.data[0];
      const { familyId } = member;

      // 校验权限：管理员以上
      const memberInfo = await checkFamilyMembership(uid, familyId);
      checkFamilyRole(memberInfo, ROLES.ADMIN);

      const allowedFields = ['name', 'generation', 'parentId', 'avatar', 'gender', 'birthday', 'relation', 'role'];
      const updates = {};

      for (const field of allowedFields) {
        if (data[field] !== undefined) {
          if (field === 'role') {
            // 只有族主可修改角色
            if (memberInfo.role !== ROLES.OWNER) {
              throw ({ code: ERROR_CODES.PERMISSION_DENIED.code, message: '只有族主可修改角色' });
            }
            if (![ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER].includes(data[field])) {
              throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'role 值不合法' });
            }
          }
          updates[field] = data[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '至少更新一个字段' });
      }

      await db.collection('familyMember').doc(memberId).update({
        ...updates,
        updateTime: Date.now()
      });

      return { code: 0, msg: 'success' };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 按姓名搜索成员
  async searchMembers(familyId, keyword) {
    const uid = await checkLogin(this);

    if (!familyId || typeof familyId !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyId 必填' });
    }

    if (!keyword || typeof keyword !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'keyword 必填' });
    }

    // 校验家族成员
    await checkFamilyMembership(uid, familyId);

    try {
      const membersRes = await db.collection('familyMember')
        .where({
          familyId,
          isDeleted: false,
          name: new RegExp(keyword, 'i')
        })
        .orderBy('createTime', 'desc')
        .limit(PAGE_SIZE)
        .get();

      return {
        code: 0,
        msg: 'success',
        data: {
          list: membersRes.data.map(m => ({
            id: m._id,
            name: m.name,
            generation: m.generation,
            avatar: m.avatar,
            gender: m.gender,
            relation: m.relation
          })),
          total: membersRes.data.length
        }
      };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 按辈分分组获取成员列表
  async getContactsByGeneration(familyId) {
    const uid = await checkLogin(this);

    if (!familyId || typeof familyId !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyId 必填' });
    }

    // 校验家族成员
    await checkFamilyMembership(uid, familyId);

    try {
      const membersRes = await db.collection('familyMember')
        .where({ familyId, isDeleted: false })
        .orderBy('generation', 'asc')
        .orderBy('createTime', 'asc')
        .get();

      const grouped = {};
      for (const m of membersRes.data) {
        const gen = m.generation;
        if (!grouped[gen]) grouped[gen] = [];
        grouped[gen].push({
          id: m._id,
          name: m.name,
          avatar: m.avatar,
          gender: m.gender,
          relation: m.relation
        });
      }

      return { code: 0, msg: 'success', data: grouped };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 获取通讯录（含联系方式）
  async getContactList(familyId) {
    const uid = await checkLogin(this);

    if (!familyId || typeof familyId !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyId 必填' });
    }

    await checkFamilyMembership(uid, familyId);

    try {
      const membersRes = await db.collection('familyMember')
        .where({ familyId, isDeleted: false })
        .orderBy('createTime', 'asc')
        .get();

      // 批量获取联系方式
      const memberIds = membersRes.data.map(m => m._id);
      const contactsRes = memberIds.length > 0
        ? await db.collection('memberContact')
            .where({ memberId: dbCmd.in(memberIds), isDeleted: false })
            .get()
        : { data: [] };

      const contactMap = {};
      for (const c of contactsRes.data) {
        contactMap[c.memberId] = c;
      }

      const list = membersRes.data.map(m => {
        const contact = contactMap[m._id] || {};
        return {
          id: m._id,
          name: m.name,
          generation: m.generation,
          avatar: m.avatar,
          gender: m.gender,
          relation: m.relation,
          phone: contact.phone || '',
          wechat: contact.wechat || '',
          homeAddress: contact.homeAddress || '',
          graveAddress: contact.graveAddress || '',
          graveLocation: contact.graveLocation || null
        };
      });

      return { code: 0, msg: 'success', data: { list } };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 通过手机号邀请成员
  async inviteMember(familyId, phone) {
    const uid = await checkLogin(this);

    if (!familyId || typeof familyId !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'familyId 必填' });
    }

    if (!phone || typeof phone !== 'string') {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: 'phone 必填' });
    }

    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(phone)) {
      throw ({ code: ERROR_CODES.PARAM_ERROR.code, message: '手机号格式不正确' });
    }

    // 校验家族成员
    await checkFamilyMembership(uid, familyId);

    try {
      // 查找该手机号对应的用户
      const userRes = await db.collection('uni-id-users')
        .where({ phone, isDeleted: false })
        .get();

      if (!userRes.data || userRes.data.length === 0) {
        throw ({ code: ERROR_CODES.USER_NOT_FOUND.code, message: '该手机号未注册' });
      }

      const targetUser = userRes.data[0];
      const targetUid = targetUser._id;

      // 检查是否已加入家族
      const existRes = await db.collection('familyMember')
        .where({ familyId, userId: targetUid, isDeleted: false })
        .get();

      if (existRes.data && existRes.data.length > 0) {
        throw ({ code: ERROR_CODES.ALREADY_IN_FAMILY.code, message: '该用户已是家族成员' });
      }

      // 添加为家族成员
      await db.collection('familyMember').add({
        familyId,
        userId: targetUid,
        name: targetUser.nickname || '成员',
        generation: GENERATIONS.FIRST,
        parentId: '',
        avatar: targetUser.avatar || '',
        gender: targetUser.gender || 0,
        birthday: null,
        relation: '成员',
        role: ROLES.MEMBER,
        createTime: Date.now(),
        updateTime: Date.now(),
        isDeleted: false
      });

      // 更新用户家族列表
      await db.collection('uni-id-users').doc(targetUid).update({
        familyIds: dbCmd.push([familyId]),
        updateTime: Date.now()
      });

      // 更新家族成员数
      await db.collection('family').doc(familyId).update({
        memberCount: dbCmd.inc(1),
        updateTime: Date.now()
      });

      return { code: 0, msg: 'success' };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  // 获取我加入的所有家族
  async getMyFamilies() {
    const uid = await checkLogin(this);

    try {
      const userRes = await db.collection('uni-id-users').doc(uid).get();
      const user = userRes.data[0];
      const familyIds = user.familyIds || [];

      if (familyIds.length === 0) {
        return { code: 0, msg: 'success', data: [] };
      }

      const familiesRes = await db.collection('family')
        .where({
          _id: dbCmd.in(familyIds),
          isDeleted: false
        })
        .orderBy('createTime', 'desc')
        .get();

      const list = await Promise.all(familiesRes.data.map(async family => {
        const memberRes = await db.collection('familyMember')
          .where({ familyId: family._id, userId: uid, isDeleted: false })
          .get();
        const role = memberRes.data[0] ? memberRes.data[0].role : ROLES.MEMBER;

        return {
          id: family._id,
          familyName: family.familyName,
          description: family.description,
          coverImage: family.coverImage,
          memberCount: family.memberCount,
          role,
          isOwner: role === ROLES.OWNER
        };
      }));

      return { code: 0, msg: 'success', data: list };
    } catch (e) {
      throw ({ code: e.code || ERROR_CODES.DB_ERROR.code, message: e.message || ERROR_CODES.DB_ERROR.message });
    }
  },

  _beforeError(err) {
    console.error('[co-family] error:', JSON.stringify(err))
    return {
      code: err.code || -1,
      msg: err.message || '系统错误',
      message: err.message || '系统错误'
    };
  }
};
