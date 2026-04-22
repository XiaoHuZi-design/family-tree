<template>
  <view class="detail-page">
    <!-- Loading State -->
    <view v-if="loading" class="state-container">
      <text class="state-emoji">⏳</text>
      <text class="state-text">加载中...</text>
    </view>

    <!-- Empty / Error State -->
    <view v-else-if="!member" class="state-container">
      <text class="state-emoji">😔</text>
      <text class="state-text">未找到成员信息</text>
    </view>

    <!-- Member Detail -->
    <template v-else>
      <view class="detail-header" :style="{background: headerGradient}">
        <view class="header-actions">
          <view class="back-btn" @tap="goBack">
            <text class="back-text">‹ 返回</text>
          </view>
          <view class="edit-btn" @tap="goEdit">
            <text class="back-text">编辑</text>
          </view>
        </view>
        <view class="avatar-large" :style="{background: avatarGradient}">
          <text class="avatar-emoji-lg">{{ avatarEmoji }}</text>
        </view>
        <text class="detail-name">{{ member.name }}</text>
        <view class="detail-tags">
          <view class="d-tag gen">第{{ member.generation }}代</view>
          <view v-if="member.relation" class="d-tag rel">{{ member.relation }}</view>
        </view>
      </view>

      <view class="info-section">
        <!-- 联系方式 -->
        <view class="info-card">
          <view class="card-title-row">
            <text class="card-emoji">📱</text>
            <text class="card-title">联系方式</text>
          </view>
          <view v-if="member.phone" class="info-row" @tap="callPhone">
            <text class="info-label">手机号</text>
            <text class="info-value">{{ member.phone }}</text>
            <view class="info-action"><text class="action-green">拨打</text></view>
          </view>
          <view v-if="member.wechat" class="info-row">
            <text class="info-label">微信号</text>
            <text class="info-value">{{ member.wechat }}</text>
            <view class="info-action" @tap="copyWechat"><text class="action-green">复制</text></view>
          </view>
          <view v-if="!member.phone && !member.wechat" class="info-row">
            <text class="info-value empty">暂无联系方式</text>
          </view>
        </view>

        <!-- 家庭住址 -->
        <view v-if="member.homeAddress" class="info-card">
          <view class="card-title-row">
            <text class="card-emoji">🏠</text>
            <text class="card-title">家庭住址</text>
          </view>
          <view class="info-row">
            <text class="info-value full">{{ member.homeAddress }}</text>
            <view class="info-action" @tap="copyAddr(member.homeAddress || '')"><text class="action-green">复制</text></view>
          </view>
        </view>

        <!-- 坟位地址 -->
        <view v-if="member.graveAddress" class="info-card">
          <view class="card-title-row">
            <text class="card-emoji">⛩️</text>
            <text class="card-title">坟位地址</text>
          </view>
          <view class="info-row">
            <text class="info-value full">{{ member.graveAddress }}</text>
            <view class="info-action" @tap="copyAddr(member.graveAddress || '')"><text class="action-green">复制</text></view>
          </view>
        </view>

        <!-- 备注 -->
        <view v-if="member.remark" class="info-card">
          <view class="card-title-row">
            <text class="card-emoji">📝</text>
            <text class="card-title">备注</text>
          </view>
          <text class="remark-text">{{ member.remark }}</text>
        </view>

        <!-- No extra info state -->
        <view v-if="!member.phone && !member.wechat && !member.homeAddress && !member.graveAddress && !member.remark" class="info-card">
          <text class="empty-info-text">暂无更多详细信息</text>
        </view>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import familyApi from '@/api/family'

interface MemberDetail {
  _id: string
  name: string
  generation: number
  relation?: string
  phone?: string
  wechat?: string
  homeAddress?: string
  graveAddress?: string
  remark?: string
  avatar?: string
  gender?: number
}

const member = ref<MemberDetail | null>(null)
const loading = ref(true)

