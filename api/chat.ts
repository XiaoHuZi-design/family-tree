interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface Conversation {
  _id: string
  type: 'private' | 'group'
  name: string
  avatar: string
  members: string[]
  lastMessage: string
  lastMessageTime: string
  unread: number
}

export interface Message {
  _id: string
  conversationId: string
  type: 'text' | 'image' | 'location'
  content: string
  senderId: string
  senderName: string
  senderAvatar: string
  createTime: string
}

function getCloudObject() {
  return uniCloud.importObject('co-chat')
}

function handleResult<T>(result: any): ApiResponse<T> {
  return result || { code: -1, msg: '请求失败', data: null as any }
}

export async function getConversations(): Promise<ApiResponse<Conversation[]>> {
  try {
    const result = await getCloudObject().getConversations()
    const res = handleResult<{ list: any[]; page: number }>(result)
    if (res.code === 0) {
      const conversations = (res.data?.list || []).map((c: any) => ({
        _id: c._id,
        type: c.type || 'private',
        name: c.name || '',
        avatar: c.avatar || '',
        members: (c.members || []).map((m: any) => m.userId || m),
        lastMessage: c.lastMessage?.content || '',
        lastMessageTime: c.updateTime ? new Date(c.updateTime).toISOString() : '',
        unread: c.unreadCount || 0
      }))
      return { code: 0, msg: 'success', data: conversations }
    }
    return { code: res.code, msg: res.msg, data: [] }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '获取会话列表失败', data: [] }
  }
}

export async function getMessages(params: {
  conversationId: string
  page?: number
  pageSize?: number
}): Promise<ApiResponse<{ list: Message[] }>> {
  try {
    const result = await getCloudObject().getMessages(
      params.conversationId,
      params.page || 1,
      params.pageSize || 50
    )
    const res = handleResult<{ list: any[] }>(result)
    if (res.code === 0) {
      const messages = (res.data?.list || []).map((m: any) => ({
        _id: m._id,
        conversationId: m.conversationId || params.conversationId,
        type: m.type || 'text',
        content: m.content || '',
        senderId: m.senderId || '',
        senderName: m.senderName || '',
        senderAvatar: m.senderAvatar || '',
        createTime: m.createTime ? new Date(m.createTime).toISOString() : ''
      }))
      return { code: 0, msg: 'success', data: { list: messages } }
    }
    return { code: res.code, msg: res.msg, data: { list: [] } }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '获取消息失败', data: { list: [] } }
  }
}

export async function sendMessage(params: {
  conversationId: string
  type: 'text' | 'image' | 'location'
  content: string
}): Promise<ApiResponse<{ messageId: string }>> {
  try {
    const result = await getCloudObject().sendMessage(params)
    const res = handleResult<{ messageId: string }>(result)
    if (res.code === 0) {
      return { code: 0, msg: 'success', data: { messageId: res.data?.messageId || '' } }
    }
    return { code: res.code, msg: res.msg, data: null as any }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '发送失败', data: null as any }
  }
}

export async function createGroupChat(params: {
  name: string
  memberIds: string[]
}): Promise<ApiResponse<{ conversationId: string }>> {
  try {
    const result = await getCloudObject().createGroupChat(params)
    const res = handleResult<{ conversationId: string }>(result)
    if (res.code === 0) {
      return { code: 0, msg: 'success', data: { conversationId: res.data?.conversationId || '' } }
    }
    return { code: res.code, msg: res.msg, data: null as any }
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '创建群聊失败', data: null as any }
  }
}

export async function markAsRead(conversationId: string): Promise<ApiResponse<null>> {
  try {
    const result = await getCloudObject().markAsRead(conversationId)
    return handleResult(result)
  } catch (error: any) {
    return { code: -1, msg: error.errMsg || '标记失败', data: null }
  }
}

export async function getUnreadCount(): Promise<ApiResponse<{ total: number }>> {
  try {
    const res = await getConversations()
    if (res.code === 0) {
      const total = (res.data || []).reduce((sum: number, c: Conversation) => sum + (c.unread || 0), 0)
      return { code: 0, msg: 'success', data: { total } }
    }
    return { code: 0, msg: 'success', data: { total: 0 } }
  } catch (error: any) {
    return { code: -1, msg: '获取未读数失败', data: { total: 0 } }
  }
}
