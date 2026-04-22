import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getProfile, logout as logoutApi } from '@/api/user'
import type { UserInfo } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const login = async (params: { phone: string; code: string }) => {
    try {
      const res = await loginApi(params)
      if (res.code === 0 && res.data) {
        token.value = res.data.token
        userInfo.value = res.data.userInfo
        uni.setStorageSync('uni_id_token', res.data.token)
        uni.setStorageSync('userInfo', res.data.userInfo)
      }
      return res
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    }
  }

  const setLoginData = (tokenValue: string, info: UserInfo) => {
    token.value = tokenValue
    userInfo.value = info
    uni.setStorageSync('uni_id_token', tokenValue)
    uni.setStorageSync('userInfo', info)
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      token.value = ''
      userInfo.value = null
      uni.removeStorageSync('uni_id_token')
      uni.removeStorageSync('userInfo')
    }
  }

  const fetchProfile = async () => {
    if (!token.value) {
      const storedToken = uni.getStorageSync('uni_id_token')
      if (storedToken) {
        token.value = storedToken
      }
    }

    if (!userInfo.value) {
      const storedUserInfo = uni.getStorageSync('userInfo')
      if (storedUserInfo) {
        userInfo.value = storedUserInfo
      }
    }

    try {
      const res = await getProfile()
      if (res.code === 0 && res.data) {
        userInfo.value = res.data
        uni.setStorageSync('userInfo', res.data)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  const updateProfile = async (data: Partial<UserInfo>) => {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...data }
      uni.setStorageSync('userInfo', userInfo.value)
    }
  }

  const initFromStorage = () => {
    const storedToken = uni.getStorageSync('uni_id_token')
    const storedUserInfo = uni.getStorageSync('userInfo')

    if (storedToken) {
      token.value = storedToken
    }
    if (storedUserInfo) {
      userInfo.value = storedUserInfo
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    setLoginData,
    logout,
    fetchProfile,
    updateProfile,
    initFromStorage
  }
})
