import { mockMoments, MockMoment, mockMembers } from './data'
import { mockDelay } from '@/utils/mock-config'

let moments = [...mockMoments]
let likes: Record<string, string[]> = {} // momentId -> [userId]

export default {
  async getMoments(familyId: string, page = 1, pageSize = 20) {
    await mockDelay()
    const list = moments.filter(m => !m.isDeleted).map(m => {
      const authorMember = mockMembers.find(mm => mm._id === m.authorId)
      return {
        ...m,
        author: { nickname: authorMember?.name || '未知', avatar: authorMember?.avatar || '' },
        isLiked: (likes[m._id] || []).includes('m6')
      }
    })
    return { code: 0, msg: 'success', data: { list, page, pageSize, hasMore: false } }
  },

  async publishMoment(data: any) {
    await mockDelay()
    const id = 'mt' + (moments.length + 1) + '_' + Date.now()
    const authorMember = mockMembers.find(m => m._id === 'm6')
    const newMoment: MockMoment = {
      _id: id, familyId: data.familyId || 'f1', authorId: 'm6',
      author: { nickname: authorMember?.name || '张小明', avatar: '' },
      content: data.content || '', images: data.images || [],
      location: data.location || null,
      likeCount: 0, commentCount: 0, isLiked: false,
      createTime: Date.now(), updateTime: Date.now(), isDeleted: false
    }
    moments.unshift(newMoment)
    return { code: 0, msg: 'success', data: { momentId: id } }
  },

  async likeMoment(momentId: string) {
    await mockDelay()
    const m = moments.find(x => x._id === momentId)
    if (!m) return { code: 404, msg: '动态不存在' }

    if (!likes[momentId]) likes[momentId] = []
    const idx = likes[momentId].indexOf('m6')
    if (idx >= 0) {
      likes[momentId].splice(idx, 1)
      m.likeCount = Math.max(0, m.likeCount - 1)
      return { code: 0, msg: 'success', data: { liked: false, likeCount: m.likeCount } }
    } else {
      likes[momentId].push('m6')
      m.likeCount += 1
      return { code: 0, msg: 'success', data: { liked: true, likeCount: m.likeCount } }
    }
  },

  async commentMoment(data: any) {
    await mockDelay()
    const m = moments.find(x => x._id === data.momentId)
    if (m) m.commentCount += 1
    return { code: 0, msg: 'success', data: { commentId: 'cmt_' + Date.now() } }
  },

  async deleteMoment(momentId: string) {
    await mockDelay()
    const m = moments.find(x => x._id === momentId)
    if (m) m.isDeleted = true
    return { code: 0, msg: 'success', data: { momentId } }
  },

  async getMomentDetail(momentId: string) {
    await mockDelay()
    const m = moments.find(x => x._id === momentId)
    if (!m) return { code: 404, msg: '动态不存在' }
    const authorMember = mockMembers.find(mm => mm._id === m.authorId)
    return {
      code: 0, msg: 'success',
      data: {
        moment: {
          ...m,
          author: { nickname: authorMember?.name || '未知', avatar: '' },
          isLiked: (likes[m._id] || []).includes('m6')
        },
        comments: []
      }
    }
  }
}
