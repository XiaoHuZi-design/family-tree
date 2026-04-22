<template>
  <view class="contacts-page">
    <view class="search-bar">
      <view class="search-box">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          placeholder="搜索成员姓名"
          placeholder-class="placeholder"
          :value="keyword"
          @input="onSearchInput"
          @confirm="onSearchConfirm"
          confirm-type="search"
        />
        <text v-if="keyword" class="clear-icon" @tap="clearSearch">✕</text>
      </view>
    </view>

    <!-- Loading -->
    <view v-if="loading && !allMembers.length" class="state-container">
      <text class="state-emoji">⏳</text>
      <text class="state-text">加载中...</text>
    </view>

    <!-- Empty -->
    <view v-else-if="!loading && !allMembers.length" class="state-container">
      <text class="state-emoji">📭</text>
      <text class="state-text">暂无家族成员</text>
    </view>

    <!-- Alphabet Index + Contact Cards -->
    <view v-else class="contact-body">
      <scroll-view class="contact-scroll" scroll-y :scroll-into-view="scrollTarget" scroll-with-animation>
        <view v-for="group in alphaGroups" :key="group.letter" :id="'alpha-' + group.letter">
          <view class="alpha-header">
            <text class="alpha-letter">{{ group.letter }}</text>
          </view>
          <view v-for="m in group.members" :key="m._id" class="contact-card" @tap="goDetail(m)">
            <view class="card-top">
              <view class="c-avatar" :style="{background: getAvatarBg(m.generation)}">
                <text class="c-emoji">{{ getEmoji(m.gender) }}</text>
              </view>
              <view class="c-main">
                <view class="c-name-row">
                  <text class="c-name">{{ m.name }}</text>
                  <text v-if="m.relation" class="c-relation">{{ m.relation }}</text>
                </view>
                <view v-if="m.phone" class="c-detail-row">
                  <text class="c-icon">📱</text>
                  <text class="c-detail">{{ m.phone }}</text>
                </view>
                <view v-if="m.homeAddress" class="c-detail-row">
                  <text class="c-icon">🏠</text>
                  <text class="c-detail">{{ m.homeAddress }}</text>
                </view>
                <view v-if="m.graveAddress" class="c-detail-row">
                  <text class="c-icon">⛩️</text>
                  <text class="c-detail">{{ m.graveAddress }}</text>
                </view>
              </view>
            </view>
            <view v-if="m.phone || m.graveLocation" class="card-actions">
              <view v-if="m.phone" class="action-btn action-msg" @tap.stop="sendMessage(m)">
                <text class="action-icon">💬</text>
                <text class="action-label">发送消息</text>
              </view>
              <view v-if="m.graveLocation" class="action-btn action-loc" @tap.stop="openLocation(m)">
                <text class="action-icon">📍</text>
                <text class="action-label">查看位置</text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- Right side alphabet -->
      <view class="alpha-index">
        <text
          v-for="letter in alphaLetters"
          :key="letter"
          class="index-letter"
          :class="{ active: currentLetter === letter }"
          @tap="scrollToLetter(letter)"
        >{{ letter }}</text>
      </view>
    </view>

    <!-- FAB -->
    <view class="fab-btn" @tap="goAddMember">
      <text class="fab-text">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onShow } from 'vue'
import familyApi from '@/api/family'

interface ContactMember {
  _id: string
  name: string
  generation: number
  relation?: string
  phone?: string
  wechat?: string
  homeAddress?: string
  graveAddress?: string
  graveLocation?: { latitude: number; longitude: number }
  gender?: number
  pinyin: string
}

const loading = ref(false)
const keyword = ref('')
const allMembers = ref<ContactMember[]>([])
const currentLetter = ref('')
const scrollTarget = ref('')

// 简易拼音首字母映射
const pinyinMap: Record<string, string> = {
  'A':'阿','B':'八','C':'查','D':'大','E':'额','F':'发','G':'嘎',
  'H':'哈','J':'加','K':'卡','L':'拉','M':'妈','N':'那','O':'哦',
  'P':'怕','Q':'七','R':'然','S':'萨','T':'他','W':'瓦','X':'西',
  'Y':'亚','Z':'杂'
}

