<template>
  <view class="moments-card" @tap="handleClick">
    <view class="card-header">
      <image class="author-avatar" :src="moment.author.avatar" mode="aspectFill"></image>
      <view class="author-info">
        <text class="author-name">{{ moment.author.nickname }}</text>
        <text class="publish-time">{{ formatTime(moment.createTime) }}</text>
      </view>
      <view class="more-btn" @tap.stop="showMoreMenu">
        <text class="iconfont icon-more"></text>
      </view>
    </view>

    <view class="card-content">
      <text class="content-text" v-if="moment.content">{{ moment.content }}</text>
      <view class="images-grid" v-if="moment.images && moment.images.length > 0">
        <image
          class="grid-image"
          v-for="(img, index) in displayImages"
          :key="index"
          :src="img"
          :class="'grid-' + moment.images.length"
          mode="aspectFill"
          @tap.stop="previewImage(index)"
        ></image>
        <view class="more-images" v-if="moment.images.length > 9" @tap.stop="previewImage(0)">
          <text class="more-text">+{{ moment.images.length - 9 }}</text>
        </view>
      </view>
      <view class="location-tag" v-if="moment.location">
        <text class="iconfont icon-location"></text>
        <text class="location-text">{{ moment.location }}</text>
      </view>
    </view>

    <view class="card-footer">
      <view class="action-item" @tap.stop="handleLike">
        <text class="iconfont" :class="moment.isLiked ? 'icon-heart-filled' : 'icon-heart'"></text>
        <text class="action-text">{{ moment.likes || 0 }}</text>
      </view>
      <view class="action-item" @tap.stop="handleComment">
        <text class="iconfont icon-comment"></text>
        <text class="action-text">{{ moment.comments || 0 }}</text>
      </view>
      <view class="action-item" @tap.stop="handleShare">
        <text class="iconfont icon-share"></text>
      </view>
    </view>

    <view class="comments-section" v-if="moment.commentList && moment.commentList.length > 0">
      <view class="comment-item" v-for="comment in moment.commentList" :key="comment._id">
        <text class="comment-user">{{ comment.author.nickname }}</text>
        <text class="comment-text">: {{ comment.content }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MomentAuthor {
  _id: string
  nickname: string
  avatar: string
}

interface Comment {
  _id: string
  author: MomentAuthor
  content: string
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
  commentList?: Comment[]
}

interface Props {
  moment: Moment
}

interface Emits {
  (e: 'click', moment: Moment): void
  (e: 'like', momentId: string): void
  (e: 'comment', momentId: string): void
  (e: 'share', moment: Moment): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const displayImages = computed(() => {
  return props.moment.images.slice(0, 9)
})

const handleClick = () => {
  emit('click', props.moment)
}

const handleLike = () => {
  emit('like', props.moment._id)
}

const handleComment = () => {
  emit('comment', props.moment._id)
}

const handleShare = () => {
  emit('share', props.moment)
}

const showMoreMenu = () => {
  uni.showActionSheet({
    itemList: ['复制', '举报'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.setClipboardData({
          data: props.moment.content || ''
        })
      }
    }
  })
}

const previewImage = (index: number) => {
  uni.previewImage({
    urls: props.moment.images,
    current: index
  })
}

const formatTime = (time: string) => {
  const now = Date.now()
  const timestamp = new Date(time).getTime()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < 7 * day) {
    return Math.floor(diff / day) + '天前'
  } else {
    const date = new Date(time)
    return `${date.getMonth() + 1}-${date.getDate()}`
  }
}
</script>

<style scoped>
.moments-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.author-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #f0f0f0;
}

.author-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.publish-time {
  font-size: 24rpx;
  color: #999;
}

.more-btn {
  padding: 8rpx;
}

.more-btn .iconfont {
  font-size: 32rpx;
  color: #999;
}

.card-content {
  margin-bottom: 20rpx;
}

.content-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 20rpx;
}

.images-grid {
  display: grid;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.grid-image {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
  background-color: #f5f5f5;
}

.grid-1 {
  grid-template-columns: 1fr;
  max-width: 500rpx;
}

.grid-1 .grid-image {
  aspect-ratio: 4/3;
}

.grid-2, .grid-4 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-2 .grid-image, .grid-4 .grid-image {
  aspect-ratio: 1;
}

.grid-3, .grid-5, .grid-6, .grid-7, .grid-8, .grid-9 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-3 .grid-image, .grid-5 .grid-image, .grid-6 .grid-image,
.grid-7 .grid-image, .grid-8 .grid-image, .grid-9 .grid-image {
  aspect-ratio: 1;
}

.more-images {
  aspect-ratio: 1;
  background-color: rgba(0,0,0,0.5);
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.more-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 500;
}

.location-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 16rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  align-self: flex-start;
}

.location-tag .iconfont {
  font-size: 28rpx;
  color: #2D8B4E;
}

.location-text {
  font-size: 26rpx;
  color: #666;
}

.card-footer {
  display: flex;
  gap: 60rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-item .iconfont {
  font-size: 32rpx;
  color: #666;
}

.action-item .icon-heart-filled {
  color: #ff4d4f;
}

.action-text {
  font-size: 26rpx;
  color: #666;
}

.comments-section {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.comment-item {
  padding: 12rpx 0;
  font-size: 28rpx;
  line-height: 1.5;
}

.comment-user {
  color: #2D8B4E;
  font-weight: 500;
}

.comment-text {
  color: #333;
}
</style>
