'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
  async getContext() {
    try {
      const token = this.getUniIdToken && this.getUniIdToken();
      if (!token) return { uid: null };

      const userRes = await db.collection('uni-id-users')
        .where({
          token: token,
          tokenExpired: dbCmd.gt(Date.now())
        })
        .field({ _id: true })
        .limit(1)
        .get();

      if (!userRes.data || userRes.data.length === 0) {
        return { uid: null };
      }
      return { uid: userRes.data[0]._id };
    } catch (e) {
      return { uid: null };
    }
  },

  async getConversations(page, pageSize) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };

      page = Math.max(1, parseInt(page) || 1);
      pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 20));
      const skip = (page - 1) * pageSize;

      const conversationsRes = await db.collection('chatConversation')
        .where({ isDeleted: false, 'members.userId': uid })
        .field({ _id: true, type: true, name: true, members: true, lastMessage: true, unreadCount: true, updateTime: true })
        .orderBy('updateTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();

      const conversations = conversationsRes.data.map(conv => {
        const unreadCount = conv.unreadCount && conv.unreadCount[uid] || 0;
        return {
          _id: conv._id,
          type: conv.type,
          name: conv.name,
          members: conv.members,
          lastMessage: conv.lastMessage,
          unreadCount,
          updateTime: conv.updateTime
        };
      });

      return { code: 0, msg: 'success', data: { list: conversations, page, pageSize, hasMore: conversations.length === pageSize } };
    } catch (e) {
      console.error('getConversations error:', e);
      return { code: 500, msg: '获取会话列表失败', error: e.message };
    }
  },

  async getMessages(conversationId, page, pageSize) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };
      if (!conversationId) return { code: 400, msg: 'conversationId不能为空' };

      page = Math.max(1, parseInt(page) || 1);
      pageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 50));

      const conversationRes = await db.collection('chatConversation').doc(conversationId).get();
      if (!conversationRes.data || conversationRes.data.length === 0) return { code: 404, msg: '会话不存在' };

      const conversation = conversationRes.data[0];
      if (conversation.isDeleted) return { code: 404, msg: '会话已删除' };
      if (!conversation.members.some(m => m.userId === uid)) return { code: 403, msg: '无权访问该会话' };

      const skip = (page - 1) * pageSize;
      const messagesRes = await db.collection('chatMessage')
        .where({ conversationId, isDeleted: false })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();

      const messages = messagesRes.data.reverse();

      return { code: 0, msg: 'success', data: { list: messages, page, pageSize, hasMore: messages.length === pageSize } };
    } catch (e) {
      console.error('getMessages error:', e);
      return { code: 500, msg: '获取消息失败', error: e.message };
    }
  },

  async sendMessage(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };

      const { conversationId, type, content } = data;
      if (!conversationId) return { code: 400, msg: 'conversationId不能为空' };

      const conversationRes = await db.collection('chatConversation').doc(conversationId).get();
      if (!conversationRes.data || conversationRes.data.length === 0) return { code: 404, msg: '会话不存在' };

      const conversation = conversationRes.data[0];
      if (conversation.isDeleted) return { code: 404, msg: '会话已删除' };
      if (!conversation.members.some(m => m.userId === uid)) return { code: 403, msg: '不是会话成员' };

      if (!type) return { code: 400, msg: '消息类型不能为空' };
      if (!['text', 'image', 'location'].includes(type)) return { code: 400, msg: '无效的消息类型' };
      if (type === 'text' && (!content || !content.trim())) return { code: 400, msg: '文本消息不能为空' };

      const messageData = {
        conversationId,
        senderId: uid,
        type,
        content: type === 'text' ? content : '',
        createTime: Date.now(),
        isRead: false,
        isDeleted: false
      };

      const messageRes = await db.collection('chatMessage').add(messageData);

      const lastMessage = {
        content: type === 'text' ? content : (type === 'image' ? '[图片]' : '[位置]'),
        type,
        senderId: uid,
        createTime: messageData.createTime
      };

      const updateData = { lastMessage, updateTime: messageData.createTime };
      const otherMembers = conversation.members.filter(m => m.userId !== uid);
      if (otherMembers.length > 0) {
        otherMembers.forEach(m => { updateData['unreadCount.' + m.userId] = dbCmd.inc(1); });
      }

      await db.collection('chatConversation').doc(conversationId).update(updateData);

      return { code: 0, msg: 'success', data: { messageId: messageRes.id } };
    } catch (e) {
      console.error('sendMessage error:', e);
      return { code: 500, msg: '发送消息失败', error: e.message };
    }
  },

  async createGroup(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };

      const { familyId, name } = data;
      if (!familyId) return { code: 400, msg: 'familyId不能为空' };
      if (!name || !name.trim()) return { code: 400, msg: '群名不能为空' };

      const familyMemberRes = await db.collection('familyMember')
        .where({ familyId, userId: uid, isDeleted: false }).get();
      if (!familyMemberRes.data || !familyMemberRes.data.length) return { code: 403, msg: '不是家族成员' };

      const allMembersRes = await db.collection('familyMember')
        .where({ familyId, isDeleted: false }).field({ userId: true }).get();
      const members = allMembersRes.data.map(m => ({ userId: m.userId, joinTime: Date.now() }));

      const conversationRes = await db.collection('chatConversation').add({
        type: 'group',
        name: name.trim(),
        members,
        lastMessage: null,
        unreadCount: {},
        createTime: Date.now(),
        updateTime: Date.now(),
        isDeleted: false
      });

      return { code: 0, msg: 'success', data: { conversationId: conversationRes.id, memberCount: members.length } };
    } catch (e) {
      console.error('createGroup error:', e);
      return { code: 500, msg: '创建群聊失败', error: e.message };
    }
  },

  async markAsRead(conversationId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };
      if (!conversationId) return { code: 400, msg: 'conversationId不能为空' };

      const conversationRes = await db.collection('chatConversation').doc(conversationId).get();
      if (!conversationRes.data || !conversationRes.data.length) return { code: 404, msg: '会话不存在' };
      const conversation = conversationRes.data[0];
      if (conversation.isDeleted) return { code: 404, msg: '会话已删除' };
      if (!conversation.members.some(m => m.userId === uid)) return { code: 403, msg: '无权操作' };

      await db.collection('chatConversation').doc(conversationId).update({ ['unreadCount.' + uid]: 0 });
      await db.collection('chatMessage').where({ conversationId, senderId: dbCmd.neq(uid), isRead: false }).update({ isRead: true });

      return { code: 0, msg: 'success', data: { conversationId } };
    } catch (e) {
      console.error('markAsRead error:', e);
      return { code: 500, msg: '标记已读失败', error: e.message };
    }
  },

  _before: async function () {
    const methodName = this.getMethodName();
    const publicMethods = ['getConversations', 'getMessages'];
    if (!publicMethods.includes(methodName)) {
      const { uid } = await this.getContext();
      if (!uid) throw new Error('UNAUTHORIZED');
    }
  }
};