function getPinyinFirst(name: string): string {
  if (!name) return '#'
  const first = name.charAt(0)
  // 检查是否英文字母
  if (/[A-Z]/i.test(first)) return first.toUpperCase()
  // 简易中文拼音映射（常见姓氏）
  const surnameMap: Record<string, string> = {
    '赵':'Z','钱':'Q','孙':'S','李':'L','周':'Z','吴':'W','郑':'Z','王':'W',
    '冯':'F','陈':'C','褚':'C','卫':'W','蒋':'J','沈':'S','韩':'H','杨':'Y',
    '朱':'Z','秦':'Q','尤':'Y','许':'X','何':'H','吕':'L','施':'S','张':'Z',
    '孔':'K','曹':'C','严':'Y','华':'H','金':'J','魏':'W','陶':'T','姜':'J',
    '戚':'Q','谢':'X','邹':'Z','喻':'Y','柏':'B','水':'S','窦':'D','章':'Z',
    '云':'Y','苏':'S','潘':'P','葛':'G','奚':'X','范':'F','彭':'P','郎':'L',
    '鲁':'L','韦':'W','昌':'C','马':'M','苗':'M','凤':'F','花':'H','方':'F',
    '俞':'Y','任':'R','袁':'Y','柳':'L','酆':'F','鲍':'B','史':'S','唐':'T',
    '费':'F','廉':'L','岑':'C','薛':'X','雷':'L','贺':'H','倪':'N','汤':'T',
    '滕':'T','殷':'Y','罗':'L','毕':'B','郝':'H','邬':'W','安':'A','常':'C',
    '乐':'L','于':'Y','时':'S','傅':'F','皮':'P','卡':'K','齐':'Q','康':'K',
    '伍':'W','余':'Y','元':'Y','卜':'B','顾':'G','孟':'M','平':'P','黄':'H',
    '和':'H','穆':'M','萧':'X','尹':'Y','姚':'Y','邵':'S','湛':'Z','汪':'W',
    '祁':'Q','毛':'M','禹':'Y','狄':'D','米':'M','贝':'B','明':'M','臧':'Z',
    '计':'J','伏':'F','成':'C','戴':'D','谈':'T','宋':'S','茅':'M','庞':'P',
    '熊':'X','纪':'J','舒':'S','屈':'Q','项':'X','祝':'Z','董':'D','梁':'L',
    '杜':'D','阮':'R','蓝':'L','闵':'M','席':'X','季':'J','麻':'M','强':'Q',
    '贾':'J','路':'L','娄':'L','危':'W','江':'J','童':'T','颜':'Y','郭':'G',
    '梅':'M','盛':'S','林':'L','刁':'D','钟':'Z','徐':'X','丘':'Q','骆':'L',
    '高':'G','夏':'X','蔡':'C','田':'T','樊':'F','胡':'H','凌':'L','霍':'H',
    '虞':'Y','万':'W','支':'Z','柯':'K','昝':'Z','管':'G','卢':'L','莫':'M',
    '经':'J','房':'F','裘':'Q','缪':'M','干':'G','解':'X','应':'Y','宗':'Z',
    '丁':'D','宣':'X','贲':'B','邓':'D','郁':'Y','单':'S','杭':'H','洪':'H',
    '包':'B','诸':'Z','左':'Z','石':'S','崔':'C','吉':'J','钮':'N','龚':'G',
    '程':'C','嵇':'J','邢':'X','滑':'H','裴':'P','陆':'L','荣':'R','翁':'W',
    '荀':'X','羊':'Y','於':'Y','惠':'H','甄':'Z','曲':'Q','家':'J','封':'F',
    '芮':'R','羿':'Y','储':'C','靳':'J','汲':'J','邴':'B','糜':'M','松':'S',
    '井':'J','段':'D','富':'F','巫':'W','乌':'W','焦':'J','巴':'B','弓':'G',
    '牧':'M','隗':'W','山':'S','谷':'G','车':'C','侯':'H','宓':'M','蓬':'P',
    '全':'Q','郗':'X','班':'B','仰':'Y','秋':'Q','仲':'Z','伊':'Y','宫':'G',
    '宁':'N','仇':'Q','栾':'L','暴':'B','甘':'G','钭':'T','厉':'L','戎':'R',
    '祖':'Z','武':'W','符':'F','刘':'L','景':'J','詹':'Z','束':'S','龙':'L',
    '叶':'Y','幸':'X','司':'S','韶':'S','郜':'G','黎':'L','蓟':'J','薄':'B',
    '印':'Y','宿':'S','白':'B','怀':'H','蒲':'P','台':'T','从':'C','鄂':'E',
    '索':'S','咸':'X','籍':'J','赖':'L','卓':'Z','蔺':'L','屠':'T','蒙':'M',
    '池':'C','乔':'Q','阴':'Y','鬱':'Y','胥':'X','能':'N','苍':'C','双':'S',
    '闻':'W','莘':'S','党':'D','翟':'Z','谭':'T','贡':'G','劳':'L','逄':'P',
    '姬':'J','申':'S','扶':'F','堵':'D','冉':'R','宰':'Z','郦':'L','雍':'Y',
    '却':'Q','璩':'Q','桑':'S','桂':'G','濮':'P','牛':'N','寿':'S','通':'T',
    '边':'B','扈':'H','燕':'Y','冀':'J','浦':'P','尚':'S','农':'N','温':'W',
    '别':'B','庄':'Z','晏':'Y','柴':'C','瞿':'Q','阎':'Y','充':'C','慕':'M',
    '连':'L','茹':'R','习':'X','宦':'H','艾':'A','鱼':'Y','容':'R','向':'X',
    '古':'G','易':'Y','慎':'S','戈':'G','廖':'L','庾':'Y','终':'Z','暨':'J',
    '居':'J','衡':'H','步':'B','都':'D','耿':'G','满':'M','弘':'H','匡':'K',
    '国':'G','文':'W','寇':'K','广':'G','禄':'L','阙':'Q','东':'D','欧':'O',
    '殳':'S','沃':'W','利':'L','蔚':'W','越':'Y','夔':'K','隆':'L','师':'S',
    '巩':'G','厍':'S','聂':'N','晁':'C','勾':'G','敖':'A','融':'R','冷':'L',
    '訾':'Z','辛':'X','阚':'K','那':'N','简':'J','饶':'R','空':'K','曾':'Z',
    '毋':'W','沙':'S','乜':'N','养':'Y','鞠':'J','须':'X','丰':'F','巢':'C',
    '关':'G','蒯':'K','相':'X','查':'Z','后':'H','荆':'J','红':'H','游':'Y',
    '竺':'Z','权':'Q','逯':'L','盖':'G','益':'Y','桓':'H','公':'G','万':'W'
  }
  return surnameMap[first] || '#'
}

