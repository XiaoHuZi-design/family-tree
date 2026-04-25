import { mockMembers, MockMember } from './data'
import { mockDelay } from '@/utils/mock-config'

let members = [...mockMembers]

function buildTree(): any[] {
  const map: Record<string, any> = {}
  const roots: any[] = []

  for (const m of members) {
    map[m._id] = { ...m, children: [] }
  }
  for (const m of members) {
    if (m.parentId && map[m.parentId]) {
      map[m.parentId].children.push(map[m._id])
    } else {
      roots.push(map[m._id])
    }
  }
  return roots
}

export default {
  async getFamilyTree(familyId: string) {
    await mockDelay()
    return { code: 0, msg: 'success', data: { tree: buildTree(), total: members.length } }
  },

  async getMemberDetail(memberId: string) {
    await mockDelay()
    const m = members.find(x => x._id === memberId)
    if (!m) return { code: 404, msg: '成员不存在' }
    return { code: 0, msg: 'success', data: { id: m._id, ...m } }
  },

  async addMember(data: any) {
    await mockDelay()
    const id = 'm' + (members.length + 1) + '_' + Date.now()
    const newMember: MockMember = {
      _id: id,
      name: data.name || '',
      generation: data.generation || 1,
      relation: data.relation || '',
      gender: data.gender || 0,
      parentId: data.parentId || '',
      phone: data.contact?.phone || '',
      wechat: data.contact?.wechat || '',
      homeAddress: data.contact?.homeAddress || '',
      graveAddress: data.contact?.graveAddress || '',
      graveLocation: null,
      avatar: '', role: 'member', birthday: null, remark: ''
    }
    members.push(newMember)
    return { code: 0, msg: 'success', data: { memberId: id } }
  },

  async updateMember(memberId: string, data: any) {
    await mockDelay()
    const idx = members.findIndex(x => x._id === memberId)
    if (idx === -1) return { code: 404, msg: '成员不存在' }
    members[idx] = { ...members[idx], ...data }
    return { code: 0, msg: 'success' }
  },

  async searchMembers(familyId: string, keyword: string) {
    await mockDelay()
    const list = members.filter(m => m.name.includes(keyword))
    return { code: 0, msg: 'success', data: { list, total: list.length } }
  },

  async getContactsByGeneration(familyId: string) {
    await mockDelay()
    const grouped: Record<number, any[]> = {}
    for (const m of members) {
      if (!grouped[m.generation]) grouped[m.generation] = []
      grouped[m.generation].push(m)
    }
    return { code: 0, msg: 'success', data: grouped }
  },

  async getContactList(familyId: string) {
    await mockDelay()
    return { code: 0, msg: 'success', data: { list: members.map(m => ({ id: m._id, ...m })) } }
  },

  async deleteMember(memberId: string) {
    await mockDelay()
    members = members.filter(x => x._id !== memberId)
    return { code: 0, msg: 'success', data: { memberId } }
  }
}
