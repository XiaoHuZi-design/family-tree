<template>
  <view class="add-member-page">
    <view class="form-section">
      <view class="form-card">
        <view class="form-item">
          <text class="form-label">姓名</text>
          <input class="form-input" v-model="form.name" placeholder="请输入姓名" maxlength="20" />
        </view>
        <view class="form-item">
          <text class="form-label">辈分</text>
          <picker :range="generationOptions" @change="onGenerationChange">
            <text class="form-picker">{{ generationOptions[form.generation - 1] || '请选择' }}</text>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">关系称谓</text>
          <picker :range="relationOptions" @change="onRelationChange">
            <text :class="form.relation ? 'form-picker' : 'form-picker placeholder'">
              {{ form.relation || '请选择关系' }}
            </text>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">性别</text>
          <picker :range="genderOptions" @change="onGenderChange">
            <text class="form-picker">{{ genderOptions[form.gender] }}</text>
          </picker>
        </view>
        <view class="form-item">
          <text class="form-label">上级成员</text>
          <picker :range="parentOptions" @change="onParentChange">
            <text :class="selectedParentName ? 'form-picker' : 'form-picker placeholder'">
              {{ selectedParentName || '请选择（选填）' }}
            </text>
          </picker>
        </view>
      </view>

      <view class="form-card">
        <view class="card-title">
          <text class="card-title-text">联系方式（选填）</text>
        </view>
        <view class="form-item">
          <text class="form-label">手机号</text>
          <input class="form-input" v-model="form.phone" placeholder="请输入手机号" type="number" maxlength="11" />
        </view>
        <view class="form-item">
          <text class="form-label">微信号</text>
          <input class="form-input" v-model="form.wechat" placeholder="请输入微信号" maxlength="30" />
        </view>
        <view class="form-item">
          <text class="form-label">家庭住址</text>
          <input class="form-input" v-model="form.homeAddress" placeholder="请输入家庭住址" />
        </view>
        <view class="form-item">
          <text class="form-label">坟位地址</text>
          <input class="form-input" v-model="form.graveAddress" placeholder="请输入坟位地址" />
        </view>
      </view>

      <view class="form-card">
        <view class="card-title">
          <text class="card-title-text">备注</text>
        </view>
        <textarea
          class="remark-input"
          v-model="form.remark"
          placeholder="添加备注信息..."
          :maxlength="200"
          auto-height
        ></textarea>
      </view>
    </view>

    <view class="bottom-action">
      <view class="submit-btn" :class="{ active: canSubmit }" @tap="handleSubmit">
        <text class="submit-text">{{ submitting ? '保存中...' : (isEdit ? '保存修改' : '添加成员') }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useFamilyStore } from '@/stores/familyStore'
import familyApi from '@/api/family'

const store = useFamilyStore()
const isEdit = ref(false)
const editId = ref('')

// 现有成员列表（用于选择上级）
interface SimpleMember { id: string; name: string }
const existingMembers = ref<SimpleMember[]>([])
const selectedParentName = ref('')

const parentOptions = computed(() => ['(无)'].concat(existingMembers.value.map(m => m.name)))

const form = ref({
  name: '',
  generation: 2,
  relation: '',
  gender: 0,
  parentId: '',
  phone: '',
  wechat: '',
  homeAddress: '',
  graveAddress: '',
  remark: ''
})

const submitting = ref(false)

const generationOptions = ['第一代', '第二代', '第三代', '第四代']
const genderOptions = ['未知', '男', '女']
const relationOptions = [
  '祖父', '祖母', '外公', '外婆',
  '父亲', '母亲', '叔叔', '婶婶', '伯伯', '伯母', '姑姑', '姑父', '舅舅', '舅妈', '阿姨', '姨父',
  '自己', '配偶', '哥哥', '嫂子', '弟弟', '弟媳', '姐姐', '姐夫', '妹妹', '妹夫',
  '堂哥', '堂嫂', '堂弟', '堂弟媳', '堂姐', '堂姐夫', '堂妹', '堂妹夫',
  '表哥', '表嫂', '表弟', '表弟媳', '表姐', '表姐夫', '表妹', '表妹夫',
  '儿子', '儿媳', '女儿', '女婿',
  '侄子', '侄媳', '侄女', '侄女婿',
  '孙子', '孙女', '外孙', '外孙女'
]