const alphaGroups = computed(() => {
  const members = keyword.value.trim()
    ? allMembers.value.filter(m => m.name.includes(keyword.value.trim()))
    : allMembers.value

  const grouped: Record<string, ContactMember[]> = {}
  for (const m of members) {
    const letter = m.pinyin
    if (!grouped[letter]) grouped[letter] = []
    grouped[letter].push(m)
  }

  const letters = Object.keys(grouped).sort()
  return letters.map(letter => ({
    letter,
    members: grouped[letter].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  }))
})

const alphaLetters = computed(() => alphaGroups.value.map(g => g.letter))

const scrollToLetter = (letter: string) => {
  currentLetter.value = letter
  scrollTarget.value = 'alpha-' + letter
}

const getAvatarBg = (generation: number): string => {
  const bgs: Record<number, string> = {
    1: 'linear-gradient(135deg, #667eea, #764ba2)',
    2: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    3: 'linear-gradient(135deg, #2D8B4E, #4CAF50)',
    4: 'linear-gradient(135deg, #43e97b, #38f9d7)'
  }
  return bgs[generation] || bgs[1]
}

const getEmoji = (gender?: number): string => {
  if (gender === 1) return '👨'
  if (gender === 2) return '👩'
  return '🧑'
}

const goAddMember = () => {
  uni.navigateTo({ url: '/pages/member/add-member' })
}

const goDetail = (m: ContactMember) => {
  uni.navigateTo({ url: `/pages/member/member-detail?id=${m._id}` })
}

const sendMessage = (m: ContactMember) => {
  if (!m.phone) return
  uni.makePhoneCall({
    phoneNumber: m.phone,
    fail: () => {
      uni.setClipboardData({
        data: m.phone!,
        success: () => uni.showToast({ title: '已复制号码，可通过微信添加', icon: 'none' })
      })
    }
  })
}

const openLocation = (m: ContactMember) => {
  if (!m.graveLocation) return
  uni.openLocation({
    latitude: m.graveLocation.latitude,
    longitude: m.graveLocation.longitude,
    name: m.graveAddress || (m.name + '的坟位'),
    address: m.graveAddress || ''
  })
}

