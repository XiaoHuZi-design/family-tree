<template>
  <view class="publish-container">
    <view class="nav-header">
      <text class="cancel-btn" @tap="handleCancel">取消</text>
      <text class="title">发布动态</text>
      <view class="publish-btn" :class="{ active: canPublish }" @tap="handlePublish">
        <text class="btn-text">发布</text>
      </view>
    </view>

    <view class="main-content">
      <view class="input-card">
        <textarea
          class="content-input"
          v-model="content"
          placeholder="分享家族的故事..."
          :maxlength="500"
          auto-height
        ></textarea>
        <text class="char-count">{{ content.length }}/500</text>
      </view>

      <view class="images-section">
        <view class="section-title">
          <text class="title-text">添加图片</text>
          <text class="title-hint">最多9张</text>
        </view>
        <view class="images-grid">
          <view class="image-item" v-for="(img, index) in images" :key="index">
            <image
              v-if="!img.isPlaceholder"
              class="image-real"
              :src="img.url"
              mode="aspectFill"
            />
            <view v-else class="image-placeholder" :style="{background: img.gradient}">
              <text class="image-num">{{ index + 1 }}</text>
            </view>
            <view class="delete-btn" @tap="deleteImage(index)">
              <text class="delete-icon">×</text>
            </view>
          </view>
          <view class="add-image-btn" v-if="images.length < 9" @tap="chooseImage">
            <text class="add-icon">+</text>
            <text class="add-text">添加</text>
          </view>
        </view>
      </view>

      <view class="location-section" @tap="toggleLocation">
        <view class="location-cell">
          <view class="location-left">
            <text class="location-icon">📍</text>
            <text class="location-label">添加位置</text>
          </view>
          <view class="location-right">
            <text class="location-value" v-if="location">{{ location }}</text>
            <text class="arrow-icon">›</text>
          </view>
        </view>
      </view>

      <view class="options-section">
        <view class="option-cell">
          <view class="option-left">
            <text class="option-icon">👁</text>
            <text class="option-label">谁可以看</text>
          </view>
          <view class="option-right">
            <text class="option-value">家族成员</text>
            <text class="arrow-icon">›</text>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-action">
      <view class="submit-btn" :class="{ active: canPublish }" @tap="handlePublish">
        <text class="submit-text">发布动态</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { publishMoment } from '@/api/moments.ts'

interface ImageItem {
  url: string
  isPlaceholder: boolean
  gradient: string
}

const content = ref('')
const images = ref<ImageItem[]>([])
const location = ref('')
const publishing = ref(false)

const canPublish = computed(() => {
  return (content.value.trim().length > 0 || images.value.length > 0) && !publishing.value
})

const gradients = [
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #30cfd0, #330867)',
  'linear-gradient(135deg, #ffecd2, #fcb69f)',
  'linear-gradient(135deg, #2D8B4E, #4CAF50)'
]

const chooseImage = () => {
  uni.chooseImage({
    count: 9 - images.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      for (const tempPath of res.tempFilePaths) {
        images.value.push({
          url: tempPath,
          isPlaceholder: true,
          gradient: gradients[images.value.length % gradients.length]
        })
      }
    }
  })
}

const deleteImage = (index: number) => {
  images.value.splice(index, 1)
}

const toggleLocation = () => {
  if (location.value) {
    location.value = ''
  } else {
    uni.chooseLocation({
      success: (res) => {
        location.value = res.name || res.address || '未知位置'
      },
      fail: () => {
        uni.showToast({ title: '无法获取位置', icon: 'none' })
      }
    })
  }
}

const handleCancel = () => {
  if (content.value.trim() || images.value.length > 0) {
    uni.showModal({
      title: '提示',
      content: '确定要放弃编辑吗？',
      confirmText: '确定',
      cancelText: '继续编辑',
      confirmColor: '#2D8B4E',
      success: (res) => {
        if (res.confirm) { uni.navigateBack() }
      }
    })
  } else {
    uni.navigateBack()
  }
}

