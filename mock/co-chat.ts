import { mockConversations, mockMessages } from './data'
import { mockDelay } from '@/utils/mock-config'

let conversations = [...mockConversations]

export default {
  async getConversations() {
    await mockDelay()
    return { code: 0, msg: 'success', data: { list: conversations } }
  },

  async getMessages(data: any) {
    await mockDelay()
    const msgs = mockMessages[data.conversationId] || []
    return { code: 0, msg: 'success', data: { list: msgs } }
  },

  async sendMessage(data: any) {
    await mockDelay()
    const msgId = 'msg_' + Date.now()
    const conv = conversations.find(c => c._id === data.conversationId)
    if (conv) {
      conv.lastMessage = data.content
      conv.lastMessageTime = Date.now()
    }
    return { code: 0, msg: 'success', data: { messageId: msgId } }
  },

  async createGroupChat(data: any) {
    await mockDelay()
    const id = 'c_' + Date.now()
    conversations.unshift({
      _id: id, type: 'group', name: data.name || '新群聊', avatar: '',
      members: data.memberIds || [], lastMessage: '群聊已创建',
      lastMessageTime: Date.now(), unread: 0
    })
    return { code: 0, msg: 'success', data: { conversationId: id } }
  },

  async markAsRead(conversationId: string) {
    await mockDelay()
    const conv = conversations.find(c => c._id === conversationId)
    if (conv) conv.unread = 0
    return { code: 0, msg: 'success' }
  },

  async getUnreadCount() {
    await mockDelay()
    const total = conversations.reduce((sum, c) => sum + c.unread, 0)
    return { code: 0, msg: 'success', data: { total } }
  }
}
