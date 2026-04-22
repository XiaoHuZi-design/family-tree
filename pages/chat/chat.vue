<template>
  <view class="chat-page">
    <view class="search-bar">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input class="search-input" placeholder="搜索" placeholder-class="placeholder" />
      </view>
    </view>

    <!-- Loading state -->
    <view v-if="loading" class="state-wrap">
      <text class="state-text">加载中...</text>
    </view>

    <!-- Empty state -->
    <view v-else-if="conversations.length === 0" class="state-wrap">
      <text class="state-text">暂无会话</text>
    </view>

    <!-- Conversation list -->
    <view v-else class="chat-list">
      <view v-for="item in conversations" :key="item._id" class="chat-item" @tap="goChat(item)">
        <view class="chat-avatar-wrap">
          <view v-if="item.type === 'group'" class="group-avatars">
            <view class="g-avatar" v-for="i in 4" :key="i">
              <text class="g-emoji">{{ ['👨','👩','👦','👧'][i-1] }}</text>
            </view>
          </view>
          <image
            v-else-if="item.avatar"
            class="single-avatar-img"
            :src="item.avatar"
            mode="aspectFill"
          />
          <view v-else class="single-avatar-placeholder">
            <text class="s-emoji">{{ (item.name || '?').charAt(0) }}</text>
          </view>
          <view v-if="item.unread > 0" class="unread-dot">
            <text class="unread-text">{{ item.unread > 99 ? '99+' : item.unread }}</text>
          </view>
        </view>

        <view class="chat-info">
          <text class="chat-name">{{ item.name }}</text>
          <text class="chat-msg">{{ item.lastMessage }}</text>
        </view>

        <view class="chat-meta">
          <text class="chat-time">{{ formatTime(item.lastMessageTime) }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore.ts'
import { onShow } from '@dcloudio/uni-app'

interface Conversation {
  _id: string
  type: 'private' | 'group'
  name: string
  avatar: string
  members: string[]
  lastMessage: string
  lastMessageTime: string
  unread: number
}

const store = useChatStore()
const loading = ref(true)

const conversations = computed(() => store.conversations as Conversation[])

const fetchConversations = async () => {
  loading.value = true
  try {
    await store.fetchConversations()
  } catch (error) {
    uni.showToast({ title: '获取会话失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  const month = date.getMonth() + 1
  const day = date.getDate()
  if (date.getFullYear() === now.getFullYear()) {
    return `${month}/${day}`
  }
  return `${date.getFullYear()}/${month}/${day}`
}

const goChat = (item: Conversation) => {
  uni.navigateTo({
    url: `/pages/chat-detail/chat-detail?id=${item._id}&name=${encodeURIComponent(item.name)}&type=${item.type}`
  })
}

onMounted(() => {
  fetchConversations()
})

onShow(() => {
  if (!loading.value) {
    store.fetchConversations()
  }
})
</script>

<style lang="scss" scoped>
.chat-page {
  min-height: 100vh;
  background: #F8F6F2;
}

.search-bar {
  padding: 16rpx 24rpx;
  background: #FFFFFF;

  .search-box {
    display: flex;
    align-items: center;
    height: 68rpx;
    background: #F0EDE8;
    border-radius: 34rpx;
    padding: 0 24rpx;
    gap: 10rpx;

    .search-icon { font-size: 28rpx; }
    .search-input { flex: 1; font-size: 28rpx; color: #2C2C2C; }
  }
}

.placeholder { color: #999; }

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

.chat-list {
  padding: 0;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #F5F2EE;

  &:active { background: #FAFAF8; }

  .chat-avatar-wrap {
    position: relative;
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  .single-avatar-img {
    width: 96rpx;
    height: 96rpx;
    border-radius: 20rpx;
  }

  .single-avatar-placeholder {
    width: 96rpx;
    height: 96rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #2D8B4E, #4CAF50);

    .s-emoji { font-size: 40rpx; color: #FFFFFF; font-weight: bold; }
  }

  .group-avatars {
    width: 96rpx;
    height: 96rpx;
    border-radius: 20rpx;
    display: flex;
    flex-wrap: wrap;
    overflow: hidden;
    background: #F0EDE8;

    .g-avatar {
      width: 48rpx;
      height: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      .g-emoji { font-size: 24rpx; }
    }
  }

  .unread-dot {
    position: absolute;
    top: -6rpx;
    right: -6rpx;
    min-width: 32rpx;
    height: 32rpx;
    padding: 0 8rpx;
    background: #E74C3C;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .unread-text {
      font-size: 20rpx;
      color: #FFFFFF;
      font-weight: bold;
    }
  }

  .chat-info {
    flex: 1;
    min-width: 0;

    .chat-name {
      display: block;
      font-size: 30rpx;
      font-weight: 600;
      color: #2C2C2C;
      margin-bottom: 8rpx;
    }

    .chat-msg {
      display: block;
      font-size: 26rpx;
      color: #999;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .chat-meta {
    flex-shrink: 0;
    margin-left: 16rpx;

    .chat-time {
      font-size: 22rpx;
      color: #BBB;
    }
  }
}
</style>
