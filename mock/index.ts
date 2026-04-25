import { USE_MOCK } from '@/utils/mock-config'
import mockFamily from './co-family'
import mockMoments from './co-moments'
import mockChat from './co-chat'
import mockUser from './co-user'

const mockMap: Record<string, any> = {
  'co-family': mockFamily,
  'co-moments': mockMoments,
  'co-chat': mockChat,
  'co-user': mockUser
}

export function setupMock() {
  if (!USE_MOCK) return

  const originalImportObject = uniCloud.importObject.bind(uniCloud)

  uniCloud.importObject = function (cloudName: string, options?: any) {
    if (mockMap[cloudName]) {
      console.log(`[Mock] ${cloudName} — 使用本地模拟数据`)
      return mockMap[cloudName]
    }
    return originalImportObject(cloudName, options)
  }

  // mock uniCloud.uploadFile
  const originalUploadFile = uniCloud.uploadFile?.bind(uniCloud)
  if (uniCloud.uploadFile) {
    uniCloud.uploadFile = function (options: any) {
      const result = { fileID: 'mock_file_' + Date.now() + '.jpg' }
      options.success && options.success(result as any)
      return { promise: Promise.resolve(result) } as any
    }
  }

  // 初始化本地存储（模拟登录态）
  if (!uni.getStorageSync('userInfo')) {
    uni.setStorageSync('userInfo', {
      _id: 'm6',
      nickname: '张小明',
      avatar: '',
      phone: '15800006666',
      familyId: 'f1',
      familyIds: ['f1']
    })
  }
  if (!uni.getStorageSync('currentFamilyId')) {
    uni.setStorageSync('currentFamilyId', 'f1')
  }

  console.log('[Mock] 已启用，所有云函数调用将使用本地数据')
}
