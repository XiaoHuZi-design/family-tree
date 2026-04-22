<template>
  <view class="login-page">
    <!-- 中间区域：Logo + 品牌信息 -->
    <view class="brand-section">
      <view class="logo-wrapper">
        <text class="tree-icon">🌳</text>
      </view>
      <text class="app-name">家族树</text>
      <text class="slogan">连接家族，传承记忆</text>
    </view>

    <!-- 底部区域：登录卡片 -->
    <view class="login-section">
      <!-- 白色圆角卡片容器 -->
      <view class="login-card">
        <!-- 微信一键登录按钮 -->
        <!-- #ifdef MP-WEIXIN -->
        <button
          class="login-btn wechat-btn"
          :disabled="loginLoading"
          open-type="getUserInfo"
          @getuserinfo="handleWechatLogin"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
          <text>{{ loginLoading ? '登录中...' : '微信一键登录' }}</text>
        </button>
        <!-- #endif -->

        <!-- 手机号登录按钮 -->
        <button
          class="login-btn phone-btn"
          :disabled="loginLoading"
          @tap="showPhoneLogin = true"
          @touchstart="handleTouchStart"
          @touchend="handleTouchEnd"
        >
          <text>手机号登录</text>
        </button>

        <!-- 手机号登录表单 -->
        <view v-if="showPhoneLogin" class="phone-form">
          <view class="input-row">
            <input
              class="phone-input"
              v-model="phone"
              placeholder="请输入手机号"
              maxlength="11"
              type="number"
            />
          </view>
          <view class="input-row code-row">
            <input
              class="code-input"
              v-model="code"
              placeholder="请输入验证码"
              maxlength="6"
              type="number"
            />
            <text
              class="code-btn"
              :class="{ disabled: counting }"
              @tap="sendCode"
            >
              {{ codeButtonText }}
            </text>
          </view>
          <button
            class="submit-btn"
            :disabled="loginLoading"
            @tap="handlePhoneLogin"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
          >
            <text>{{ loginLoading ? '登录中...' : '登录' }}</text>
          </button>
        </view>
      </view>

      <!-- 隐私协议 -->
      <view class="agreement-section">
        <view class="custom-checkbox" @tap="toggleAgreement">
          <view class="checkbox-box" :class="{ checked: agreed }">
            <text v-if="agreed" class="check-mark">✓</text>
          </view>
          <text class="agreement-text">已阅读并同意</text>
          <text class="agreement-link" @tap.stop="openAgreement">《用户协议》</text>
          <text class="agreement-text">和</text>
          <text class="agreement-link" @tap.stop="openPrivacy">《隐私政策》</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const coUser = uniCloud.importObject('co-user')

const showPhoneLogin = ref(false)
const phone = ref('')
const code = ref('')
const agreed = ref(false)
const counting = ref(false)
const countdown = ref(60)
const loginLoading = ref(false)

const codeButtonText = ref('获取验证码')

// 按钮触摸效果
const buttonScale = ref(1)

const handleTouchStart = () => {
  buttonScale.value = 0.95
}

const handleTouchEnd = () => {
  buttonScale.value = 1
}

const startCountdown = () => {
  counting.value = true
  countdown.value = 60
  codeButtonText.value = `${countdown.value}s`

  const timer = setInterval(() => {
    countdown.value--
    codeButtonText.value = `${countdown.value}s`

    if (countdown.value <= 0) {
      clearInterval(timer)
      counting.value = false
      codeButtonText.value = '获取验证码'
    }
  }, 1000)
}

const sendCode = async () => {
  if (counting.value) return

  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
    return
  }

  try {
    await coUser.sendSmsCode({ phone: phone.value })
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    })
    startCountdown()
  } catch (e: any) {
    uni.showToast({
      title: e.message || '发送验证码失败',
      icon: 'none'
    })
  }
}

