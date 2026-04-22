<template>
  <view class="family-tree-page">
    <!-- Loading State -->
    <view v-if="storeLoading && !generationGroups.length" class="loading-wrapper">
      <view class="loading-spinner" />
      <text class="loading-text">加载家族数据...</text>
    </view>

    <!-- Empty State -->
    <view v-else-if="!storeLoading && !generationGroups.length && !searchResults.length" class="empty-wrapper">
      <text class="empty-icon">🏠</text>
      <text class="empty-title">暂无家族数据</text>
      <view v-if="!hasFamily" class="create-family-btn" @tap="handleCreateFamily">
        <text class="create-family-text">创建家族</text>
      </view>
      <text v-else class="empty-desc">点击下方按钮添加第一位家族成员</text>
    </view>

    <!-- Main Content -->
    <view v-else class="page-content">
      <!-- Green Gradient Header -->
      <view class="header-card">
        <view class="header-row">
          <text class="header-title">{{ familyName }}</text>
          <view class="header-add-btn" @tap="goAddMember">
            <text class="header-add-text">+ 添加</text>
          </view>
        </view>
        <text class="header-subtitle">{{ totalMembers }}位成员 · {{ generationCount }}代传承</text>
      </view>

      <!-- Search Bar -->
      <view class="search-bar">
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            placeholder="搜索家族成员"
            placeholder-class="search-placeholder"
            :value="keyword"
            @input="onSearchInput"
            @confirm="onSearchConfirm"
            confirm-type="search"
          />
          <text v-if="keyword" class="search-clear" @tap="clearSearch">✕</text>
        </view>
      </view>

      <!-- Search Results -->
      <view v-if="searchResults.length" class="generation-section">
        <view class="section-header">
          <text class="section-title">搜索结果</text>
          <text class="section-count">{{ searchResults.length }}人</text>
        </view>
        <view class="member-grid">
          <view
            v-for="member in searchResults"
            :key="member._id"
            class="member-card"
            @tap="goDetail(member._id)"
          >
            <view class="card-avatar" :style="{ background: getGradient(member.generation) }">
              <text class="avatar-emoji">{{ getEmoji(member.relation) }}</text>
            </view>
            <text class="card-name">{{ member.name }}</text>
            <text class="card-relation">{{ member.relation }}</text>
          </view>
        </view>
      </view>

      <!-- Generation Groups (shown when not searching) -->
      <template v-if="!searchResults.length">
        <view
          v-for="group in generationGroups"
          :key="group.generation"
          class="generation-section"
        >
          <view class="section-header">
            <text class="section-title">{{ group.label }}</text>
            <text class="section-count">{{ group.members.length }}人</text>
          </view>
          <view class="member-grid">
            <view
              v-for="member in group.members"
              :key="member._id"
              class="member-card"
              @tap="goDetail(member._id)"
            >
              <view class="card-avatar" :style="{ background: getGradient(group.generation) }">
                <text class="avatar-emoji">{{ getEmoji(member.relation) }}</text>
              </view>
              <text class="card-name">{{ member.name }}</text>
              <text class="card-relation">{{ member.relation }}</text>
            </view>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFamilyStore } from '@/stores/familyStore'

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

interface GenerationGroup {
  generation: number
  label: string
  members: FamilyMember[]
}

const familyStore = useFamilyStore()

const keyword = ref('')
const searchResults = ref<FamilyMember[]>([])
const hasFamily = ref(false)
const familyName = ref('我的家族')

const storeLoading = computed(() => familyStore.loading)

const generationLabels: Record<number, string> = {
  1: '第一代 · 祖辈',
  2: '第二代 · 父辈',
  3: '第三代 · 吾辈',
  4: '第四代 · 子辈'
}

const generationGroups = computed<GenerationGroup[]>(() => {
  const tree = familyStore.familyTree
  if (!tree || !tree.length) return []

  const grouped: Record<number, FamilyMember[]> = {}
  const collectMembers = (nodes: FamilyMember[]) => {
    for (const node of nodes) {
      const gen = node.generation || 1
      if (!grouped[gen]) grouped[gen] = []
      grouped[gen].push(node)
      if (node.children && node.children.length) {
        collectMembers(node.children)
      }
    }
  }
  collectMembers(tree)

  const generations = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b)

  return generations.map((gen) => ({
    generation: gen,
    label: generationLabels[gen] || `第${gen}代`,
    members: grouped[gen]
  }))
})