const generationGradients: Record<number, { header: string; avatar: string }> = {
  1: { header: 'linear-gradient(135deg, #667eea, #764ba2)', avatar: 'linear-gradient(135deg, #667eea, #764ba2)' },
  2: { header: 'linear-gradient(135deg, #4facfe, #00f2fe)', avatar: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  3: { header: 'linear-gradient(135deg, #2D8B4E, #4CAF50)', avatar: 'linear-gradient(135deg, #2D8B4E, #4CAF50)' },
  4: { header: 'linear-gradient(135deg, #43e97b, #38f9d7)', avatar: 'linear-gradient(135deg, #43e97b, #38f9d7)' }
}

const headerGradient = computed(() => {
  const gen = member.value?.generation || 1
  return generationGradients[gen]?.header || 'linear-gradient(135deg, #2D8B4E, #4CAF50)'
})

const avatarGradient = computed(() => {
  const gen = member.value?.generation || 1
  return generationGradients[gen]?.avatar || 'linear-gradient(135deg, #667eea, #764ba2)'
})

const avatarEmoji = computed(() => {
  const g = member.value?.gender
  if (g === 1) return '👨'
  if (g === 2) return '👩'
  return '🧑'
})

onLoad(async (options: any) => {
  const id = options?.id
  if (!id) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const data = await familyApi.getMemberDetail(id)
    member.value = data
  } catch (error) {
    console.error('Failed to load member detail', error)
    member.value = null
  } finally {
    loading.value = false
  }
})

const goBack = () => { uni.navigateBack() }

const goEdit = () => {
  if (!member.value?._id) return
  uni.navigateTo({ url: `/pages/member/add-member?editId=${member.value._id}` })
}

const callPhone = () => {
  if (!member.value?.phone) return
  uni.makePhoneCall({
    phoneNumber: member.value.phone,
    fail: () => {
      uni.setClipboardData({
        data: member.value!.phone || '',
        success: () => { uni.showToast({ title: '已复制手机号', icon: 'success' }) }
      })
    }
  })
}

const copyWechat = () => {
  if (!member.value?.wechat) return
  uni.setClipboardData({
    data: member.value.wechat,
    success: () => { uni.showToast({ title: '已复制微信号', icon: 'success' }) }
  })
}

const copyAddr = (addr: string) => {
  if (!addr) return
  uni.setClipboardData({
    data: addr,
    success: () => { uni.showToast({ title: '已复制地址', icon: 'success' }) }
  })
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #F8F6F2;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;

  .state-emoji { font-size: 80rpx; margin-bottom: 24rpx; }
  .state-text { font-size: 28rpx; color: #999; }
}

.detail-header {
  padding: 48rpx 32rpx 60rpx;
  border-radius: 0 0 40rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  .header-actions {
    position: absolute;
    top: 48rpx;
    left: 32rpx;
    right: 32rpx;
    display: flex;
    justify-content: space-between;
  }

  .back-btn, .edit-btn {
    padding: 12rpx 20rpx;
    background: rgba(255,255,255,0.25);
    border-radius: 20rpx;

    .back-text { font-size: 26rpx; color: #FFFFFF; }
  }

  .avatar-large {
    width: 140rpx;
    height: 140rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 6rpx solid rgba(255,255,255,0.4);
    box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.2);
    margin-bottom: 20rpx;

    .avatar-emoji-lg { font-size: 70rpx; }
  }

  .detail-name {
    font-size: 44rpx;
    font-weight: bold;
    color: #FFFFFF;
    text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.15);
    margin-bottom: 16rpx;
  }

  .detail-tags {
    display: flex;
    gap: 16rpx;

    .d-tag {
      padding: 8rpx 24rpx;
      border-radius: 20rpx;
      font-size: 24rpx;

      &.gen { background: rgba(255,255,255,0.25); color: #FFFFFF; }
      &.rel { background: #FFFFFF; color: #2D8B4E; font-weight: 600; }
    }
  }
}

.info-section { padding: 24rpx; }

.info-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #F0EDE8;

  .card-emoji { font-size: 32rpx; }
  .card-title { font-size: 30rpx; font-weight: 600; color: #2C2C2C; }
}

.info-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;

  .info-label {
    font-size: 26rpx;
    color: #999;
    width: 120rpx;
    flex-shrink: 0;
  }

  .info-value {
    flex: 1;
    font-size: 28rpx;
    color: #2C2C2C;

    &.full { flex: 1; line-height: 1.6; }
    &.empty { color: #CCC; font-size: 26rpx; }
  }

  .info-action {
    flex-shrink: 0;
    margin-left: 16rpx;

    .action-green {
      font-size: 24rpx;
      color: #2D8B4E;
      padding: 8rpx 20rpx;
      background: #E8F5EC;
      border-radius: 16rpx;
    }
  }
}

.remark-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.7;
}

.empty-info-text {
  font-size: 26rpx;
  color: #CCC;
  text-align: center;
  padding: 20rpx 0;
}
</style>
