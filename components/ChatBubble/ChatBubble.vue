<template>
  <view class="chat-bubble" :class="{ 'is-mine': message.isMine }">
    <image class="bubble-avatar" :src="message.avatar" mode="aspectFill"></image>

    <view class="bubble-content">
      <view
        class="bubble-message"
        :class="{
          'is-mine': message.isMine,
          'is-text': message.type === 'text',
          'is-image': message.type === 'image',
          'is-location': message.type === 'location'
        }"
      >
        <text class="message-text" v-if="message.type === 'text'">{{ message.text }}</text>

        <image
          class="message-image"
          v-else-if="message.type === 'image'"
          :src="message.image"
          mode="widthFix"
          @tap="handleImageTap"
        ></image>

        <view
          class="message-location"
          v-else-if="message.type === 'location'"
          @tap="handleLocationTap"
        >
          <view class="location-header">
            <text class="iconfont icon-location"></text>
            <text class="location-name">{{ message.location?.name }}</text>
          </view>
          <text class="location-address">{{ message.location?.address }}</text>
          <image
            class="location-map"
            :src="message.location?.mapImage || '/static/images/map-placeholder.png'"
            mode="aspectFill"
          ></image>
        </view>
      </view>

      <text class="message-time">{{ formatTime(message.createTime) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface MessageLocation {
  name: string
  address: string
  latitude: number
  longitude: number
  mapImage?: string
}

interface Message {
  _id: string
  type: 'text' | 'image' | 'location'
  text?: string
  image?: string
  location?: MessageLocation
  isMine: boolean
  avatar: string
  createTime: string
}

interface Props {
  message: Message
}

interface Emits {
  (e: 'imageTap', imageUrl: string): void
  (e: 'locationTap', location: MessageLocation): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleImageTap = () => {
  emit('imageTap', props.message.image || '')
  uni.previewImage({
    urls: [props.message.image || '']
  })
}

const handleLocationTap = () => {
  const location = props.message.location
  if (location) {
    emit('locationTap', location)
    uni.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      address: location.address
    })
  }
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.chat-bubble {
  display: flex;
  margin-bottom: 30rpx;
}

.chat-bubble.is-mine {
  flex-direction: row-reverse;
}

.bubble-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background-color: #e0e0e0;
  flex-shrink: 0;
}

.bubble-content {
  max-width: 500rpx;
  display: flex;
  flex-direction: column;
  margin: 0 20rpx;
}

.chat-bubble.is-mine .bubble-content {
  align-items: flex-end;
}

.bubble-message {
  padding: 20rpx 24rpx;
  border-radius: 12rpx;
  background-color: #fff;
  position: relative;
  word-wrap: break-word;
}

.chat-bubble.is-mine .bubble-message {
  background-color: #2D8B4E;
}

.bubble-message.is-text {
  max-width: 100%;
}

.message-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.5;
}

.chat-bubble.is-mine .message-text {
  color: #fff;
}

.bubble-message.is-image {
  padding: 8rpx;
  background-color: transparent;
}

.message-image {
  max-width: 400rpx;
  border-radius: 8rpx;
  display: block;
}

.bubble-message.is-location {
  padding: 20rpx;
  width: 400rpx;
  background-color: #fff;
}

.chat-bubble.is-mine .bubble-message.is-location {
  background-color: #2D8B4E;
}

.message-location {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.location-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.location-header .iconfont {
  font-size: 32rpx;
  color: #2D8B4E;
}

.chat-bubble.is-mine .location-header .iconfont {
  color: #fff;
}

.location-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.chat-bubble.is-mine .location-name {
  color: #fff;
}

.location-address {
  font-size: 26rpx;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-bubble.is-mine .location-address {
  color: rgba(255,255,255,0.8);
}

.location-map {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
  background-color: #e0e0e0;
}

.message-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}
</style>