const totalMembers = computed(() => {
  return generationGroups.value.reduce((sum, g) => sum + g.members.length, 0)
})

const generationCount = computed(() => {
  return generationGroups.value.length
})

const generationGradients: Record<number, string> = {
  1: 'linear-gradient(135deg, #667eea, #764ba2)',
  2: 'linear-gradient(135deg, #4facfe, #00f2fe)',
  3: 'linear-gradient(135deg, #2D8B4E, #4CAF50)',
  4: 'linear-gradient(135deg, #43e97b, #38f9d7)'
}

const getGradient = (generation: number): string => {
  return generationGradients[generation] || 'linear-gradient(135deg, #667eea, #764ba2)'
}

const maleOld = ['爷爷', '外公', '伯父', '舅舅']
const maleMiddle = ['父亲', '叔叔', '伯伯', '舅舅', '姑父', '姨父']
const maleYoung = ['儿子', '侄子', '堂弟', '堂哥', '表弟', '表哥', '弟弟', '哥哥']
const femaleOld = ['奶奶', '外婆', '伯母', '舅妈']
const femaleMiddle = ['母亲', '婶婶', '姑姑', '阿姨', '舅妈', '伯母']
const femaleYoung = ['女儿', '侄女', '堂妹', '堂姐', '表妹', '表姐', '妹妹', '姐姐']

const getEmoji = (relation?: string): string => {
  if (!relation) return '🧑'
  if (maleOld.includes(relation)) return '👴'
  if (maleMiddle.includes(relation)) return '👨'
  if (maleYoung.includes(relation)) return '👦'
  if (femaleOld.includes(relation)) return '👵'
  if (femaleMiddle.includes(relation)) return '👩'
  if (femaleYoung.includes(relation)) return '👧'
  return '🧑'
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

const onSearchInput = (e: any) => {
  keyword.value = e.detail?.value ?? e.target?.value ?? ''
  if (searchTimer) clearTimeout(searchTimer)
  if (!keyword.value.trim()) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(() => {
    doSearch(keyword.value.trim())
  }, 400)
}

const onSearchConfirm = () => {
  if (searchTimer) clearTimeout(searchTimer)
  const q = keyword.value.trim()
  if (q) {
    doSearch(q)
  }
}

const doSearch = async (q: string) => {
  try {
    const results = await familyStore.searchMembers(q)
    searchResults.value = results || []
  } catch (e) {
    searchResults.value = []
  }
}

const clearSearch = () => {
  keyword.value = ''
  searchResults.value = []
  familyStore.clearSearch()
}

const goDetail = (id?: string) => {
  if (!id) return
  uni.navigateTo({ url: `/pages/member/member-detail?id=${id}` })
}

const goAddMember = () => {
  uni.navigateTo({ url: '/pages/member/add-member' })
}

const handleCreateFamily = async () => {
  // 弹出输入框让用户自定义家族名
  const nameRes: any = await new Promise((resolve) => {
    uni.showModal({
      title: '创建家族',
      editable: true,
      placeholderText: '请输入家族名称，如：胡氏家族',
      content: '',
      success: resolve
    })
  })
  if (!nameRes.confirm || !nameRes.content?.trim()) return

  const inputName = nameRes.content.trim()
  uni.showLoading({ title: '创建中...', mask: true })
  try {
    const coFamily = uniCloud.importObject('co-family')
    const res = await coFamily.createFamily({ familyName: inputName })
    if (res && res.code === 0 && res.data) {
	      console.log('创建家族成功:', res)
      const familyId = res.data.familyId
      uni.setStorageSync('currentFamilyId', familyId)

      // 更新 userInfo 中的 familyIds
      const userInfo = uni.getStorageSync('userInfo') || {}
      userInfo.familyIds = [familyId]
      userInfo.familyId = familyId
      userInfo.familyName = inputName
      uni.setStorageSync('userInfo', userInfo)

      familyName.value = inputName
      hasFamily.value = true
      uni.hideLoading()
      uni.showToast({ title: '创建成功', icon: 'success' })

      // 刷新页面数据
      await familyStore.fetchFamilyTree()
    } else {
      console.error('创建家族失败:', JSON.stringify(res))
      uni.hideLoading()
      uni.showToast({ title: res?.msg || res?.message || '创建失败', icon: 'none' })
    }
  } catch (error: any) {
    console.error('创建家族异常:', error)
    uni.hideLoading()
    uni.showToast({ title: error.message || '创建失败', icon: 'none' })
  }
}

const checkFamily = () => {
  const userInfo = uni.getStorageSync('userInfo')
  const familyIds = userInfo?.familyIds
  hasFamily.value = Array.isArray(familyIds) && familyIds.length > 0
}

onMounted(async () => {
  checkFamily()
  // 从 userInfo 读取家族名（如有）
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo?.familyName) {
    familyName.value = userInfo.familyName
  }
  await familyStore.fetchFamilyTree()
})
</script>