const uploadImages = async (): Promise<string[]> => {
  const uploadedUrls: string[] = []
  for (const img of images.value) {
    if (!img.isPlaceholder && !img.url.startsWith('http')) {
      try {
        const uploadRes: any = await new Promise((resolve, reject) => {
          uniCloud.uploadFile({
            filePath: img.url,
            cloudPath: `moments/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
            success: (res: any) => resolve(res),
            fail: (err: any) => reject(err)
          })
        })
        uploadedUrls.push(uploadRes.fileID)
      } catch (error) {
        console.error('Image upload failed:', error)
      }
    } else if (img.url.startsWith('http')) {
      uploadedUrls.push(img.url)
    }
  }
  return uploadedUrls
}

const handlePublish = async () => {
  if (!canPublish.value || publishing.value) return

  publishing.value = true
  uni.showLoading({ title: '发布中...', mask: true })

  try {
    const imageUrls = await uploadImages()

    const res = await publishMoment({
      content: content.value.trim(),
      images: imageUrls,
      location: location.value || undefined
    })

    uni.hideLoading()

    if (res.code === 0) {
      uni.showToast({ title: '发布成功', icon: 'success' })
      setTimeout(() => { uni.navigateBack() }, 1500)
    } else {
      console.error('发布动态失败:', JSON.stringify(res))
      uni.showToast({ title: res.msg || '发布失败', icon: 'none' })
    }
  } catch (error: any) {
    console.error('发布动态异常:', error)
    uni.hideLoading()
    uni.showToast({ title: error?.message || '发布失败，请重试', icon: 'none' })
  } finally {
    publishing.value = false
  }
}
</script>

<style lang="scss" scoped>
.publish-container {
  min-height: 100vh;
  background: #F8F6F2;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #EAE6E0;
  position: sticky;
  top: 0;
  z-index: 100;

  .cancel-btn {
    font-size: 30rpx;
    color: #999;
    padding: 8rpx 16rpx;
  }

  .title { font-size: 36rpx; font-weight: 600; color: #2C2C2C; }

  .publish-btn {
    padding: 12rpx 32rpx;
    border-radius: 32rpx;
    background: #F0EDE8;
    transition: all 0.2s ease;

    &.active {
      background: #2D8B4E;
      .btn-text { color: #FFFFFF; }
    }
  }

  .btn-text { font-size: 28rpx; font-weight: 500; color: #999; }
}

.main-content {
  padding: 24rpx;
  padding-bottom: 180rpx;
}

.input-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  position: relative;

  .content-input {
    width: 100%;
    min-height: 240rpx;
    font-size: 32rpx;
    color: #2C2C2C;
    line-height: 1.8;
  }

  .char-count {
    position: absolute;
    bottom: 24rpx;
    right: 32rpx;
    font-size: 24rpx;
    color: #999;
  }
}

.images-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;

  .title-text { font-size: 30rpx; font-weight: 500; color: #2C2C2C; }
  .title-hint { font-size: 24rpx; color: #999; }
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.image-item {
  position: relative;
  aspect-ratio: 1;

  .image-real {
    width: 100%;
    height: 100%;
    border-radius: 16rpx;
  }

  .image-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .image-num { font-size: 48rpx; font-weight: bold; color: rgba(255,255,255,0.7); }
  }

  .delete-btn {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    width: 44rpx;
    height: 44rpx;
    background: #FFFFFF;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15);

    .delete-icon { font-size: 36rpx; font-weight: 300; color: #E74C3C; }
  }
}

.add-image-btn {
  aspect-ratio: 1;
  border: 2rpx dashed #D0C8BC;
  border-radius: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #F8F6F2;
  gap: 8rpx;

  .add-icon { font-size: 56rpx; font-weight: 300; color: #999; }
  .add-text { font-size: 24rpx; color: #999; }
}

.location-section, .options-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
  overflow: hidden;
}

.location-cell, .option-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;

  &:active { background: #FAFAF8; }
}

.location-left, .option-left {
  display: flex;
  align-items: center;
  gap: 16rpx;

  .location-icon, .option-icon { font-size: 32rpx; }
  .location-label, .option-label { font-size: 30rpx; color: #2C2C2C; }
}

.location-right, .option-right {
  display: flex;
  align-items: center;
  gap: 8rpx;

  .location-value, .option-value { font-size: 28rpx; color: #999; }
  .arrow-icon { font-size: 36rpx; color: #CCC; }
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  border-top: 1rpx solid #EAE6E0;
  z-index: 100;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  background: #F0EDE8;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: #2D8B4E;
    box-shadow: 0 8rpx 24rpx rgba(45, 139, 78, 0.3);
    .submit-text { color: #FFFFFF; }
  }
}

.submit-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #999;
}
</style>
