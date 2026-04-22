<template>
  <view class="mine-page">
    <view class="header-section">
      <view class="header-content">
        <view class="user-area">
          <image
            v-if="userInfo && userInfo.avatar"
            class="avatar-img"
            :src="userInfo.avatar"
            mode="aspectFill"
          />
          <view v-else class="avatar-wrap">
            <text class="avatar-emoji">{{ (userInfo && userInfo.nickname || '?').charAt(0) }}</text>
          </view>
          <view class="user-info">
            <text class="nickname">{{ userInfo && userInfo.nickname || '未登录' }}</text>
            <view class="tags">
              <view v-if="userInfo && userInfo.role === 'owner'" class="tag owner">族主</view>
              <view v-else-if="userInfo && userInfo.role === 'admin'" class="tag owner">管理员</view>
              <view class="tag gen">家族成员</view>
            </view>
          </view>
        </view>
        <text class="family-label" v-if="userInfo && userInfo.familyId">张氏家族 · {{ familyStats.totalMembers }}位成员</text>
        <text class="family-label" v-else>暂未加入家族</text>
      </view>
      <view class="header-curve"></view>
    </view>

    <!-- Stats cards -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-num">{{ familyStats.totalMembers }}</text>
        <text class="stat-label">家族成员</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ generationCount }}</text>
        <text class="stat-label">世代传承</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">-</text>
        <text class="stat-label">动态发布</text>
      </view>
    </view>

    <!-- Menu -->
    <view class="menu-section">
      <view class="menu-card">
        <view class="menu-item" v-for="(item, idx) in menuItems" :key="idx"
          :class="{'no-border': idx === menuItems.length - 1}"
          @tap="handleMenu(item)">
          <view class="item-left">
            <view class="item-icon-wrap" :style="{background: item.iconBg}">
              <text class="item-icon">{{ item.icon }}</text>
            </view>
            <text class="item-text">{{ item.label }}</text>
          </view>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="logout-section">
      <view class="logout-btn" @tap="handleLogout">
        <text class="logout-text">退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore.ts'
import { familyApi } from '@/api/family.ts'
import { onShow } from '@dcloudio/uni-app'

const store = useUserStore()
const statsLoading = ref(false)

const familyStats = ref({
  totalMembers: 0,
  generationCounts: {} as Record<number, number>
})

const userInfo = computed(() => store.userInfo)

const generationCount = computed(() => {
  return Object.keys(familyStats.value.generationCounts).length
})

const menuItems = [
  { icon: '📝', label: '编辑资料', iconBg: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { icon: '👨‍👩‍👧', label: '家族管理', iconBg: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { icon: '📍', label: '坟位管理', iconBg: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { icon: '📋', label: '族谱导出', iconBg: 'linear-gradient(135deg, #fa709a, #fee140)' },
  { icon: '💬', label: '意见反馈', iconBg: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { icon: 'ℹ️', label: '关于家族树', iconBg: 'linear-gradient(135deg, #30cfd0, #330867)' }
]

const fetchStats = async () => {
  statsLoading.value = true
  try {
    const stats = await familyApi.getFamilyStats()
    if (stats) {
      familyStats.value = stats
    }
  } catch (error) {
    console.error('Failed to fetch family stats:', error)
  } finally {
    statsLoading.value = false
  }
}

const handleMenu = (item: any) => {
  uni.showToast({ title: item.label + '功能开发中', icon: 'none' })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    confirmColor: '#E74C3C',
    success: async (res) => {
      if (res.confirm) {
        await store.logout()
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}

onMounted(async () => {
  await store.fetchProfile()
  fetchStats()
})

onShow(() => {
  fetchStats()
})
</script>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  background: #F8F6F2;
}

.header-section {
  position: relative;
  background: linear-gradient(135deg, #2D8B4E 0%, #4CAF50 100%);
  padding: 48rpx 36rpx 60rpx;
  border-radius: 0 0 40rpx 40rpx;

  .header-content {
    .user-area {
      display: flex;
      align-items: center;
    }

    .avatar-img {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(255,255,255,0.4);
      box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.15);
    }

    .avatar-wrap {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4rpx solid rgba(255,255,255,0.4);
      box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.15);

      .avatar-emoji { font-size: 52rpx; color: #FFFFFF; font-weight: bold; }
    }

    .user-info {
      margin-left: 24rpx;

      .nickname {
        display: block;
        font-size: 40rpx;
        font-weight: bold;
        color: #FFFFFF;
        text-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);
      }

      .tags {
        display: flex;
        gap: 12rpx;
        margin-top: 12rpx;

        .tag {
          padding: 6rpx 18rpx;
          border-radius: 16rpx;
          font-size: 22rpx;

          &.owner {
            background: rgba(255,255,255,0.3);
            color: #FFFFFF;
          }
          &.gen {
            background: rgba(255,255,255,0.15);
            color: rgba(255,255,255,0.9);
          }
        }
      }
    }

    .family-label {
      display: block;
      margin-top: 20rpx;
      margin-left: 144rpx;
      font-size: 26rpx;
      color: rgba(255,255,255,0.8);
    }
  }

  .header-curve {
    position: absolute;
    bottom: -1rpx;
    left: 0; right: 0;
    height: 40rpx;
    background: #F8F6F2;
    border-radius: 40rpx 40rpx 0 0;
  }
}

.stats-row {
  display: flex;
  padding: 32rpx 24rpx;
  gap: 16rpx;
  margin-top: -20rpx;
  position: relative;
  z-index: 2;

  .stat-card {
    flex: 1;
    background: #FFFFFF;
    border-radius: 20rpx;
    padding: 28rpx 20rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);

    .stat-num {
      font-size: 40rpx;
      font-weight: bold;
      color: #2D8B4E;
    }

    .stat-label {
      font-size: 22rpx;
      color: #999;
      margin-top: 8rpx;
    }
  }
}

.menu-section {
  padding: 0 24rpx;

  .menu-card {
    background: #FFFFFF;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx;
  border-bottom: 1rpx solid #F5F2EE;

  &.no-border { border-bottom: none; }
  &:active { background: #FAFAF8; }

  .item-left {
    display: flex;
    align-items: center;

    .item-icon-wrap {
      width: 56rpx;
      height: 56rpx;
      border-radius: 14rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;

      .item-icon { font-size: 28rpx; }
    }

    .item-text {
      font-size: 30rpx;
      color: #2C2C2C;
      font-weight: 500;
    }
  }

  .item-arrow {
    font-size: 40rpx;
    color: #CCC;
  }
}

.logout-section {
  padding: 40rpx 24rpx;

  .logout-btn {
    background: #FFFFFF;
    border-radius: 24rpx;
    padding: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);

    &:active { background: #FFF5F5; }

    .logout-text {
      font-size: 30rpx;
      color: #E74C3C;
      font-weight: 500;
    }
  }
}
</style>
