# 编码规范

## 项目概述
家族树社交小程序，核心功能：家族成员管理（上下四代）、联系方式/家庭住址/坟位地址、家族朋友圈、私聊+群聊。

### 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| 前端 | uni-app (Vue 3) | 一套代码编译到微信小程序 + Android + iOS + H5 |
| 后端/数据库 | uniCloud (阿里云) | Serverless，免服务器，免费额度够前期使用 |
| 即时通讯 | 融云免费版 | 私聊+群聊，免费支持100并发 |
| 地图 | 腾讯地图 | 坟位/住址定位，微信小程序自带 |

### 费用估算

| 项目 | 费用 |
|---|---|
| uni-app 开发工具 HBuilderX | 免费 |
| uniCloud 阿里云版（前期） | 免费额度内 |
| 微信小程序注册 | 免费（个人即可） |
| 腾讯地图 API（前期） | 免费（日配额1万次） |
| 融云 IM 免费版 | 免费（100并发） |
| 苹果开发者账号（iOS上架） | $99/年（可后期再上） |
| **前期总成本** | **0 元** |

---

## 前端规范（uni-app / Vue 3）

### 代码风格
- 使用 Vue 3 Composition API（`<script setup>`）
- TypeScript 优先
- 组件命名：PascalCase（如 `FamilyTree.vue`、`MemberCard.vue`）
- JS/TS 文件命名：camelCase（如 `familyApi.ts`）
- 样式文件命名：kebab-case（如 `family-tree.css`）
- 页面目录命名：kebab-case（如 `pages/family-tree/`）

### 组件规范
- 单文件组件顺序：`<template>` → `<script setup lang="ts">` → `<style scoped>`
- Props 必须声明类型和默认值
- Emits 必须显式声明
- 组件内禁止直接调用云函数，统一通过 service 层

### 状态管理
- 使用 Pinia 管理全局状态
- Store 按业务模块拆分（如 `useFamilyStore`、`useChatStore`、`useUserStore`）
- 异步操作放在 Store 的 actions 中

### uniCloud 调用规范
- 云函数放在 `uniCloud-aliyun/cloudfunctions/` 目录
- 云对象放在 `uniCloud-aliyun/cloudobjects/` 目录
- 前端通过 `uniCloud.importObject()` 调用云对象
- 禁止在前端直接操作数据库，统一走云函数/云对象
- 公共模块放在 `uniCloud-aliyun/common/` 目录

### 页面与路由
- 页面路径在 `pages.json` 中统一注册
- TabBar 页面：家族树、通讯录、朋友圈、消息、我的
- 路由跳转使用 `uni.navigateTo` / `uni.switchTab`

### 样式规范
- 使用 rpx 作为尺寸单位（兼容多端）
- 全局样式放 `App.vue`，公共样式放 `styles/` 目录
- 使用 CSS 变量管理主题色（家族树推荐暖色调：树绿色系 #2D8B4E 或暖棕色系）
- 必须使用 `scoped` 防止样式污染

### 平台兼容
- 使用 `#ifdef MP-WEIXIN` 条件编译处理平台差异
- 测试兼容微信小程序、H5、Android App

---

## 后端规范（uniCloud 云函数/云对象）

### 目录结构
```
uniCloud-aliyun/
├── cloudfunctions/          # 云函数
│   ├── user/                # 用户模块
│   ├── family/              # 家族模块
│   ├── chat/                # 聊天模块
│   └── moments/             # 朋友圈模块
├── cloudobjects/            # 云对象（优先使用）
│   ├── co-user/             # 用户云对象
│   ├── co-family/           # 家族云对象
│   ├── co-chat/             # 聊天云对象
│   └── co-moments/          # 朋友圈云对象
├── database/                # 数据库初始化
│   └── *.schema.json        # 数据表结构定义
└── common/                  # 公共模块
    └── utils/               # 工具函数
```

### 云对象规范
- 每个业务模块对应一个云对象
- 方法命名：动词开头（如 `getMemberById`、`createFamily`）
- 统一返回格式：`{ code: 0, msg: 'success', data: {} }`
- 错误使用 `uniCloud.throw()` 抛出，附错误码

### 数据库规范（uniCloud DB）
- 表名：驼峰式（如 `familyMember`、`chatMessage`）
- 每张表必须有 `schema.json` 定义字段类型和校验规则
- 必须包含公共字段：`_id`、`createTime`、`updateTime`、`isDeleted`
- 敏感字段（手机号、住址）标记为加密
- 使用数据库触发器处理数据变更

### 核心数据表设计
```
uni-id-users         — 用户表（uni-id 内置）
family               — 家族表
familyMember         — 家族成员表（含四代关系）
memberContact        — 联系方式/住址/坟位地址
chatConversation     — 会话表
chatMessage          — 消息表
moments              — 朋友圈动态
momentsComment       — 朋友圈评论
momentsLike          — 朋友圈点赞
```

### 认证与权限
- 使用 uni-id（内置用户系统），微信一键登录
- 家族成员权限分级：族主、管理员、普通成员
- 敏感信息（联系方式、住址、坟位）需同族权限校验
- 云函数入口统一校验 token

### 即时通讯
- 私聊和群聊接入融云 IM SDK
- 融云免费版支持：100并发、文本/图片/位置消息
- 消息同时存一份到 uniCloud 数据库（用于朋友圈动态关联）
- 群聊场景：家族群自动包含所有家族成员

---

## 数据安全规范

- 用户手机号脱敏显示（138****1234）
- 坟位地址、家庭住址视为隐私数据，仅同族可见
- 所有接口必须校验登录态
- 云函数禁止返回多余字段（按需返回）
- 数据库 schema 设置字段权限（读/写分开控制）

---

## Git 规范

### 分支管理
- `main` — 生产分支
- `develop` — 开发分支
- `feature/{模块名}` — 功能分支（如 `feature/family-tree`）
- `fix/{问题描述}` — 修复分支

### 提交信息
- 格式：`<type>: <description>`
- type：feat / fix / docs / style / refactor / test / chore
- 示例：`feat: 添加家族成员树形展示页面`

---

## AI 生成代码要求

- 必须符合以上编码规范
- 云函数/云对象必须包含错误处理和参数校验
- 关键业务逻辑必须有注释说明意图
- 不允许生成未使用的代码或导入
- 数据库操作必须考虑并发安全（使用事务）
- 涉及隐私数据的查询必须加权限校验
- 前端代码必须兼容微信小程序环境