<style lang="scss" scoped>
.family-tree-page {
  min-height: 100vh;
  background: #F8F6F2;
}

// Loading
.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;

  .loading-spinner {
    width: 64rpx;
    height: 64rpx;
    border: 6rpx solid #E0DDD8;
    border-top-color: #2D8B4E;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .loading-text {
    margin-top: 24rpx;
    font-size: 28rpx;
    color: #999;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Empty
.empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;

  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 24rpx;
  }

  .empty-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #2C2C2C;
    margin-bottom: 12rpx;
  }

  .empty-desc {
    font-size: 26rpx;
    color: #999;
  }

  .create-family-btn {
    margin-top: 32rpx;
    padding: 24rpx 80rpx;
    background: #2D8B4E;
    border-radius: 48rpx;
    box-shadow: 0 8rpx 24rpx rgba(45, 139, 78, 0.3);

    &:active { opacity: 0.8; }

    .create-family-text {
      font-size: 32rpx;
      font-weight: 600;
      color: #FFFFFF;
    }
  }
}

// Page Content
.page-content {
  padding: 40rpx;
}

// Header
.header-card {
  background: linear-gradient(135deg, #2D8B4E, #4CAF50);
  padding: 40rpx;
  border-radius: 24rpx;
  margin-bottom: 30rpx;

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-title {
    font-size: 44rpx;
    font-weight: bold;
    color: #FFFFFF;
  }

  .header-add-btn {
    padding: 12rpx 28rpx;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 32rpx;

    &:active { opacity: 0.7; }

    .header-add-text {
      font-size: 26rpx;
      color: #FFFFFF;
      font-weight: 600;
    }
  }

  .header-subtitle {
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 12rpx;
    display: block;
  }
}

// Search Bar
.search-bar {
  margin-bottom: 24rpx;

  .search-box {
    display: flex;
    align-items: center;
    height: 72rpx;
    background: #FFFFFF;
    border-radius: 36rpx;
    padding: 0 24rpx;
    gap: 12rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

    .search-icon {
      font-size: 28rpx;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #2C2C2C;
      height: 72rpx;
    }

    .search-clear {
      font-size: 28rpx;
      color: #999;
      padding: 8rpx;
      flex-shrink: 0;
    }
  }
}

.search-placeholder {
  color: #999;
}

// Generation Section
.generation-section {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #2C2C2C;
    }

    .section-count {
      font-size: 24rpx;
      color: #999;
    }
  }
}

// Member Grid
.member-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.member-card {
  display: flex;
  align-items: center;
  width: 48%;
  background: #F8F6F2;
  padding: 16rpx;
  border-radius: 16rpx;

  &:active {
    opacity: 0.7;
  }

  .card-avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .avatar-emoji {
      font-size: 32rpx;
    }
  }

  .card-name {
    margin-left: 12rpx;
    font-size: 26rpx;
    font-weight: 600;
    color: #2C2C2C;
    display: block;
  }

  .card-relation {
    margin-left: 12rpx;
    font-size: 22rpx;
    color: #2D8B4E;
    display: block;
  }
}
</style>
