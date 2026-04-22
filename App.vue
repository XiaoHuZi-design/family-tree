<script>
export default {
  onLaunch() {
    console.log('App Launch')
    // 迁移旧 token 到 uniCloud 标准键名
    const uniToken = uni.getStorageSync('uni_id_token')
    const oldToken = uni.getStorageSync('token')
    if (!uniToken && oldToken) {
      uni.setStorageSync('uni_id_token', oldToken)
      const oldExpired = uni.getStorageSync('tokenExpired')
      if (oldExpired) {
        uni.setStorageSync('uni_id_token_expired', oldExpired)
      }
    }
    if (!uniToken && !oldToken) {
      uni.reLaunch({ url: '/pages/login/login' })
    }
  },
  onShow() {
    console.log('App Show')
  },
  onHide() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
@import './uni.scss';
@import './styles/common.scss';

page {
  background-color: #F5F5F5;
  font-size: 28rpx;
  color: #333333;
  line-height: 1.6;
}

view, text, image, input, textarea, button, scroll-view {
  box-sizing: border-box;
}
</style>
