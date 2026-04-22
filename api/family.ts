/**
 * 家族相关 API
 * 统一调用 uniCloud 云对象 co-family
 */

interface FamilyMember {
  _id?: string
  name: string
  avatar?: string
  generation: number
  relation?: string
  phone?: string
  wechat?: string
  homeAddress?: string
  graveAddress?: string
  graveLocation?: { latitude: number; longitude: number }
  remark?: string
  parentId?: string
  children?: FamilyMember[]
  gender?: number
}

interface ApiResponse<T = any> {
  code: number
  msg: string
  data?: T
}

function getCloudObject() {
  return uniCloud.importObject('co-family')
}

function getFamilyId(): string {
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo?.familyId) return userInfo.familyId
  const familyIds = userInfo?.familyIds
  if (Array.isArray(familyIds) && familyIds.length > 0) return familyIds[0]
  return uni.getStorageSync('currentFamilyId') || ''
}

function handleResult(result: ApiResponse<any>) {
  if (result && result.code === 0) return result.data
  throw new Error(result?.msg || '请求失败')
}

function normalizeMember(m: any): FamilyMember {
  return {
    _id: m._id || m.id || '',
    name: m.name || '',
    avatar: m.avatar || '',
    generation: m.generation || 1,
    relation: m.relation || '',
    phone: m.phone || '',
    wechat: m.wechat || '',
    homeAddress: m.homeAddress || '',
    graveAddress: m.graveAddress || '',
    graveLocation: m.graveLocation || undefined,
    remark: m.remark || '',
    gender: m.gender || 0,
    parentId: m.parentId || ''
  }
}

function normalizeTree(nodes: any[]): FamilyMember[] {
  return (nodes || []).map(node => ({
    ...normalizeMember(node),
    children: node.children?.length ? normalizeTree(node.children) : undefined
  }))
}

async function getFamilyTree(): Promise<FamilyMember[]> {
  try {
    const familyId = getFamilyId()
    if (!familyId) return []
    const result = await getCloudObject().getFamilyTree(familyId)
    const data = handleResult(result)
    return normalizeTree(data?.tree || [])
  } catch (error: any) {
    console.error('getFamilyTree error:', error)
    return []
  }
}

async function getMemberDetail(memberId: string): Promise<FamilyMember | null> {
  try {
    const result = await getCloudObject().getMemberDetail(memberId)
    const data = handleResult(result)
    return data ? normalizeMember(data) : null
  } catch (error: any) {
    console.error('getMemberDetail error:', error)
    return null
  }
}

async function addMember(memberData: Partial<FamilyMember>): Promise<any> {
  const familyId = memberData.familyId || getFamilyId()
  const result = await getCloudObject().addMember({
    familyId,
    name: memberData.name,
    generation: memberData.generation,
    relation: memberData.relation || '',
    gender: memberData.gender || 0,
    avatar: memberData.avatar || '',
    parentId: memberData.parentId || '',
    contact: {
      phone: memberData.phone || '',
      wechat: memberData.wechat || '',
      homeAddress: memberData.homeAddress || '',
      graveAddress: memberData.graveAddress || ''
    }
  })
  return handleResult(result)
}

async function updateMember(memberId: string, memberData: Partial<FamilyMember>): Promise<any> {
  const result = await getCloudObject().updateMember(memberId, memberData)
  return handleResult(result)
}

async function searchMembers(keyword: string): Promise<FamilyMember[]> {
  try {
    const familyId = getFamilyId()
    if (!familyId || !keyword) return []
    const result = await getCloudObject().searchMembers(familyId, keyword)
    const data = handleResult(result)
    return (data?.list || []).map(normalizeMember)
  } catch (error: any) {
    console.error('searchMembers error:', error)
    return []
  }
}

async function getContactsByGeneration(generation?: number): Promise<FamilyMember[]> {
  try {
    const familyId = getFamilyId()
    if (!familyId) return []
    // 使用新的 getContactList 方法获取完整联系信息
    const result = await getCloudObject().getContactList(familyId)
    const data = handleResult(result)
    return (data?.list || []).map(normalizeMember)
  } catch (error: any) {
    console.error('getContactsByGeneration error:', error)
    return []
  }
}

async function deleteMember(memberId: string): Promise<boolean> {
  try {
    const result = await getCloudObject().deleteMember(memberId)
    handleResult(result)
    return true
  } catch (error: any) {
    console.error('deleteMember error:', error)
    return false
  }
}

async function getFamilyStats(): Promise<{
  totalMembers: number
  generationCounts: Record<number, number>
}> {
  try {
    const tree = await getFamilyTree()
    const generationCounts: Record<number, number> = {}
    let total = 0

    const countMembers = (nodes: FamilyMember[]) => {
      for (const node of nodes) {
        const gen = node.generation || 1
        generationCounts[gen] = (generationCounts[gen] || 0) + 1
        total++
        if (node.children?.length) countMembers(node.children)
      }
    }
    countMembers(tree)

    return { totalMembers: total, generationCounts }
  } catch (error: any) {
    console.error('getFamilyStats error:', error)
    return { totalMembers: 0, generationCounts: {} }
  }
}

export const familyApi = {
  getFamilyTree,
  getMemberDetail,
  addMember,
  updateMember,
  searchMembers,
  getContactsByGeneration,
  deleteMember,
  getFamilyStats
}

export default familyApi
