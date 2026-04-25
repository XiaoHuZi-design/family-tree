// Mock 数据 — 模拟真实家族场景

// ==================== 家族成员（12人，4代） ====================

export interface MockMember {
  _id: string
  name: string
  generation: number
  relation: string
  gender: number
  parentId: string
  phone: string
  wechat: string
  homeAddress: string
  graveAddress: string
  graveLocation: { latitude: number; longitude: number } | null
  avatar: string
  role: string
  birthday: string | null
  remark: string
}

export const mockMembers: MockMember[] = [
  // 第一代
  {
    _id: 'm1', name: '张大山', generation: 1, relation: '祖父', gender: 1, parentId: '',
    phone: '13800001111', wechat: 'zhangdashan', homeAddress: '湖南省长沙市岳麓区枫林三路',
    graveAddress: '湖南省长沙市岳麓山公墓A区3排', graveLocation: { latitude: 28.2358, longitude: 112.9389 },
    avatar: '', role: 'owner', birthday: '1940-03-15', remark: '家族族主'
  },
  {
    _id: 'm2', name: '李秀英', generation: 1, relation: '祖母', gender: 2, parentId: '',
    phone: '13800002222', wechat: 'lixiuying', homeAddress: '湖南省长沙市岳麓区枫林三路',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '1942-08-20', remark: ''
  },
  // 第二代
  {
    _id: 'm3', name: '张建国', generation: 2, relation: '父亲', gender: 1, parentId: 'm1',
    phone: '13900003333', wechat: 'zhangjianguo66', homeAddress: '湖南省长沙市雨花区韶山南路',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'admin', birthday: '1965-05-10', remark: ''
  },
  {
    _id: 'm4', name: '王美丽', generation: 2, relation: '母亲', gender: 2, parentId: '',
    phone: '13900004444', wechat: 'wangmeili_mm', homeAddress: '湖南省长沙市雨花区韶山南路',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '1968-11-22', remark: ''
  },
  {
    _id: 'm5', name: '张建华', generation: 2, relation: '叔叔', gender: 1, parentId: 'm1',
    phone: '13900005555', wechat: 'zhangjianhua', homeAddress: '湖南省株洲市天元区',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '1970-02-14', remark: ''
  },
  // 第三代
  {
    _id: 'm6', name: '张小明', generation: 3, relation: '自己', gender: 1, parentId: 'm3',
    phone: '15800006666', wechat: 'zhangxiaoming', homeAddress: '广东省深圳市南山区科技园',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'admin', birthday: '1990-07-08', remark: '当前用户'
  },
  {
    _id: 'm7', name: '李小花', generation: 3, relation: '配偶', gender: 2, parentId: '',
    phone: '15800007777', wechat: 'lixiaohua_mm', homeAddress: '广东省深圳市南山区科技园',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '1992-04-18', remark: ''
  },
  {
    _id: 'm8', name: '张小强', generation: 3, relation: '堂弟', gender: 1, parentId: 'm5',
    phone: '15800008888', wechat: 'zhangxiaoqiang', homeAddress: '湖南省株洲市天元区',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '1995-12-03', remark: ''
  },
  // 第四代
  {
    _id: 'm9', name: '张天乐', generation: 4, relation: '儿子', gender: 1, parentId: 'm6',
    phone: '', wechat: '', homeAddress: '广东省深圳市南山区科技园',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '2018-01-20', remark: ''
  },
  {
    _id: 'm10', name: '张甜甜', generation: 4, relation: '女儿', gender: 2, parentId: 'm6',
    phone: '', wechat: '', homeAddress: '广东省深圳市南山区科技园',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '2020-06-15', remark: ''
  },
  {
    _id: 'm11', name: '张小宝', generation: 4, relation: '侄子', gender: 1, parentId: 'm8',
    phone: '', wechat: '', homeAddress: '湖南省株洲市天元区',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '2022-09-01', remark: ''
  },
  {
    _id: 'm12', name: '张文文', generation: 3, relation: '堂妹', gender: 2, parentId: 'm5',
    phone: '15800001212', wechat: 'zhangwenwen', homeAddress: '北京市朝阳区望京',
    graveAddress: '', graveLocation: null,
    avatar: '', role: 'member', birthday: '1998-03-25', remark: ''
  }
]

// ==================== 朋友圈动态（5条） ====================

export interface MockMoment {
  _id: string
  familyId: string
  authorId: string
  author: { nickname: string; avatar: string }
  content: string
  images: string[]
  location: string | null
  likeCount: number
  commentCount: number
  isLiked: boolean
  createTime: number
  updateTime: number
  isDeleted: boolean
}

