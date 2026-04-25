import { mockCurrentUser } from './data'
import { mockDelay } from '@/utils/mock-config'

export default {
  async login(data: any) {
    await mockDelay()
    return {
      code: 0, msg: 'success',
      data: {
        token: 'mock_token_' + Date.now(),
        userInfo: mockCurrentUser
      }
    }
  },

  async getProfile() {
    await mockDelay()
    return { code: 0, msg: 'success', data: mockCurrentUser }
  },

  async updateProfile(data: any) {
    await mockDelay()
    return { code: 0, msg: 'success', data: { ...mockCurrentUser, ...data } }
  },

  async logout() {
    await mockDelay()
    return { code: 0, msg: 'success' }
  }
}