const handleWechatLogin = async (e: any) => {
  if (!agreed.value) {
    uni.showToast({
      title: '请先同意用户协议',
      icon: 'none'
    })
    return
  }

  if (e.detail.errMsg !== 'getUserInfo:ok') {
    return
  }

  if (loginLoading.value) return
  loginLoading.value = true

  try {
    // 1. 调用 uni.login 获取微信 code
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject
      })
    })

    if (!loginRes.code) {
      uni.showToast({ title: '微信登录失败，请重试', icon: 'none' })
      return
    }

    // 2. 调用云对象 wxLogin
    const res = await coUser.wxLogin(loginRes.code)

    if (res.token) {
      // 3. 存储 token（uniCloud 需要 uni_id_token）
      uni.setStorageSync('uni_id_token', res.token)
      uni.setStorageSync('uni_id_token_expired', res.tokenExpired)
      if (res.userInfo) {
        uni.setStorageSync('userInfo', res.userInfo)
      }

      uni.showToast({ title: '登录成功', icon: 'success' })

      // 4. 跳转首页
      setTimeout(() => {
        uni.switchTab({ url: '/pages/family-tree/family-tree' })
      }, 500)
    } else {
      uni.showToast({ title: res.message || '登录失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({
      title: e.message || '微信登录失败',
      icon: 'none'
    })
  } finally {
    loginLoading.value = false
  }
}

const handlePhoneLogin = async () => {
  if (!agreed.value) {
    uni.showToast({
      title: '请先同意用户协议',
      icon: 'none'
    })
    return
  }

  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
    return
  }

  if (!code.value || code.value.length !== 6) {
    uni.showToast({
      title: '请输入6位验证码',
      icon: 'none'
    })
    return
  }

  if (loginLoading.value) return
  loginLoading.value = true

  try {
    const res = await coUser.phoneLogin({ phone: phone.value, code: code.value })

    if (res.token) {
      uni.setStorageSync('uni_id_token', res.token)
      uni.setStorageSync('uni_id_token_expired', res.tokenExpired)
      if (res.userInfo) {
        uni.setStorageSync('userInfo', res.userInfo)
      }

      uni.showToast({ title: '登录成功', icon: 'success' })

      setTimeout(() => {
        uni.switchTab({ url: '/pages/family-tree/family-tree' })
      }, 500)
    } else {
      uni.showToast({ title: res.message || '登录失败', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({
      title: e.message || '登录失败',
      icon: 'none'
    })
  } finally {
    loginLoading.value = false
  }
}

const toggleAgreement = () => {
  agreed.value = !agreed.value
}

const openAgreement = () => {
  uni.showToast({
    title: '用户协议页开发中',
    icon: 'none'
  })
}

const openPrivacy = () => {
  uni.showToast({
    title: '隐私政策页开发中',
    icon: 'none'
  })
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #2D8B4E 0%, #4CAF50 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60rpx 48rpx 100rpx;
  box-sizing: border-box;
}

.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: slideInFromTop 0.8s ease-out;
}

.logo-wrapper {
  margin-bottom: 32rpx;
}

.tree-icon {
  font-size: 120rpx;
  line-height: 1;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #FFFFFF;
  letter-spacing: 8rpx;
  margin-bottom: 16rpx;
}

.slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 2rpx;
}

.login-section {
  animation: slideInFromBottom 0.8s ease-out;
}

.login-card {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
  margin-bottom: 48rpx;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  margin-bottom: 24rpx;
  transition: transform 0.15s ease;
}

.login-btn:last-child {
  margin-bottom: 0;
}

.wechat-btn {
  background-color: #07C160;
  color: #FFFFFF;
}

.phone-btn {
  background-color: #D4A574;
  color: #FFFFFF;
}

.phone-form {
  margin-top: 32rpx;
}

.input-row {
  margin-bottom: 24rpx;
}

.phone-input,
.code-input {
  width: 100%;
  height: 96rpx;
  background-color: #F8F6F2;
  border-radius: 48rpx;
  padding: 0 32rpx;
  font-size: 30rpx;
  color: #2C2C2C;
  box-sizing: border-box;
}

.code-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.code-input {
  flex: 1;
}

.code-btn {
  flex-shrink: 0;
  width: 180rpx;
  height: 96rpx;
  background-color: #2D8B4E;
  color: #FFFFFF;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  transition: opacity 0.3s ease;
}

.code-btn.disabled {
  background-color: #CCCCCC;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background-color: #2D8B4E;
  color: #FFFFFF;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  margin-top: 16rpx;
}

.agreement-section {
  padding: 0 20rpx;
}

.custom-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.checkbox-box {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.6);
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
  background-color: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.checkbox-box.checked {
  background-color: #FFFFFF;
  border-color: #FFFFFF;
}

.check-mark {
  font-size: 24rpx;
  color: #2D8B4E;
  font-weight: bold;
  line-height: 1;
}

.agreement-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-right: 8rpx;
}

.agreement-link {
  font-size: 24rpx;
  color: #FFFFFF;
  text-decoration: underline;
}

/* 动画定义 */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-60rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(60rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
