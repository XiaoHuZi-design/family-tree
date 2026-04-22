'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
const uniId = require('uni-id-common');

module.exports = {
  async getConversations(page = 1, pageSize = 20) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      page = Math.max(1, parseInt(page) || 1);
      pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 20));

      const skip = (page - 1) * pageSize;

      const conversationsRes = await db.collection('chatConversation')
        .where({
          isDeleted: false,
          'members.userId': uid
        })
        .field({
          _id: true,
          type: true,
          name: true,
          members: true,
          lastMessage: true,
          unreadCount: true,
          updateTime: true
        })
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
          unreadCount: unreadCount,
          updateTime: conv.updateTime
        };
      });

      return {
        code: 0,
        msg: 'success',
        data: {
          list: conversations,
          page,
          pageSize,
          hasMore: conversations.length === pageSize
        }
      };
    } catch (e) {
      console.error('getConversations error:', e);
      return { code: 500, msg: '获取会话列表失败', error: e.message };
    }
  },

  async getMessages(conversationId, page = 1, pageSize = 50) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      if (!conversationId) {
        return { code: 400, msg: 'conversationId不能为空' };
      }

      page = Math.max(1, parseInt(page) || 1);
      pageSize = Math.min(100, Math.max(1, parseInt(pageSize) || 50));

      const conversationRes = await db.collection('chatConversation')
        .doc(conversationId)
        .get();

      if (!conversationRes.data || conversationRes.data.length === 0) {
        return { code: 404, msg: '会话不存在' };
      }

      const conversation = conversationRes.data[0];
      if (conversation.isDeleted) {
        return { code: 404, msg: '会话已删除' };
      }

      const isMember = conversation.members.some(m => m.userId === uid);
      if (!isMember) {
        return { code: 403, msg: '无权访问该会话' };
      }

      const skip = (page - 1) * pageSize;

      const messagesRes = await db.collection('chatMessage')
        .where({
          conversationId: conversationId,
          isDeleted: false
        })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();

      const messages = messagesRes.data.reverse();

      return {
        code: 0,
        msg: 'success',
        data: {
          list: messages,
          page,
          pageSize,
          hasMore: messages.length === pageSize
        }
      };
    } catch (e) {
      console.error('getMessages error:', e);
      return { code: 500, msg: '获取消息失败', error: e.message };
    }
  },

  async sendMessage(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      const { conversationId, type, content, fileID, latitude, longitude, address } = data;

      if (!conversationId) {
        return { code: 400, msg: 'conversationId不能为空' };
      }

      const conversationRes = await db.collection('chatConversation')
        .doc(conversationId)
        .get();

      if (!conversationRes.data || conversationRes.data.length === 0) {
        return { code: 404, msg: '会话不存在' };
      }

      const conversation = conversationRes.data[0];
      if (conversation.isDeleted) {
        return { code: 404, msg: '会话已删除' };
      }

      const isMember = conversation.members.some(m => m.userId === uid);
      if (!isMember) {
        return { code: 403, msg: '不是会话成员' };
      }

      if (!type) {
        return { code: 400, msg: '消息类型不能为空' };
      }

      const validTypes = ['text', 'image', 'location'];
      if (!validTypes.includes(type)) {
        return { code: 400, msg: '无效的消息类型' };
      }

      if (type === 'text') {
        if (!content || content.trim() === '') {
          return { code: 400, msg: '文本消息内容不能为空' };
        }
      } else if (type === 'image') {
        if (!fileID) {
          return { code: 400, msg: '图片消息需要fileID' };
        }
      } else if (type === 'location') {
        if (latitude === undefined || longitude === undefined || !address) {
          return { code: 400, msg: '位置消息需要latitude、longitude和address' };
        }
      }

      const messageData = {
        conversationId,
        senderId: uid,
        type,
        createTime: new Date().getTime(),
        isRead: false,
        isDeleted: false
      };

      if (type === 'text') {
        messageData.content = content;
      } else if (type === 'image') {
        messageData.fileID = fileID;
      } else if (type === 'location') {
        messageData.latitude = latitude;
        messageData.longitude = longitude;
        messageData.address = address;
      }

      const messageRes = await db.collection('chatMessage').add(messageData);

      const lastMessage = {
        content: type === 'text' ? content : (type === 'image' ? '[图片]' : '[位置]'),
        type,
        senderId: uid,
        createTime: messageData.createTime
      };

      const updateData = {
        lastMessage,
        updateTime: messageData.createTime
      };

      const otherMembers = conversation.members.filter(m => m.userId !== uid);
      if (otherMembers.length > 0) {
        const unreadUpdate = {};
        otherMembers.forEach(m => {
          unreadUpdate[`unreadCount.${m.userId}`] = dbCmd.inc(1);
        });
        Object.assign(updateData, unreadUpdate);
      }

      await db.collection('chatConversation')
        .doc(conversationId)
        .update(updateData);

      return {
        code: 0,
        msg: 'success',
        data: {
          messageId: messageRes.id,
          ...messageData
        }
      };
    } catch (e) {
      console.error('sendMessage error:', e);
      return { code: 500, msg: '发送消息失败', error: e.message };
    }
  },

  async createConversation(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      const { targetUserId } = data;

      if (!targetUserId) {
        return { code: 400, msg: 'targetUserId不能为空' };
      }

      if (targetUserId === uid) {
        return { code: 400, msg: '不能与自己创建会话' };
      }

      const existingConvRes = await db.collection('chatConversation')
        .where({
          type: 'private',
          isDeleted: false,
          members: dbCmd.elemMatch({
            userId: uid
          })
        })
        .get();

      const existingConv = existingConvRes.data.find(conv =>
        conv.members.some(m => m.userId === targetUserId)
      );

      if (existingConv) {
        return {
          code: 0,
          msg: 'success',
          data: {
            conversationId: existingConv._id,
            existed: true
          }
        };
      }

      const conversationData = {
        type: 'private',
        members: [
          { userId: uid, joinTime: new Date().getTime() },
          { userId: targetUserId, joinTime: new Date().getTime() }
        ],
        lastMessage: null,
        unreadCount: {},
        createTime: new Date().getTime(),
        updateTime: new Date().getTime(),
        isDeleted: false
      };

      const conversationRes = await db.collection('chatConversation').add(conversationData);

      return {
        code: 0,
        msg: 'success',
        data: {
          conversationId: conversationRes.id,
          existed: false
        }
      };
    } catch (e) {
      console.error('createConversation error:', e);
      return { code: 500, msg: '创建会话失败', error: e.message };
    }
  },

  async createGroupChat(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      const { familyId, name } = data;

      if (!familyId) {
        return { code: 400, msg: 'familyId不能为空' };
      }

      if (!name || name.trim() === '') {
        return { code: 400, msg: '群名不能为空' };
      }

      const familyMemberRes = await db.collection('familyMember')
        .where({
          familyId,
          userId: uid,
          isDeleted: false
        })
        .get();

      if (!familyMemberRes.data || familyMemberRes.data.length === 0) {
        return { code: 403, msg: '不是家族成员' };
      }

      const allMembersRes = await db.collection('familyMember')
        .where({
          familyId,
          isDeleted: false
        })
        .field({
          userId: true
        })
        .get();

      const members = allMembersRes.data.map(m => ({
        userId: m.userId,
        joinTime: new Date().getTime()
      }));

      const conversationData = {
        type: 'group',
        name: name.trim(),
        members,
        lastMessage: null,
        unreadCount: {},
        createTime: new Date().getTime(),
        updateTime: new Date().getTime(),
        isDeleted: false
      };

      const conversationRes = await db.collection('chatConversation').add(conversationData);

      return {
        code: 0,
        msg: 'success',
        data: {
          conversationId: conversationRes.id,
          memberCount: members.length
        }
      };
    } catch (e) {
      console.error('createGroupChat error:', e);
      return { code: 500, msg: '创建群聊失败', error: e.message };
    }
  },

  async markAsRead(conversationId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      if (!conversationId) {
        return { code: 400, msg: 'conversationId不能为空' };
      }

      const conversationRes = await db.collection('chatConversation')
        .doc(conversationId)
        .get();

      if (!conversationRes.data || conversationRes.data.length === 0) {
        return { code: 404, msg: '会话不存在' };
      }

      const conversation = conversationRes.data[0];
      if (conversation.isDeleted) {
        return { code: 404, msg: '会话已删除' };
      }

      const isMember = conversation.members.some(m => m.userId === uid);
      if (!isMember) {
        return { code: 403, msg: '无权操作该会话' };
      }

      await db.collection('chatConversation')
        .doc(conversationId)
        .update({
          [`unreadCount.${uid}`]: 0
        });

      await db.collection('chatMessage')
        .where({
          conversationId,
          senderId: dbCmd.neq(uid),
          isRead: false
        })
        .update({
          isRead: true
        });

      return {
        code: 0,
        msg: 'success',
        data: {
          conversationId
        }
      };
    } catch (e) {
      console.error('markAsRead error:', e);
      return { code: 500, msg: '标记已读失败', error: e.message };
    }
  },

  async getGroupMembers(conversationId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      if (!conversationId) {
        return { code: 400, msg: 'conversationId不能为空' };
      }

      const conversationRes = await db.collection('chatConversation')
        .doc(conversationId)
        .get();

      if (!conversationRes.data || conversationRes.data.length === 0) {
        return { code: 404, msg: '会话不存在' };
      }

      const conversation = conversationRes.data[0];
      if (conversation.isDeleted) {
        return { code: 404, msg: '会话已删除' };
      }

      if (conversation.type !== 'group') {
        return { code: 400, msg: '不是群聊会话' };
      }

      const isMember = conversation.members.some(m => m.userId === uid);
      if (!isMember) {
        return { code: 403, msg: '无权访问该会话' };
      }

      const memberIds = conversation.members.map(m => m.userId);

      const usersRes = await db.collection('uni-id-users')
        .where({
          _id: dbCmd.in(memberIds)
        })
        .field({
          _id: true,
          nickname: true,
          avatar: true
        })
        .get();

      const membersWithJoinTime = conversation.members.map(m => {
        const user = usersRes.data.find(u => u._id === m.userId);
        return {
          userId: m.userId,
          joinTime: m.joinTime,
          nickname: user ? user.nickname : '',
          avatar: user ? user.avatar : ''
        };
      });

      return {
        code: 0,
        msg: 'success',
        data: {
          members: membersWithJoinTime
        }
      };
    } catch (e) {
      console.error('getGroupMembers error:', e);
      return { code: 500, msg: '获取群成员失败', error: e.message };
    }
  },

  async leaveGroup(conversationId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      if (!conversationId) {
        return { code: 400, msg: 'conversationId不能为空' };
      }

      const conversationRes = await db.collection('chatConversation')
        .doc(conversationId)
        .get();

      if (!conversationRes.data || conversationRes.data.length === 0) {
        return { code: 404, msg: '会话不存在' };
      }

      const conversation = conversationRes.data[0];
      if (conversation.isDeleted) {
        return { code: 404, msg: '会话已删除' };
      }

      if (conversation.type !== 'group') {
        return { code: 400, msg: '不能退出私聊' };
      }

      const isMember = conversation.members.some(m => m.userId === uid);
      if (!isMember) {
        return { code: 403, msg: '不是群成员' };
      }

      const updatedMembers = conversation.members.filter(m => m.userId !== uid);

      await db.collection('chatConversation')
        .doc(conversationId)
        .update({
          members: updatedMembers,
          updateTime: new Date().getTime()
        });

      return {
        code: 0,
        msg: 'success',
        data: {
          conversationId,
          memberCount: updatedMembers.length
        }
      };
    } catch (e) {
      console.error('leaveGroup error:', e);
      return { code: 500, msg: '退出群聊失败', error: e.message };
    }
  },

  _before: async function () {
    const methodName = this.getMethodName();
    const publicMethods = ['getConversations', 'getMessages', 'getGroupMembers'];

    if (!publicMethods.includes(methodName)) {
      const { uid } = await this.getContext();
      if (!uid) {
        throw new Error('UNAUTHORIZED');
      }
    }
  },

  async getContext() {
    try {
      const uniIdInst = await uniId.create(this.getUniId());
      const { uid } = await uniIdInst.checkToken(this.getUniIdToken(), {});
      return { uid };
    } catch (e) {
      return { uid: null };
    }
  }
};
