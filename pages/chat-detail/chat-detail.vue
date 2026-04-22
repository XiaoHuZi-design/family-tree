<template>
  <view class="chat-detail-page">
    <!-- Top nav bar -->
    <view class="header">
      <text class="back-icon" @tap="goBack">‹</text>
      <text class="title">{{ chatName }}</text>
      <text class="more-icon">···</text>
    </view>

    <!-- Loading state -->
    <view v-if="loading" class="state-wrap">
      <text class="state-text">加载中...</text>
    </view>

    <!-- Messages area -->
    <view v-else class="message-list">
      <!-- Empty state -->
      <view v-if="messages.length === 0" class="state-wrap">
        <text class="state-text">暂无消息</text>
      </view>

      <!-- Message list -->
      <view
        v-for="message in messages"
        :key="message._id"
        class="message-wrapper"
        :class="{ 'is-mine': message.senderId === currentUserId }"
      >
        <!-- Other's message -->
        <template v-if="message.senderId !== currentUserId">
          <image
            v-if="message.senderAvatar"
            class="avatar-img"
            :src="message.senderAvatar"
            mode="aspectFill"
          />
          <view v-else class="avatar-wrap">
            <text class="avatar-emoji">{{ (message.senderName || '?').charAt(0) }}</text>
          </view>
          <view class="message-content">
            <view class="bubble bubble-left">
              <text class="bubble-text">{{ message.content }}</text>
            </view>
          </view>
        </template>

        <!-- My message -->
        <template v-else>
          <view class="message-content">
            <view class="bubble bubble-right">
              <text class="bubble-text">{{ message.content }}</text>
            </view>
          </view>
          <view class="avatar-wrap my-avatar">
            <text class="avatar-emoji">我</text>
          </view>
        </template>
      </view>
    </view>

    <!-- Bottom input bar -->
    <view class="input-bar-wrapper">
      <view class="input-bar">
        <view class="icon-btn" @tap="handleVoice">
          <text class="icon">🎤</text>
        </view>
        <input
          class="input-box"
          v-model="inputText"
          placeholder="输入消息..."
          placeholder-class="input-placeholder"
          @confirm="sendMessage"
        />
        <view class="icon-btn" @tap="handleEmoji">
          <text class="icon">😊</text>
        </view>
        <view v-if="!inputText.trim()" class="icon-btn" @tap="showMorePanel">
          <text class="icon">➕</text>
        </view>
        <view v-else class="send-btn" @tap="sendMessage">
          <text class="send-text">发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useChatStore } from '@/stores/chatStore.ts'
import { markAsRead } from '@/api/chat.ts'

interface MessageItem {
  _id: string
  conversationId: string
  type: 'text' | 'image' | 'location'
  content: string
  senderId: string
  senderName: string
  senderAvatar: string
  createTime: string
}

const store = useChatStore()
const chatName = ref('聊天')
const conversationId = ref('')
const inputText = ref('')
const loading = ref(true)
const sending = ref(false)

const currentUserId = computed(() => {
  const userInfo = uni.getStorageSync('userInfo')
  return userInfo?._id || ''
})

const messages = computed(() => store.currentMessages as MessageItem[])

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  sending.value = true
  inputText.value = ''

  try {
    await store.sendNewMessage(conversationId.value, 'text', text)
    nextTick(() => {
      // Scroll to bottom if needed in future
    })
  } catch (error) {
    uni.showToast({ title: '发送失败', icon: 'none' })
    inputText.value = text
  } finally {
    sending.value = false
  }
}

const goBack = () => {
  store.clearCurrentChat()
  uni.navigateBack()
}

const handleVoice = () => { uni.showToast({ title: '语音功能开发中', icon: 'none' }) }
const handleEmoji = () => { uni.showToast({ title: '表情功能开发中', icon: 'none' }) }
const showMorePanel = () => { uni.showToast({ title: '更多功能开发中', icon: 'none' }) }

onLoad((options: any) => {
  chatName.value = options?.name ? decodeURIComponent(options.name) : '聊天'
  conversationId.value = options?.id || ''

  if (conversationId.value) {
    store.setCurrentChat(conversationId.value)

    loading.value = true
    store.fetchMessages(conversationId.value).then(() => {
      loading.value = false
    }).catch(() => {
      loading.value = false
    })

    // Mark as read
    markAsRead(conversationId.value).catch(() => {})
  } else {
    loading.value = false
  }
})

onUnload(() => {
  store.clearCurrentChat()
})
</script>

<style lang="scss" scoped>
.chat-detail-page {
  min-height: 100vh;
  background: #F2F2F2;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #EAE6E0;
  position: sticky;
  top: 0;
  z-index: 10;

  .back-icon { font-size: 48rpx; color: #2C2C2C; width: 60rpx; }
  .title { font-size: 34rpx; font-weight: 600; color: #2C2C2C; flex: 1; text-align: center; }
  .more-icon { font-size: 40rpx; color: #2C2C2C; width: 60rpx; text-align: right; }
}

.state-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 0;

  .state-text {
    font-size: 28rpx;
    color: #999;
  }
}

.message-list {
  flex: 1;
  padding: 24rpx;
  padding-bottom: 140rpx;
}

.message-wrapper {
  display: flex;
  margin-bottom: 32rpx;

  &.is-mine {
    flex-direction: row-reverse;
  }
}

.avatar-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);

  &.my-avatar {
    background: linear-gradient(135deg, #2D8B4E, #4CAF50);
  }

  .avatar-emoji { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
}

.avatar-img {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.message-content {
  max-width: 520rpx;
  margin: 0 16rpx;
}

.bubble {
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  position: relative;
}

.bubble-left {
  background: #FFFFFF;
  border-top-left-radius: 6rpx;

  .bubble-text { font-size: 30rpx; color: #2C2C2C; line-height: 1.6; }
}

.bubble-right {
  background: #2D8B4E;
  border-top-right-radius: 6rpx;

  .bubble-text { font-size: 30rpx; color: #FFFFFF; line-height: 1.6; }
}

.input-bar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-top: 1rpx solid #EAE6E0;
  padding-bottom: env(safe-area-inset-bottom);
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  min-height: 100rpx;
}

.icon-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .icon { font-size: 44rpx; }
}

.input-box {
  flex: 1;
  height: 72rpx;
  margin: 0 16rpx;
  padding: 0 24rpx;
  background: #F0F0F0;
  border-radius: 36rpx;
  font-size: 30rpx;
  color: #2C2C2C;
}

.input-placeholder { color: #999; }

.send-btn {
  width: 100rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2D8B4E;
  border-radius: 32rpx;
  flex-shrink: 0;

  .send-text { font-size: 28rpx; color: #FFFFFF; font-weight: 600; }
}
</style>