export const mockMoments: MockMoment[] = [
  {
    _id: 'mt1', familyId: 'f1', authorId: 'm6',
    author: { nickname: '张小明', avatar: '' },
    content: '今天带全家回老家扫墓，爷爷的坟前杂草都清理干净了。奶奶说今年清明天气好，适合祭祖。愿先祖保佑我们张家世代平安！',
    images: [], location: '湖南长沙岳麓山',
    likeCount: 5, commentCount: 3, isLiked: false,
    createTime: Date.now() - 3600000 * 2, updateTime: Date.now() - 3600000 * 2, isDeleted: false
  },
  {
    _id: 'mt2', familyId: 'f1', authorId: 'm3',
    author: { nickname: '张建国', avatar: '' },
    content: '张氏家族族谱整理工作正式启动！第三代小明负责电子化录入，希望各位宗亲积极提供资料。',
    images: [], location: null,
    likeCount: 8, commentCount: 2, isLiked: true,
    createTime: Date.now() - 86400000, updateTime: Date.now() - 86400000, isDeleted: false
  },
  {
    _id: 'mt3', familyId: 'f1', authorId: 'm7',
    author: { nickname: '李小花', avatar: '' },
    content: '甜甜第一天上幼儿园，哭得稀里哗啦的，不过老师说适应能力很强！老母亲心疼又骄傲',
    images: [], location: '深圳南山',
    likeCount: 12, commentCount: 5, isLiked: false,
    createTime: Date.now() - 86400000 * 3, updateTime: Date.now() - 86400000 * 3, isDeleted: false
  },
  {
    _id: 'mt4', familyId: 'f1', authorId: 'm8',
    author: { nickname: '张小强', avatar: '' },
    content: '株洲老家的房子翻新了，老爸亲自监工，比以前敞亮多了！',
    images: [], location: '湖南株洲',
    likeCount: 6, commentCount: 1, isLiked: false,
    createTime: Date.now() - 86400000 * 5, updateTime: Date.now() - 86400000 * 5, isDeleted: false
  },
  {
    _id: 'mt5', familyId: 'f1', authorId: 'm12',
    author: { nickname: '张文文', avatar: '' },
    content: '北京今天下雪了，想念湖南的老家。各位叔伯婶婶注意保暖！',
    images: [], location: '北京朝阳',
    likeCount: 3, commentCount: 4, isLiked: true,
    createTime: Date.now() - 86400000 * 7, updateTime: Date.now() - 86400000 * 7, isDeleted: false
  }
]

// ==================== 会话列表（3条） ====================

export interface MockConversation {
  _id: string
  type: 'private' | 'group'
  name: string
  avatar: string
  members: string[]
  lastMessage: string
  lastMessageTime: number
  unread: number
}

export const mockConversations: MockConversation[] = [
  {
    _id: 'c1', type: 'group', name: '张家大家族群', avatar: '',
    members: ['m1', 'm3', 'm5', 'm6', 'm8'],
    lastMessage: '张建国：下个月家族聚会定在长沙，大家安排好时间',
    lastMessageTime: Date.now() - 1800000, unread: 3
  },
  {
    _id: 'c2', type: 'private', name: '李小花', avatar: '',
    members: ['m6', 'm7'],
    lastMessage: '好的，我下班去买菜',
    lastMessageTime: Date.now() - 3600000, unread: 0
  },
  {
    _id: 'c3', type: 'private', name: '张小强', avatar: '',
    members: ['m6', 'm8'],
    lastMessage: '周末回株洲不？老爸说想你了',
    lastMessageTime: Date.now() - 86400000, unread: 1
  }
]

// ==================== 聊天消息 ====================

export interface MockMessage {
  _id: string
  conversationId: string
  type: 'text' | 'image' | 'location'
  content: string
  senderId: string
  senderName: string
  senderAvatar: string
  createTime: number
}

export const mockMessages: Record<string, MockMessage[]> = {
  c1: [
    { _id: 'msg1', conversationId: 'c1', type: 'text', content: '大家好，最近都还好吧？', senderId: 'm1', senderName: '张大山', senderAvatar: '', createTime: Date.now() - 7200000 },
    { _id: 'msg2', conversationId: 'c1', type: 'text', content: '爸，我们都好。您和妈注意身体', senderId: 'm3', senderName: '张建国', senderAvatar: '', createTime: Date.now() - 7100000 },
    { _id: 'msg3', conversationId: 'c1', type: 'text', content: '爷爷好！天乐甜甜最近都长高了', senderId: 'm6', senderName: '张小明', senderAvatar: '', createTime: Date.now() - 7000000 },
    { _id: 'msg4', conversationId: 'c1', type: 'text', content: '下个月家族聚会定在长沙，大家安排好时间', senderId: 'm3', senderName: '张建国', senderAvatar: '', createTime: Date.now() - 1800000 }
  ],
  c2: [
    { _id: 'msg5', conversationId: 'c2', type: 'text', content: '老公，晚上想吃什么？', senderId: 'm7', senderName: '李小花', senderAvatar: '', createTime: Date.now() - 3700000 },
    { _id: 'msg6', conversationId: 'c2', type: 'text', content: '随便，你做什么我都爱吃', senderId: 'm6', senderName: '张小明', senderAvatar: '', createTime: Date.now() - 3650000 },
    { _id: 'msg7', conversationId: 'c2', type: 'text', content: '好的，我下班去买菜', senderId: 'm7', senderName: '李小花', senderAvatar: '', createTime: Date.now() - 3600000 }
  ],
  c3: [
    { _id: 'msg8', conversationId: 'c3', type: 'text', content: '哥，周末回株洲不？', senderId: 'm8', senderName: '张小强', senderAvatar: '', createTime: Date.now() - 86400000 },
    { _id: 'msg9', conversationId: 'c3', type: 'text', content: '老爸说想你了', senderId: 'm8', senderName: '张小强', senderAvatar: '', createTime: Date.now() - 86400000 + 5000 }
  ]
}

// ==================== 用户信息 ====================

export const mockCurrentUser = {
  _id: 'm6',
  nickname: '张小明',
  avatar: '',
  phone: '15800006666',
  role: 'admin',
  familyId: 'f1',
  familyIds: ['f1']
}