const canSubmit = computed(() => form.value.name.trim().length > 0 && !submitting.value)

const onGenerationChange = (e: any) => {
  form.value.generation = e.detail.value + 1
}

const onGenderChange = (e: any) => {
  form.value.gender = parseInt(e.detail.value)
}

const onRelationChange = (e: any) => {
  form.value.relation = relationOptions[e.detail.value]
}

const onParentChange = (e: any) => {
  const idx = e.detail.value
  if (idx === 0) {
    form.value.parentId = ''
    selectedParentName.value = ''
  } else {
    const member = existingMembers.value[idx - 1]
    form.value.parentId = member.id
    selectedParentName.value = member.name
  }
}

// 从家族树中提取所有成员作为可选项
const flattenTree = (nodes: any[]): SimpleMember[] => {
  const result: SimpleMember[] = []
  for (const node of nodes) {
    result.push({ id: node._id || '', name: node.name || '' })
    if (node.children?.length) result.push(...flattenTree(node.children))
  }
  return result
}

onMounted(() => {
  existingMembers.value = flattenTree(store.familyTree as any || [])
})

onLoad(async (options: any) => {
  if (options?.editId) {
    isEdit.value = true
    editId.value = options.editId
    uni.setNavigationBarTitle({ title: '编辑成员' })
    // 加载现有数据
    try {
      const data = await familyApi.getMemberDetail(options.editId)
      if (data) {
        form.value.name = data.name || ''
        form.value.generation = data.generation || 1
        form.value.relation = data.relation || ''
        form.value.gender = data.gender || 0
        form.value.phone = data.phone || ''
        form.value.wechat = data.wechat || ''
        form.value.homeAddress = data.homeAddress || ''
        form.value.graveAddress = data.graveAddress || ''
        form.value.remark = data.remark || ''
      }
    } catch (e) {
      console.error('加载成员信息失败', e)
    }
  }
})

const handleSubmit = async () => {
  if (!canSubmit.value) return

  submitting.value = true
  uni.showLoading({ title: isEdit.value ? '保存中...' : '添加中...', mask: true })

  try {
    const familyId = uni.getStorageSync('currentFamilyId')
    const memberData = {
      ...form.value,
      familyId: familyId || undefined
    }

    if (isEdit.value && editId.value) {
      await store.updateMember(editId.value, memberData)
      uni.hideLoading()
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      await store.addMember(memberData)
      uni.hideLoading()
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    setTimeout(() => { uni.navigateBack() }, 1500)
  } catch (error: any) {
    uni.hideLoading()
    uni.showToast({
      title: error?.message || error?.errMsg || '操作失败，请重试',
      icon: 'none',
      duration: 2000
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.add-member-page {
  min-height: 100vh;
  background: #F8F6F2;
  padding-bottom: 180rpx;
}

.form-section {
  padding: 24rpx;
}

.form-card {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}

.card-title {
  margin-bottom: 20rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #F0EDE8;

  .card-title-text { font-size: 30rpx; font-weight: 600; color: #2C2C2C; }
}

.form-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F5F2EE;

  &:last-child { border-bottom: none; }

  .form-label {
    width: 160rpx;
    font-size: 28rpx;
    color: #999;
    flex-shrink: 0;
  }

  .form-input {
    flex: 1;
    font-size: 28rpx;
    color: #2C2C2C;
  }

  .form-picker {
    flex: 1;
    font-size: 28rpx;
    color: #2C2C2C;
    text-align: right;

    &.placeholder {
      color: #C0C0C0;
    }
  }
}

.remark-input {
  width: 100%;
  min-height: 160rpx;
  font-size: 28rpx;
  color: #2C2C2C;
  line-height: 1.7;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  border-top: 1rpx solid #EAE6E0;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  background: #F0EDE8;
  display: flex;
  align-items: center;
  justify-content: center;

  &.active {
    background: #2D8B4E;
    box-shadow: 0 8rpx 24rpx rgba(45, 139, 78, 0.3);
    .submit-text { color: #FFFFFF; }
  }
}

.submit-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #999;
}
</style>
