'use strict';
const db = uniCloud.database();
const dbCmd = db.command;

module.exports = {
  async getContext() {
    try {
      const token = this.getUniIdToken && this.getUniIdToken();
      if (!token) return { uid: null };

      const userRes = await db.collection('uni-id-users')
        .where({ token: token, tokenExpired: dbCmd.gt(Date.now()) })
        .field({ _id: true })
        .limit(1)
        .get();

      if (!userRes.data || !userRes.data.length) return { uid: null };
      return { uid: userRes.data[0]._id };
    } catch (e) {
      return { uid: null };
    }
  },

  async getMoments(familyId, page, pageSize) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };
      if (!familyId) return { code: 400, msg: 'familyId不能为空' };

      const memberRes = await db.collection('familyMember')
        .where({ familyId, userId: uid, isDeleted: false }).get();
      if (!memberRes.data || !memberRes.data.length) return { code: 403, msg: '不是家族成员' };

      page = Math.max(1, parseInt(page) || 1);
      pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 20));
      const skip = (page - 1) * pageSize;

      const momentsRes = await db.collection('moments')
        .where({ familyId, isDeleted: false })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();

      const authorIds = momentsRes.data.map(m => m.authorId);
      let authorMap = {};
      if (authorIds.length > 0) {
        const usersRes = await db.collection('uni-id-users')
          .where({ _id: dbCmd.in(authorIds) })
          .field({ _id: true, nickname: true, avatar: true })
          .get();
        usersRes.data.forEach(u => { authorMap[u._id] = { nickname: u.nickname || '', avatar: u.avatar || '' }; });
      }

      const moments = [];
      for (const moment of momentsRes.data) {
        const isLikedRes = await db.collection('momentsLike')
          .where({ momentId: moment._id, userId: uid }).get();

        moments.push({
          _id: moment._id,
          familyId: moment.familyId,
          authorId: moment.authorId,
          author: authorMap[moment.authorId] || {},
          content: moment.content,
          images: moment.images || [],
          location: moment.location,
          likeCount: moment.likeCount || 0,
          commentCount: moment.commentCount || 0,
          isLiked: isLikedRes.data.length > 0,
          createTime: moment.createTime,
          updateTime: moment.updateTime
        });
      }

      return { code: 0, msg: 'success', data: { list: moments, page, pageSize, hasMore: moments.length === pageSize } };
    } catch (e) {
      console.error('getMoments error:', e);
      return { code: 500, msg: '获取朋友圈失败', error: e.message };
    }
  },

  async publishMoment(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };

      const { familyId, content, images, location } = data;
      if (!familyId) return { code: 400, msg: 'familyId不能为空' };
      if (!content || !content.trim()) return { code: 400, msg: '动态内容不能为空' };
      if (content.length > 500) return { code: 400, msg: '动态内容最多500字' };

      const memberRes = await db.collection('familyMember')
        .where({ familyId, userId: uid, isDeleted: false }).get();
      if (!memberRes.data || !memberRes.data.length) return { code: 403, msg: '不是家族成员' };

      const momentData = {
        familyId,
        authorId: uid,
        content: content.trim(),
        images: images || [],
        location: location || null,
        likeCount: 0,
        commentCount: 0,
        createTime: Date.now(),
        updateTime: Date.now(),
        isDeleted: false
      };

      const momentRes = await db.collection('moments').add(momentData);
      return { code: 0, msg: 'success', data: { momentId: momentRes.id } };
    } catch (e) {
      console.error('publishMoment error:', e);
      return { code: 500, msg: '发布动态失败', error: e.message };
    }
  },

  async likeMoment(momentId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };
      if (!momentId) return { code: 400, msg: 'momentId不能为空' };

      const momentRes = await db.collection('moments').doc(momentId).get();
      if (!momentRes.data || !momentRes.data.length) return { code: 404, msg: '动态不存在' };
      const moment = momentRes.data[0];
      if (moment.isDeleted) return { code: 404, msg: '动态已删除' };

      const existingLikeRes = await db.collection('momentsLike')
        .where({ momentId, userId: uid }).get();

      if (existingLikeRes.data && existingLikeRes.data.length > 0) {
        await db.collection('momentsLike').doc(existingLikeRes.data[0]._id).remove();
        await db.collection('moments').doc(momentId).update({ likeCount: dbCmd.inc(-1), updateTime: Date.now() });
        return { code: 0, msg: 'success', data: { liked: false, likeCount: moment.likeCount - 1 } };
      }

      await db.collection('momentsLike').add({ momentId, userId: uid, createTime: Date.now() });
      await db.collection('moments').doc(momentId).update({ likeCount: dbCmd.inc(1), updateTime: Date.now() });
      return { code: 0, msg: 'success', data: { liked: true, likeCount: moment.likeCount + 1 } };
    } catch (e) {
      console.error('likeMoment error:', e);
      return { code: 500, msg: '点赞失败', error: e.message };
    }
  },

  async commentMoment(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };

      const { momentId, content } = data;
      if (!momentId) return { code: 400, msg: 'momentId不能为空' };
      if (!content || !content.trim()) return { code: 400, msg: '评论不能为空' };
      if (content.length > 200) return { code: 400, msg: '评论最多200字' };

      const momentRes = await db.collection('moments').doc(momentId).get();
      if (!momentRes.data || !momentRes.data.length) return { code: 404, msg: '动态不存在' };

      const commentData = {
        momentId,
        authorId: uid,
        content: content.trim(),
        replyTo: null,
        replyToAuthor: null,
        createTime: Date.now(),
        isDeleted: false
      };

      const commentRes = await db.collection('momentsComment').add(commentData);
      await db.collection('moments').doc(momentId).update({ commentCount: dbCmd.inc(1), updateTime: Date.now() });

      return { code: 0, msg: 'success', data: { commentId: commentRes.id } };
    } catch (e) {
      console.error('commentMoment error:', e);
      return { code: 500, msg: '评论失败', error: e.message };
    }
  },

  async deleteMoment(momentId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };
      if (!momentId) return { code: 400, msg: 'momentId不能为空' };

      const momentRes = await db.collection('moments').doc(momentId).get();
      if (!momentRes.data || !momentRes.data.length) return { code: 404, msg: '动态不存在' };
      const moment = momentRes.data[0];
      if (moment.isDeleted) return { code: 404, msg: '动态已删除' };
      if (moment.authorId !== uid) return { code: 403, msg: '只能删除自己的动态' };

      await db.collection('moments').doc(momentId).update({ isDeleted: true, updateTime: Date.now() });
      return { code: 0, msg: 'success', data: { momentId } };
    } catch (e) {
      console.error('deleteMoment error:', e);
      return { code: 500, msg: '删除失败', error: e.message };
    }
  },

  async getMomentDetail(momentId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) return { code: 401, msg: '未登录' };
      if (!momentId) return { code: 400, msg: 'momentId不能为空' };

      const momentRes = await db.collection('moments').doc(momentId).get();
      if (!momentRes.data || !momentRes.data.length) return { code: 404, msg: '动态不存在' };
      const moment = momentRes.data[0];
      if (moment.isDeleted) return { code: 404, msg: '动态已删除' };

      const authorRes = await db.collection('uni-id-users').where({ _id: moment.authorId })
        .field({ _id: true, nickname: true, avatar: true }).get();
      const author = authorRes.data[0] || {};

      const isLikedRes = await db.collection('momentsLike').where({ momentId, userId: uid }).get();

      const commentsRes = await db.collection('momentsComment')
        .where({ momentId, isDeleted: false }).orderBy('createTime', 'asc').get();

      const commentAuthorIds = commentsRes.data.map(c => c.authorId);
      let commentAuthorMap = {};
      if (commentAuthorIds.length > 0) {
        const usersRes = await db.collection('uni-id-users')
          .where({ _id: dbCmd.in(commentAuthorIds) })
          .field({ _id: true, nickname: true, avatar: true }).get();
        usersRes.data.forEach(u => { commentAuthorMap[u._id] = { nickname: u.nickname || '', avatar: u.avatar || '' }; });
      }

      const comments = commentsRes.data.map(c => ({
        _id: c._id, momentId: c.momentId, authorId: c.authorId,
        author: commentAuthorMap[c.authorId] || {},
        content: c.content, createTime: c.createTime
      }));

      return {
        code: 0, msg: 'success',
        data: {
          moment: {
            _id: moment._id, familyId: moment.familyId, authorId: moment.authorId,
            author, content: moment.content, images: moment.images || [],
            location: moment.location, likeCount: moment.likeCount || 0,
            commentCount: moment.commentCount || 0, isLiked: isLikedRes.data.length > 0,
            createTime: moment.createTime, updateTime: moment.updateTime
          },
          comments
        }
      };
    } catch (e) {
      console.error('getMomentDetail error:', e);
      return { code: 500, msg: '获取动态失败', error: e.message };
    }
  }
};
