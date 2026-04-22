<template>
  <view class="member-card" @tap="handleClick">
    <image
      class="member-avatar"
      :src="member.avatar || '/static/default-avatar.png'"
      mode="aspectFill"
    />
    <view class="member-info">
      <text class="member-name">{{ member.name }}</text>
      <view class="member-tags">
        <text v-if="member.generation" class="tag generation-tag">
          {{ generationText }}
        </text>
        <text v-if="member.relation" class="tag relation-tag">
          {{ member.relation }}
        </text>
      </view>
    </view>
    <text v-if="showPhone && member.phone" class="member-phone">
      {{ maskedPhone }}
    </text>
    <text class="arrow-icon">›</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Member {
  _id: string
  name: string
  avatar?: string
  generation?: number
  relation?: string
  phone?: string
}

interface Props {
  member: Member
  showPhone?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPhone: false
})

const emit = defineEmits<{
  click: [member: Member]
}>()

const generationText = computed(() => {
  if (!props.member.generation) return ''
  const generations = ['', '第一代', '第二代', '第三代', '第四代']
  return generations[props.member.generation] || `${props.member.generation}代`
})

const maskedPhone = computed(() => {
  if (!props.member.phone) return ''
  return props.member.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
})

const handleClick = () => {
  emit('click', props.member)
}
</script>

<style scoped lang="scss">
.member-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  transition: all 0.2s ease;

  &:active {
    background-color: #f9f9f9;
    transform: scale(0.98);
  }

  .member-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background-color: #f0f0f0;
    border: 3rpx solid #2D8B4E;
    flex-shrink: 0;
  }

  .member-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    min-width: 0;

    .member-name {
      font-size: 32rpx;
      font-weight: 500;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .member-tags {
      display: flex;
      gap: 12rpx;
      flex-wrap: wrap;

      .tag {
        padding: 6rpx 16rpx;
        border-radius: 16rpx;
        font-size: 22rpx;

        &.generation-tag {
          background-color: #2D8B4E;
          color: #fff;
        }

        &.relation-tag {
          background-color: #f0f0f0;
          color: #666;
        }
      }
    }
  }

  .member-phone {
    font-size: 24rpx;
    color: #999;
    flex-shrink: 0;
  }

  .arrow-icon {
    font-size: 32rpx;
    color: #ccc;
    flex-shrink: 0;
  }
}

@media (max-width: 750rpx) {
  .member-card {
    padding: 24rpx;

    .member-avatar {
      width: 80rpx;
      height: 80rpx;
    }

    .member-info {
      .member-name {
        font-size: 28rpx;
      }

      .member-tags {
        .tag {
          font-size: 20rpx;
          padding: 4rpx 12rpx;
        }
      }
    }
  }
}
</style>
