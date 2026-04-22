interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

interface MomentAuthor {
  _id: string
  nickname: string
  avatar: string
}

interface Moment {
  _id: string
  author: MomentAuthor
  content: string
  images: string[]
  location?: string
  likes: number
  comments: number
  isLiked: boolean
  createTime: string
}

interface GetMomentsParams {
  page?: number
  pageSize?: number
}

interface PublishMomentParams {
  content: string
  images: string[]
  location?: string
}

interface CommentParams {
  momentId: string
  content: string
}

function getCloudObject() {
  return uniCloud.importObject('co-moments')
}

function getFamilyId(): string {
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo?.familyId) return userInfo.familyId
  const familyIds = userInfo?.familyIds
  if (Array.isArray(familyIds) && familyIds.length > 0) return familyIds[0]
  return uni.getStorageSync('currentFamilyId') || ''
}

function handleResult(result: any) {
  return result || { code: -1, msg: '请求失败' }
}

export async function getMoments(params: GetMomentsParams = {}): Promise<ApiResponse<{ list: Moment[] }>> {
  try {
    const familyId = getFamilyId()
    if (!familyId) return { code: 0, msg: 'success', data: { list: [] } }

    const result = await getCloudObject().getMoments(familyId, params.page || 1, params.pageSize || 20)
    const res = handleResult(result)

    if (res.code === 0) {
      const list = (res.data?.list || []).map((m: any) => ({
        _id: m._id,
        author: {
          _id: m.authorId || '',
          nickname: m.author?.nickname || '',
          avatar: m.author?.avatar || ''
        },
        content: m.content || '',
        images: m.images || [],
        location: m.location || '',
        likes: m.likeCount || 0,
        comments: m.commentCount || 0,
        isLiked: m.isLiked || false,
        createTime: m.createTime ? new Date(m.createTime).toISOString() : ''
      }))
      return { code: 0, msg: 'success', data: { list } }
    }
    return { code: res.code, msg: res.msg, data: { list: [] } }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '获取朋友圈失败', data: { list: [] } }
  }
}

export async function publishMoment(params: PublishMomentParams): Promise<ApiResponse<{ momentId: string }>> {
  try {
    const familyId = getFamilyId()
    if (!familyId) return { code: -1, msg: '未加入家族', data: null as any }

    const result = await getCloudObject().publishMoment({
      familyId,
      content: params.content,
      images: params.images,
      location: params.location
    })
    const res = handleResult(result)

    if (res.code === 0) {
      return { code: 0, msg: 'success', data: { momentId: res.data?.momentId || '' } }
    }
    return { code: res.code, msg: res.msg, data: null as any }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '发布失败', data: null as any }
  }
}

export async function likeMoment(momentId: string): Promise<ApiResponse<null>> {
  try {
    const result = await getCloudObject().likeMoment(momentId)
    return handleResult(result)
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '操作失败', data: null }
  }
}

export async function commentMoment(params: CommentParams): Promise<ApiResponse<{ commentId: string }>> {
  try {
    const result = await getCloudObject().commentMoment(params)
    const res = handleResult(result)
    if (res.code === 0) {
      return { code: 0, msg: 'success', data: { commentId: res.data?.commentId || '' } }
    }
    return { code: res.code, msg: res.msg, data: null as any }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '评论失败', data: null as any }
  }
}

export async function deleteMoment(momentId: string): Promise<ApiResponse<null>> {
  try {
    const result = await getCloudObject().deleteMoment(momentId)
    return handleResult(result)
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '删除失败', data: null }
  }
}

export async function getMomentComments(momentId: string, page: number = 1, pageSize: number = 20): Promise<ApiResponse<{ list: any[] }>> {
  try {
    const result = await getCloudObject().getMomentDetail(momentId)
    const res = handleResult(result)
    if (res.code === 0) {
      return { code: 0, msg: 'success', data: { list: res.data?.comments || [] } }
    }
    return { code: res.code, msg: res.msg, data: { list: [] } }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '获取评论失败', data: { list: [] } }
  }
}

export async function getMomentById(momentId: string): Promise<ApiResponse<Moment>> {
  try {
    const result = await getCloudObject().getMomentDetail(momentId)
    const res = handleResult(result)
    if (res.code === 0) {
      const m = res.data?.moment
      return {
        code: 0, msg: 'success',
        data: m ? {
          _id: m._id,
          author: { _id: m.authorId, nickname: m.author?.nickname || '', avatar: m.author?.avatar || '' },
          content: m.content,
          images: m.images || [],
          location: m.location,
          likes: m.likeCount || 0,
          comments: m.commentCount || 0,
          isLiked: m.isLiked || false,
          createTime: m.createTime ? new Date(m.createTime).toISOString() : ''
        } : null as any
      }
    }
    return { code: res.code, msg: res.msg, data: null as any }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '获取动态失败', data: null as any }
  }
}
