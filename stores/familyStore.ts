/**
 * 家族状态管理 Store
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import familyApi from '@/api/family'

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
  graveLocation?: {
    latitude: number
    longitude: number
  }
  remark?: string
  parentId?: string
  children?: FamilyMember[]
}

interface TreeNode extends FamilyMember {}

export const useFamilyStore = defineStore('family', () => {
  const familyTree = ref<TreeNode[]>([])
  const currentMember = ref<FamilyMember | null>(null)
  const memberList = ref<FamilyMember[]>([])
  const searchQuery = ref<string>('')
  const loading = ref<boolean>(false)

  /**
   * 获取家族树数据
   */
  const fetchFamilyTree = async (): Promise<void> => {
    loading.value = true
    try {
      const data = await familyApi.getFamilyTree()
      familyTree.value = data || []
    } catch (error) {
      console.error('Store: 获取家族树失败', error)
      familyTree.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取成员详情
   */
  const fetchMemberDetail = async (memberId: string): Promise<void> => {
    loading.value = true
    try {
      const data = await familyApi.getMemberDetail(memberId)
      currentMember.value = data
    } catch (error) {
      console.error('Store: 获取成员详情失败', error)
      currentMember.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加家族成员
   */
  const addMember = async (memberData: Partial<FamilyMember>): Promise<FamilyMember> => {
    loading.value = true
    try {
      const data = await familyApi.addMember(memberData)
      await fetchFamilyTree()
      return data
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新家族成员
   */
  const updateMember = async (
    memberId: string,
    memberData: Partial<FamilyMember>
  ): Promise<FamilyMember> => {
    loading.value = true
    try {
      const data = await familyApi.updateMember(memberId, memberData)
      if (currentMember.value?._id === memberId) {
        await fetchMemberDetail(memberId)
      }
      await fetchFamilyTree()
      return data
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索家族成员
   */
  const searchMembers = async (keyword: string): Promise<FamilyMember[]> => {
    loading.value = true
    searchQuery.value = keyword
    try {
      const data = await familyApi.searchMembers(keyword)
      memberList.value = data
      return data
    } finally {
      loading.value = false
    }
  }

  /**
   * 按辈分获取通讯录
   */
  const fetchContactsByGeneration = async (generation?: number): Promise<void> => {
    loading.value = true
    try {
      const data = await familyApi.getContactsByGeneration(generation)
      memberList.value = data || []
    } catch (error) {
      console.error('Store: 获取通讯录失败', error)
      memberList.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除家族成员
   */
  const deleteMember = async (memberId: string): Promise<boolean> => {
    loading.value = true
    try {
      const result = await familyApi.deleteMember(memberId)
      if (result) {
        await fetchFamilyTree()
        if (currentMember.value?._id === memberId) {
          currentMember.value = null
        }
      }
      return result
    } finally {
      loading.value = false
    }
  }

  /**
   * 清空当前成员
   */
  const clearCurrentMember = (): void => {
    currentMember.value = null
  }

  /**
   * 清空搜索
   */
  const clearSearch = (): void => {
    searchQuery.value = ''
    memberList.value = []
  }

  /**
   * 重置状态
   */
  const resetState = (): void => {
    familyTree.value = []
    currentMember.value = null
    memberList.value = []
    searchQuery.value = ''
    loading.value = false
  }

  return {
    familyTree,
    currentMember,
    memberList,
    searchQuery,
    loading,
    fetchFamilyTree,
    fetchMemberDetail,
    addMember,
    updateMember,
    searchMembers,
    fetchContactsByGeneration,
    deleteMember,
    clearCurrentMember,
    clearSearch,
    resetState
  }
})

export default useFamilyStore
