<template>
  <view class="family-tree-canvas">
    <scroll-view class="tree-scroll" scroll-x scroll-y>
      <view class="tree-container">
        <view
          v-for="(generation, genIndex) in generations"
          :key="genIndex"
          class="generation-row"
          :data-generation="genIndex + 1"
        >
          <view class="generation-label">
            <text>{{ generationLabels[genIndex] }}</text>
          </view>
          <view class="nodes-container">
            <view
              v-for="(node, nodeIndex) in generation"
              :key="node._id || nodeIndex"
              class="tree-node"
              :class="{ 'has-children': node.children && node.children.length > 0 }"
              :style="getNodeStyle(node, nodeIndex, generation.length)"
              @tap="handleNodeClick(node)"
            >
              <image
                class="node-avatar"
                :src="node.avatar || '/static/default-avatar.png'"
                mode="aspectFill"
              />
              <text class="node-name">{{ node.name }}</text>
              <text class="node-relation">{{ node.relation || '成员' }}</text>

              <!-- 子节点连接线 -->
              <view v-if="node.children && node.children.length > 0" class="children-line">
                <view
                  v-for="(child, childIndex) in node.children"
                  :key="child._id || childIndex"
                  class="child-connector"
                  :style="getConnectorStyle(nodeIndex, childIndex, node.children.length)"
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 代际连接线 -->
        <view
          v-for="(genLines, genIndex) in connectorLines"
          :key="`connector-${genIndex}`"
          class="generation-connector"
        >
          <view
            v-for="line in genLines"
            :key="line.id"
            class="connector-line"
            :style="line.style"
          />
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface TreeNode {
  _id: string
  name: string
  avatar?: string
  relation?: string
  generation?: number
  children?: TreeNode[]
}

interface Props {
  treeData: TreeNode[]
  onNodeClick?: (node: TreeNode) => void
}

const props = withDefaults(defineProps<Props>(), {
  treeData: () => [],
  onNodeClick: () => {}
})

const generationLabels = ['第一代', '第二代', '第三代', '第四代']

const generations = computed(() => {
  const result: TreeNode[][] = [[], [], [], []]

  if (!props.treeData || !Array.isArray(props.treeData)) {
    return result
  }

  const traverse = (nodes: TreeNode[], currentGen: number) => {
    if (currentGen > 4 || !nodes || !Array.isArray(nodes)) return

    nodes.forEach(node => {
      if (!node) return
      const genIndex = Math.min(currentGen - 1, 3)
      result[genIndex].push(node)

      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        traverse(node.children, currentGen + 1)
      }
    })
  }

  traverse(props.treeData, 1)
  return result
})

const connectorLines = computed(() => {
  const lines: any[][] = [[], [], []]

  if (!props.treeData || !Array.isArray(props.treeData)) {
    return lines
  }

  generations.value.forEach((gen, genIndex) => {
    if (!gen || !Array.isArray(gen)) return
    if (genIndex === generations.value.length - 1) return

    gen.forEach((parent, parentIndex) => {
      if (!parent || (!parent.children || parent.children.length === 0)) return

      const parentCenterX = (parentIndex + 0.5) * 200 + 100
      const childGen = generations.value[genIndex + 1]

      if (Array.isArray(parent.children)) {
        parent.children.forEach((child, childIndex) => {
          if (!child || !child._id) return
          const childCenterX = (childIndex + 0.5) * 200 + 100

          lines[genIndex].push({
            id: `${parent._id || 'unknown'}-${child._id}`,
            style: {
              left: `${Math.min(parentCenterX, childCenterX)}px`,
              top: `${genIndex * 250 + 200}px`,
              width: `${Math.abs(childCenterX - parentCenterX)}px`,
              height: '50px'
            }
          })
        })
      }
    })
  })

  return lines
})

const getNodeStyle = (node: TreeNode, index: number, total: number) => {
  const baseWidth = 200
  return {
    left: `${index * baseWidth}px`,
    width: `${baseWidth - 20}px`
  }
}

const getConnectorStyle = (parentIndex: number, childIndex: number, totalChildren: number) => {
  const baseWidth = 200
  const childCenterX = (childIndex + 0.5) * baseWidth

  return {
    left: `${childCenterX}px`,
    width: totalChildren > 1 ? `${baseWidth / totalChildren}px` : '2px'
  }
}

const handleNodeClick = (node: TreeNode) => {
  if (props.onNodeClick) {
    props.onNodeClick(node)
  }
}

watch(() => props.treeData, () => {
  // 数据变化时可以添加动画效果
}, { deep: true })
</script>

<style scoped lang="scss">
.family-tree-canvas {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.tree-scroll {
  width: 100%;
  height: 100%;
}

.tree-container {
  position: relative;
  min-width: 100%;
  padding: 40rpx;
  min-height: 1200rpx;
}

.generation-row {
  display: flex;
  position: relative;
  margin-bottom: 60rpx;
  min-height: 200rpx;

  .generation-label {
    position: absolute;
    left: -80rpx;
    top: 50%;
    transform: translateY(-50%);
    background-color: #2D8B4E;
    color: #fff;
    padding: 16rpx 24rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
    white-space: nowrap;
    font-weight: bold;
  }

  .nodes-container {
    display: flex;
    position: relative;
    flex: 1;
  }
}

.tree-node {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.12);
  }

  &.has-children {
    &::after {
      content: '';
      position: absolute;
      bottom: -30rpx;
      left: 50%;
      transform: translateX(-50%);
      width: 2rpx;
      height: 30rpx;
      background-color: #2D8B4E;
    }
  }

  .node-avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50%;
    background-color: #f0f0f0;
    border: 4rpx solid #2D8B4E;
  }

  .node-name {
    font-size: 28rpx;
    font-weight: 500;
    color: #333;
    text-align: center;
  }

  .node-relation {
    font-size: 22rpx;
    color: #999;
    background-color: #f5f5f5;
    padding: 4rpx 12rpx;
    border-radius: 12rpx;
  }

  .children-line {
    position: absolute;
    bottom: -50rpx;
    left: 0;
    right: 0;
    height: 20rpx;

    .child-connector {
      position: absolute;
      height: 2rpx;
      background-color: #2D8B4E;
    }
  }
}

.generation-connector {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;

  .connector-line {
    position: absolute;
    border-left: 2rpx dashed #2D8B4E;
    border-top: 2rpx solid #2D8B4E;
    border-top-left-radius: 10rpx;
  }
}

@media (max-width: 750rpx) {
  .generation-row {
    .generation-label {
      left: -60rpx;
      font-size: 20rpx;
      padding: 12rpx 16rpx;
    }
  }

  .tree-node {
    .node-avatar {
      width: 80rpx;
      height: 80rpx;
    }

    .node-name {
      font-size: 24rpx;
    }

    .node-relation {
      font-size: 20rpx;
    }
  }
}
</style>
