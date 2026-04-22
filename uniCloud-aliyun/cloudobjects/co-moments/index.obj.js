'use strict';
const db = uniCloud.database();
const dbCmd = db.command;
const uniId = require('uni-id-common');

module.exports = {
  async getMoments(familyId, page = 1, pageSize = 20) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      if (!familyId) {
        return { code: 400, msg: 'familyId不能为空' };
      }

      const memberRes = await db.collection('familyMember')
        .where({
          familyId,
          userId: uid,
          isDeleted: false
        })
        .get();

      if (!memberRes.data || memberRes.data.length === 0) {
        return { code: 403, msg: '不是家族成员' };
      }

      page = Math.max(1, parseInt(page) || 1);
      pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 20));

      const skip = (page - 1) * pageSize;

      const momentsRes = await db.collection('moments')
        .where({
          familyId,
          isDeleted: false
        })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();

      const authorIds = momentsRes.data.map(m => m.authorId);
      let authorMap = {};

      if (authorIds.length > 0) {
        const usersRes = await db.collection('uni-id-users')
          .where({
            _id: dbCmd.in(authorIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatar: true
          })
          .get();

        authorMap = {};
        usersRes.data.forEach(user => {
          authorMap[user._id] = {
            nickname: user.nickname || '',
            avatar: user.avatar || ''
          };
        });
      }

      const moments = await Promise.all(momentsRes.data.map(async moment => {
        const isLikedRes = await db.collection('momentsLike')
          .where({
            momentId: moment._id,
            userId: uid
          })
          .get();

        return {
          _id: moment._id,
          familyId: moment.familyId,
          authorId: moment.authorId,
          author: authorMap[moment.authorId] || {},
          content: moment.content,
          images: moment.images || [],
          location: moment.location,
          likeCount: moment.likeCount,
          commentCount: moment.commentCount,
          isLiked: isLikedRes.data.length > 0,
          createTime: moment.createTime,
          updateTime: moment.updateTime
        };
      }));

      return {
        code: 0,
        msg: 'success',
        data: {
          list: moments,
          page,
          pageSize,
          hasMore: moments.length === pageSize
        }
      };
    } catch (e) {
      console.error('getMoments error:', e);
      return { code: 500, msg: '获取朋友圈失败', error: e.message };
    }
  },

  async publishMoment(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      const { familyId, content, images, location } = data;

      if (!familyId) {
        return { code: 400, msg: 'familyId不能为空' };
      }

      const memberRes = await db.collection('familyMember')
        .where({
          familyId,
          userId: uid,
          isDeleted: false
        })
        .get();

      if (!memberRes.data || memberRes.data.length === 0) {
        return { code: 403, msg: '不是家族成员' };
      }

      if (!content || content.trim() === '') {
        return { code: 400, msg: '动态内容不能为空' };
      }

      if (content.length > 500) {
        return { code: 400, msg: '动态内容最多500字' };
      }

      if (images && (!Array.isArray(images) || images.length > 9)) {
        return { code: 400, msg: '最多上传9张图片' };
      }

      const momentData = {
        familyId,
        authorId: uid,
        content: content.trim(),
        images: images || [],
        location: location || null,
        likeCount: 0,
        commentCount: 0,
        createTime: new Date().getTime(),
        updateTime: new Date().getTime(),
        isDeleted: false
      };

      const momentRes = await db.collection('moments').add(momentData);

      return {
        code: 0,
        msg: 'success',
        data: {
          momentId: momentRes.id,
          ...momentData
        }
      };
    } catch (e) {
      console.error('publishMoment error:', e);
      return { code: 500, msg: '发布动态失败', error: e.message };
    }
  },

  async getMomentDetail(momentId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      if (!momentId) {
        return { code: 400, msg: 'momentId不能为空' };
      }

      const momentRes = await db.collection('moments')
        .doc(momentId)
        .get();

      if (!momentRes.data || momentRes.data.length === 0) {
        return { code: 404, msg: '动态不存在' };
      }

      const moment = momentRes.data[0];
      if (moment.isDeleted) {
        return { code: 404, msg: '动态已删除' };
      }

      const memberRes = await db.collection('familyMember')
        .where({
          familyId: moment.familyId,
          userId: uid,
          isDeleted: false
        })
        .get();

      if (!memberRes.data || memberRes.data.length === 0) {
        return { code: 403, msg: '无权查看该动态' };
      }

      const authorRes = await db.collection('uni-id-users')
        .where({
          _id: moment.authorId
        })
        .field({
          _id: true,
          nickname: true,
          avatar: true
        })
        .get();

      const author = authorRes.data[0] || {};

      const isLikedRes = await db.collection('momentsLike')
        .where({
          momentId,
          userId: uid
        })
        .get();

      const commentsRes = await db.collection('momentsComment')
        .where({
          momentId,
          isDeleted: false
        })
        .orderBy('createTime', 'asc')
        .get();

      const commentAuthorIds = commentsRes.data.map(c => c.authorId);
      let commentAuthorMap = {};

      if (commentAuthorIds.length > 0) {
        const usersRes = await db.collection('uni-id-users')
          .where({
            _id: dbCmd.in(commentAuthorIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatar: true
          })
          .get();

        commentAuthorMap = {};
        usersRes.data.forEach(user => {
          commentAuthorMap[user._id] = {
            nickname: user.nickname || '',
            avatar: user.avatar || ''
          };
        });
      }

      const comments = commentsRes.data.map(comment => ({
        _id: comment._id,
        momentId: comment.momentId,
        authorId: comment.authorId,
        author: commentAuthorMap[comment.authorId] || {},
        content: comment.content,
        replyTo: comment.replyTo,
        replyToAuthor: comment.replyToAuthor,
        createTime: comment.createTime
      }));

      const likesRes = await db.collection('momentsLike')
        .where({
          momentId
        })
        .orderBy('createTime', 'desc')
        .limit(20)
        .get();

      const likeUserIds = likesRes.data.map(l => l.userId);
      let likeUserMap = {};

      if (likeUserIds.length > 0) {
        const usersRes = await db.collection('uni-id-users')
          .where({
            _id: dbCmd.in(likeUserIds)
          })
          .field({
            _id: true,
            nickname: true,
            avatar: true
          })
          .get();

        likeUserMap = {};
        usersRes.data.forEach(user => {
          likeUserMap[user._id] = {
            nickname: user.nickname || '',
            avatar: user.avatar || ''
          };
        });
      }

      const likes = likesRes.data.map(like => ({
        userId: like.userId,
        user: likeUserMap[like.userId] || {},
        createTime: like.createTime
      }));

      return {
        code: 0,
        msg: 'success',
        data: {
          moment: {
            _id: moment._id,
            familyId: moment.familyId,
            authorId: moment.authorId,
            author,
            content: moment.content,
            images: moment.images || [],
            location: moment.location,
            likeCount: moment.likeCount,
            commentCount: moment.commentCount,
            isLiked: isLikedRes.data.length > 0,
            createTime: moment.createTime,
            updateTime: moment.updateTime
          },
          comments,
          likes
        }
      };
    } catch (e) {
      console.error('getMomentDetail error:', e);
      return { code: 500, msg: '获取动态详情失败', error: e.message };
    }
  },

  async likeMoment(momentId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      if (!momentId) {
        return { code: 400, msg: 'momentId不能为空' };
      }

      const momentRes = await db.collection('moments')
        .doc(momentId)
        .get();

      if (!momentRes.data || momentRes.data.length === 0) {
        return { code: 404, msg: '动态不存在' };
      }

      const moment = momentRes.data[0];
      if (moment.isDeleted) {
        return { code: 404, msg: '动态已删除' };
      }

      const memberRes = await db.collection('familyMember')
        .where({
          familyId: moment.familyId,
          userId: uid,
          isDeleted: false
        })
        .get();

      if (!memberRes.data || memberRes.data.length === 0) {
        return { code: 403, msg: '无权操作该动态' };
      }

      const existingLikeRes = await db.collection('momentsLike')
        .where({
          momentId,
          userId: uid
        })
        .get();

      if (existingLikeRes.data && existingLikeRes.data.length > 0) {
        await db.collection('momentsLike')
          .doc(existingLikeRes.data[0]._id)
          .remove();

        await db.collection('moments')
          .doc(momentId)
          .update({
            likeCount: dbCmd.inc(-1),
            updateTime: new Date().getTime()
          });

        return {
          code: 0,
          msg: 'success',
          data: {
            liked: false,
            likeCount: moment.likeCount - 1
          }
        };
      }

      await db.collection('momentsLike').add({
        momentId,
        userId: uid,
        createTime: new Date().getTime()
      });

      await db.collection('moments')
        .doc(momentId)
        .update({
          likeCount: dbCmd.inc(1),
          updateTime: new Date().getTime()
        });

      return {
        code: 0,
        msg: 'success',
        data: {
          liked: true,
          likeCount: moment.likeCount + 1
        }
      };
    } catch (e) {
      console.error('likeMoment error:', e);
      return { code: 500, msg: '点赞操作失败', error: e.message };
    }
  },

  async commentMoment(data) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      const { momentId, content, replyTo } = data;

      if (!momentId) {
        return { code: 400, msg: 'momentId不能为空' };
      }

      if (!content || content.trim() === '') {
        return { code: 400, msg: '评论内容不能为空' };
      }

      if (content.length > 200) {
        return { code: 400, msg: '评论内容最多200字' };
      }

      const momentRes = await db.collection('moments')
        .doc(momentId)
        .get();

      if (!momentRes.data || momentRes.data.length === 0) {
        return { code: 404, msg: '动态不存在' };
      }

      const moment = momentRes.data[0];
      if (moment.isDeleted) {
        return { code: 404, msg: '动态已删除' };
      }

      const memberRes = await db.collection('familyMember')
        .where({
          familyId: moment.familyId,
          userId: uid,
          isDeleted: false
        })
        .get();

      if (!memberRes.data || memberRes.data.length === 0) {
        return { code: 403, msg: '无权操作该动态' };
      }

      let replyToAuthor = null;

      if (replyTo) {
        const replyCommentRes = await db.collection('momentsComment')
          .doc(replyTo)
          .get();

        if (!replyCommentRes.data || replyCommentRes.data.length === 0) {
          return { code: 404, msg: '被回复的评论不存在' };
        }

        const replyComment = replyCommentRes.data[0];
        if (replyComment.isDeleted) {
          return { code: 404, msg: '被回复的评论已删除' };
        }

        if (replyComment.momentId !== momentId) {
          return { code: 400, msg: '被回复的评论不属于该动态' };
        }

        replyToAuthor = replyComment.authorId;
      }

      const commentData = {
        momentId,
        authorId: uid,
        content: content.trim(),
        replyTo: replyTo || null,
        replyToAuthor,
        createTime: new Date().getTime(),
        isDeleted: false
      };

      const commentRes = await db.collection('momentsComment').add(commentData);

      await db.collection('moments')
        .doc(momentId)
        .update({
          commentCount: dbCmd.inc(1),
          updateTime: new Date().getTime()
        });

      const authorRes = await db.collection('uni-id-users')
        .where({
          _id: uid
        })
        .field({
          _id: true,
          nickname: true,
          avatar: true
        })
        .get();

      const author = authorRes.data[0] || {};

      return {
        code: 0,
        msg: 'success',
        data: {
          commentId: commentRes.id,
          ...commentData,
          author
        }
      };
    } catch (e) {
      console.error('commentMoment error:', e);
      return { code: 500, msg: '评论失败', error: e.message };
    }
  },

  async deleteMoment(momentId) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      if (!momentId) {
        return { code: 400, msg: 'momentId不能为空' };
      }

      const momentRes = await db.collection('moments')
        .doc(momentId)
        .get();

      if (!momentRes.data || momentRes.data.length === 0) {
        return { code: 404, msg: '动态不存在' };
      }

      const moment = momentRes.data[0];
      if (moment.isDeleted) {
        return { code: 404, msg: '动态已删除' };
      }

      const isAuthor = moment.authorId === uid;

      const memberRes = await db.collection('familyMember')
        .where({
          familyId: moment.familyId,
          userId: uid,
          isDeleted: false
        })
        .get();

      if (!memberRes.data || memberRes.data.length === 0) {
        return { code: 403, msg: '无权操作该动态' };
      }

      const member = memberRes.data[0];
      const isAdmin = member.role === 'admin' || member.role === 'owner';

      if (!isAuthor && !isAdmin) {
        return { code: 403, msg: '只有作者或管理员可以删除动态' };
      }

      await db.collection('moments')
        .doc(momentId)
        .update({
          isDeleted: true,
          updateTime: new Date().getTime()
        });

      return {
        code: 0,
        msg: 'success',
        data: {
          momentId
        }
      };
    } catch (e) {
      console.error('deleteMoment error:', e);
      return { code: 500, msg: '删除动态失败', error: e.message };
    }
  },

  async getMyMoments(page = 1, pageSize = 20) {
    try {
      const { uid } = await this.getContext();
      if (!uid) {
        return { code: 401, msg: '未登录' };
      }

      page = Math.max(1, parseInt(page) || 1);
      pageSize = Math.min(50, Math.max(1, parseInt(pageSize) || 20));

      const skip = (page - 1) * pageSize;

      const momentsRes = await db.collection('moments')
        .where({
          authorId: uid,
          isDeleted: false
        })
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get();

      const familyIds = [...new Set(momentsRes.data.map(m => m.familyId))];

      let familyMap = {};
      if (familyIds.length > 0) {
        const familiesRes = await db.collection('family')
          .where({
            _id: dbCmd.in(familyIds)
          })
          .field({
            _id: true,
            name: true
          })
          .get();

        familyMap = {};
        familiesRes.data.forEach(f => {
          familyMap[f._id] = f.name || '';
        });
      }

      const moments = momentsRes.data.map(moment => ({
        _id: moment._id,
        familyId: moment.familyId,
        familyName: familyMap[moment.familyId] || '',
        authorId: moment.authorId,
        content: moment.content,
        images: moment.images || [],
        location: moment.location,
        likeCount: moment.likeCount,
        commentCount: moment.commentCount,
        createTime: moment.createTime,
        updateTime: moment.updateTime
      }));

      return {
        code: 0,
        msg: 'success',
        data: {
          list: moments,
          page,
          pageSize,
          hasMore: moments.length === pageSize
        }
      };
    } catch (e) {
      console.error('getMyMoments error:', e);
      return { code: 500, msg: '获取我的动态失败', error: e.message };
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
