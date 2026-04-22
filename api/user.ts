export interface UserInfo {
  _id: string
  nickname: string
  avatar: string
  phone: string
  role: 'owner' | 'admin' | 'member'
  familyId?: string
  familyIds?: string[]
}

interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

interface LoginParams {
  phone: string
  code: string
}

interface LoginResponse {
  token: string
  userInfo: UserInfo
}

interface UpdateProfileParams {
  nickname?: string
  avatar?: string
}

function getCloudObject() {
  return uniCloud.importObject('co-user')
}

export async function login(params: LoginParams): Promise<ApiResponse<LoginResponse>> {
  try {
    const result = await getCloudObject().phoneLogin(params)
    if (result.token) {
      const familyIds = result.userInfo?.familyIds || []
      return {
        code: 0,
        msg: 'success',
        data: {
          token: result.token,
          userInfo: {
            _id: result.userInfo._id || result.userInfo.uid || '',
            nickname: result.userInfo.nickname || '',
            avatar: result.userInfo.avatar || '',
            phone: result.userInfo.phone || params.phone,
            role: result.userInfo.role || 'member',
            familyIds
          }
        }
      }
    }
    return { code: -1, msg: result.message || '登录失败', data: null as any }
  } catch (error: any) {
    return { code: error.code || -1, msg: error.message || '登录失败', data: null as any }
  }
}

export async function getProfile(): Promise<ApiResponse<UserInfo>> {
  try {
    const result = await getCloudObject().getProfile()
    if (result.code === 0 && result.data) {
      const user = result.data
      return {
        code: 0,
        msg: 'success',
        data: {
          _id: user._id || '',
          nickname: user.nickname || '',
          avatar: user.avatar || '',
          phone: user.phone || '',
          role: user.role || 'member',
          familyIds: user.familyIds || []
        }
      }
    }
    return { code: result.code || -1, msg: result.msg || '获取用户信息失败', data: null as any }
  } catch (error: any) {
    return { code: error.code || -1, msg: error.message || '获取用户信息失败', data: null as any }
  }
}

export async function updateProfile(params: UpdateProfileParams): Promise<ApiResponse<UserInfo>> {
  try {
    const result = await getCloudObject().updateProfile(params)
    return { code: 0, msg: 'success', data: null as any }
  } catch (error: any) {
    return { code: error.code || -1, msg: error.message || '更新失败', data: null as any }
  }
}

export async function logout(): Promise<ApiResponse<null>> {
  try {
    await getCloudObject().logout()
  } catch (e) {
    // ignore - we still clear local state
  }
  return { code: 0, msg: 'success', data: null }
}

export async function uploadAvatar(filePath: string): Promise<ApiResponse<{ url: string }>> {
  return new Promise((resolve) => {
    uniCloud.uploadFile({
      filePath: filePath,
      cloudPath: `avatar/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
      success: (res) => {
        resolve({ code: 0, msg: 'success', data: { url: res.fileID } })
      },
      fail: (error) => {
        resolve({ code: -1, msg: error.errMsg || '上传失败', data: null as any })
      }
    })
  })
}
