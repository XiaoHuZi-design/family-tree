import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getConversations, getMessages, sendMessage, getUnreadCount } from '@/api/chat'
import type { Conversation, Message } from '@/api/chat'

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<Conversation[]>([])
  const messagesMap = ref<Record<string, Message[]>>({})
  const currentChat = ref<string>('')
  const unreadTotal = ref(0)

  const currentMessages = computed(() => {
    if (!currentChat.value) return []
    return messagesMap.value[currentChat.value] || []
  })

  const fetchConversations = async () => {
    try {
      const res = await getConversations()
      if (res.code === 0) {
        conversations.value = res.data
      }
    } catch (error) {
      console.error('获取会话列表失败:', error)
    }
  }

  const fetchMessages = async (conversationId: string, page: number = 1, pageSize: number = 50) => {
    try {
      const res = await getMessages({
        conversationId,
        page,
        pageSize
      })

      if (res.code === 0) {
        if (!messagesMap.value[conversationId]) {
          messagesMap.value[conversationId] = []
        }

        if (page === 1) {
          messagesMap.value[conversationId] = res.data.list
        } else {
          messagesMap.value[conversationId] = [...res.data.list, ...messagesMap.value[conversationId]]
        }
      }
    } catch (error) {
      console.error('获取消息失败:', error)
    }
  }

  const addMessage = (conversationId: string, message: Message) => {
    if (!messagesMap.value[conversationId]) {
      messagesMap.value[conversationId] = []
    }
    messagesMap.value[conversationId].push(message)
  }

  const sendNewMessage = async (conversationId: string, type: 'text' | 'image' | 'location', content: string) => {
    try {
      const res = await sendMessage({
        conversationId,
        type,
        content
      })

      if (res.code === 0) {
        const newMessage: Message = {
          _id: res.data.messageId,
          conversationId,
          type,
          content,
          senderId: '',
          senderName: '',
          senderAvatar: '',
          createTime: new Date().toISOString()
        }
        addMessage(conversationId, newMessage)
        return newMessage
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    }
  }

  const setCurrentChat = (chatId: string) => {
    currentChat.value = chatId
  }

  const clearCurrentChat = () => {
    currentChat.value = ''
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount()
      if (res.code === 0) {
        unreadTotal.value = res.data.total
      }
    } catch (error) {
      console.error('获取未读数失败:', error)
    }
  }

  const updateConversation = (conversation: Conversation) => {
    const index = conversations.value.findIndex(c => c._id === conversation._id)
    if (index !== -1) {
      conversations.value[index] = conversation
    } else {
      conversations.value.unshift(conversation)
    }
  }

  const removeConversation = (conversationId: string) => {
    const index = conversations.value.findIndex(c => c._id === conversationId)
    if (index !== -1) {
      conversations.value.splice(index, 1)
    }
    delete messagesMap.value[conversationId]
  }

  const clearMessages = (conversationId: string) => {
    if (messagesMap.value[conversationId]) {
      messagesMap.value[conversationId] = []
    }
  }

  return {
    conversations,
    messagesMap,
    currentChat,
    unreadTotal,
    currentMessages,
    fetchConversations,
    fetchMessages,
    addMessage,
    sendNewMessage,
    setCurrentChat,
    clearCurrentChat,
    fetchUnreadCount,
    updateConversation,
    removeConversation,
    clearMessages
  }
})