const onSearchInput = (e: any) => {
  keyword.value = e.detail.value || ''
}

const onSearchConfirm = () => {
  // filtered via computed
}

const clearSearch = () => {
  keyword.value = ''
}

const loadData = async () => {
  loading.value = true
  try {
    const data = await familyApi.getContactsByGeneration()
    allMembers.value = (data || []).map((m: any) => ({
      _id: m._id || '',
      name: m.name || '',
      generation: m.generation || 1,
      relation: m.relation || '',
      phone: m.phone || '',
      wechat: m.wechat || '',
      homeAddress: m.homeAddress || '',
      graveAddress: m.graveAddress || '',
      graveLocation: m.graveLocation || null,
      gender: m.gender || 0,
      pinyin: getPinyinFirst(m.name || '')
    }))
  } catch (e) {
    console.error('加载通讯录失败', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

onShow(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.contacts-page {
  min-height: 100vh;
  background: #F8F6F2;
}

.search-bar {
  padding: 20rpx 24rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #EAE6E0;
  position: sticky;
  top: 0;
  z-index: 10;

  .search-box {
    display: flex;
    align-items: center;
    height: 72rpx;
    background: #F0EDE8;
    border-radius: 36rpx;
    padding: 0 24rpx;
    gap: 12rpx;

    .search-icon { font-size: 28rpx; }
    .search-input { flex: 1; font-size: 28rpx; color: #2C2C2C; }
    .clear-icon { font-size: 24rpx; color: #999; padding: 8rpx; }
  }
}

.placeholder { color: #999; }

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;

  .state-emoji { font-size: 80rpx; margin-bottom: 24rpx; }
  .state-text { font-size: 28rpx; color: #999; }
}

.contact-body {
  display: flex;
  height: calc(100vh - 112rpx);
}

.contact-scroll {
  flex: 1;
  padding: 16rpx 24rpx 180rpx;
}

.alpha-header {
  padding: 16rpx 0 8rpx;

  .alpha-letter {
    font-size: 26rpx;
    font-weight: 700;
    color: #2D8B4E;
  }
}

.contact-card {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);

  &:active { opacity: 0.95; }

  .card-top {
    display: flex;
  }

  .c-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .c-emoji { font-size: 40rpx; }
  }

  .c-main {
    flex: 1;
    margin-left: 20rpx;
    overflow: hidden;
  }

  .c-name-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 8rpx;

    .c-name {
      font-size: 32rpx;
      font-weight: 600;
      color: #2C2C2C;
    }

    .c-relation {
      font-size: 22rpx;
      color: #FFFFFF;
      background: #2D8B4E;
      padding: 4rpx 14rpx;
      border-radius: 12rpx;
    }
  }

  .c-detail-row {
    display: flex;
    align-items: flex-start;
    margin-top: 6rpx;

    .c-icon {
      font-size: 22rpx;
      margin-right: 8rpx;
      flex-shrink: 0;
      margin-top: 2rpx;
    }

    .c-detail {
      font-size: 24rpx;
      color: #666;
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .card-actions {
    display: flex;
    gap: 16rpx;
    margin-top: 20rpx;
    padding-top: 16rpx;
    border-top: 1rpx solid #F0EDE8;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6rpx;
      padding: 10rpx 24rpx;
      border-radius: 20rpx;

      &:active { opacity: 0.7; }

      .action-icon { font-size: 24rpx; }
      .action-label { font-size: 22rpx; font-weight: 500; }
    }

    .action-msg {
      background: #E8F5EC;

      .action-label { color: #2D8B4E; }
    }

    .action-loc {
      background: #FFF3E0;

      .action-label { color: #E65100; }
    }
  }
}

.alpha-index {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  width: 48rpx;

  .index-letter {
    font-size: 20rpx;
    color: #999;
    padding: 4rpx 0;
    line-height: 1.4;

    &.active { color: #2D8B4E; font-weight: 700; }
  }
}

.fab-btn {
  position: fixed;
  right: 40rpx;
  bottom: 180rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: #2D8B4E;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(45, 139, 78, 0.4);

  &:active { opacity: 0.8; }

  .fab-text {
    font-size: 48rpx;
    color: #FFFFFF;
    font-weight: 300;
    margin-top: -4rpx;
  }
}
</style>
