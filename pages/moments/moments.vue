<template>
  <view class="moments-page">
    <view class="cover-section">
      <view class="cover-bg"></view>
      <view class="cover-content">
        <view class="cover-info">
          <text class="cover-name">张氏家族</text>
          <text class="cover-sub">家族动态</text>
        </view>
        <view class="publish-btn" @tap="goPublish">
          <text class="pub-icon">📷</text>
          <text class="pub-text">发动态</text>
        </view>
      </view>
    </view>

    <!-- Loading state -->
    <view v-if="loading" class="state-wrap">
      <text class="state-text">加载中...</text>
    </view>

    <!-- Empty state -->
    <view v-else-if="moments.length === 0" class="state-wrap">
      <text class="state-text">暂无动态</text>
    </view>

    <!-- Moments list -->
    <view v-else class="moments-list">
      <view v-for="item in moments" :key="item._id" class="moment-card">
        <view class="card-top">
          <image
            v-if="item.author && item.author.avatar"
            class="user-avatar-img"
            :src="item.author.avatar"
            mode="aspectFill"
          />
          <view v-else class="user-avatar-placeholder">
            <text class="user-emoji">{{ (item.author && item.author.nickname || '?').charAt(0) }}</text>
          </view>
          <view class="user-info">
            <text class="user-name">{{ item.author && item.author.nickname || '未知' }}</text>
            <text class="post-time">{{ formatTime(item.createTime) }}</text>
          </view>
        </view>

        <view class="card-body">
          <text class="post-text">{{ item.content }}</text>

          <view v-if="item.images && item.images.length > 0" class="img-grid" :class="'grid-' + Math.min(item.images.length, 3)">
            <image
              v-for="(img, i) in item.images"
              :key="i"
              class="img-item-img"
              :src="img"
              mode="aspectFill"
            />
          </view>

          <view v-if="item.location" class="loc-tag">
            <text class="loc-icon">📍</text>
            <text class="loc-text">{{ item.location }}</text>
          </view>
        </view>

        <view class="card-bottom">
          <view class="action-btn" :class="{liked: item.isLiked}" @tap="handleLike(item)">
            <text class="action-emoji">{{ item.isLiked ? '❤️' : '🤍' }}</text>
            <text class="action-num">{{ item.likes }}</text>
          </view>
          <view class="action-btn" @tap="goComment">
            <text class="action-emoji">💬</text>
            <text class="action-num">{{ item.comments }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMoments, likeMoment } from '@/api/moments.ts'

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

const moments = ref<Moment[]>([])
const loading = ref(true)
const liking = ref(false)

const fetchMoments = async () => {
  loading.value = true
  try {
    const res = await getMoments({ page: 1, pageSize: 20 })
    if (res.code === 0) {
      moments.value = res.data.list || []
    } else {
      uni.showToast({ title: res.msg || '获取动态失败', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '网络错误', icon: 'none' })
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
  if (days < 7) return `${days}天前`
  const month = date.getMonth() + 1
  const day = date.getDate()
  if (date.getFullYear() === now.getFullYear()) {
    return `${month}月${day}日`
  }
  return `${date.getFullYear()}年${month}月${day}日`
}

const handleLike = async (item: Moment) => {
  if (liking.value) return
  liking.value = true
  try {
    const res = await likeMoment(item._id)
    if (res.code === 0) {
      item.isLiked = !item.isLiked
      item.likes += item.isLiked ? 1 : -1
    } else {
      uni.showToast({ title: res.msg || '操作失败', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '网络错误', icon: 'none' })
  } finally {
    liking.value = false
  }
}

const goPublish = () => {
  uni.navigateTo({ url: '/pages/moments/moments-publish' })
}

const goComment = () => {
  uni.showToast({ title: '评论功能开发中', icon: 'none' })
}

onMounted(() => {
  fetchMoments()
})
</script>

<style lang="scss" scoped>
.moments-page {
  min-height: 100vh;
  background: #F8F6F2;
}

.cover-section {
  position: relative;
  height: 320rpx;

  .cover-bg {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, #2D8B4E 0%, #1E6B3A 50%, #D4A574 100%);
  }

  .cover-content {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    padding: 32rpx;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    background: linear-gradient(to top, rgba(0,0,0,0.35), transparent);

    .cover-info {
      .cover-name {
        display: block;
        font-size: 48rpx;
        font-weight: bold;
        color: #FFFFFF;
        text-shadow: 0 4rpx 12rpx rgba(0,0,0,0.2);
      }
      .cover-sub {
        display: block;
        font-size: 26rpx;
        color: rgba(255,255,255,0.85);
        margin-top: 8rpx;
      }
    }

    .publish-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      background: rgba(255,255,255,0.95);
      padding: 16rpx 28rpx;
      border-radius: 32rpx;
      box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.1);

      &:active { transform: scale(0.95); }

      .pub-icon { font-size: 28rpx; }
      .pub-text { font-size: 26rpx; font-weight: 600; color: #2D8B4E; }
    }
  }
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

.moments-list {
  padding: 20rpx 24rpx;
}

.moment-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.05);
}

.card-top {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;

  .user-avatar-img {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  }

  .user-avatar-placeholder {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: linear-gradient(135deg, #2D8B4E, #4CAF50);
    box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);

    .user-emoji { font-size: 36rpx; color: #FFFFFF; font-weight: bold; }
  }

  .user-info {
    margin-left: 20rpx;
    .user-name {
      display: block;
      font-size: 30rpx;
      font-weight: 600;
      color: #2C2C2C;
    }
    .post-time {
      display: block;
      font-size: 22rpx;
      color: #999;
      margin-top: 4rpx;
    }
  }
}

.card-body {
  .post-text {
    font-size: 28rpx;
    color: #2C2C2C;
    line-height: 1.7;
  }

  .img-grid {
    display: grid;
    gap: 12rpx;
    margin-top: 20rpx;

    &.grid-1 { grid-template-columns: 1fr; max-width: 400rpx; }
    &.grid-2 { grid-template-columns: 1fr 1fr; }
    &.grid-3 { grid-template-columns: 1fr 1fr 1fr; }

    .img-item-img {
      aspect-ratio: 1;
      border-radius: 16rpx;
      width: 100%;
      height: 100%;
    }
  }

  .loc-tag {
    display: inline-flex;
    align-items: center;
    gap: 6rpx;
    margin-top: 16rpx;
    padding: 8rpx 16rpx;
    background: #F5F2EE;
    border-radius: 16rpx;

    .loc-icon { font-size: 22rpx; }
    .loc-text { font-size: 22rpx; color: #999; }
  }
}

.card-bottom {
  display: flex;
  gap: 48rpx;
  padding-top: 20rpx;
  margin-top: 16rpx;
  border-top: 1rpx solid #F0EDE8;

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 8rpx 12rpx;
    border-radius: 20rpx;

    &:active { background: #F5F2EE; }

    &.liked {
      .action-emoji { animation: heartBeat 0.3s ease; }
    }

    .action-emoji { font-size: 28rpx; }
    .action-num { font-size: 24rpx; color: #999; }
  }
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}
</style>
