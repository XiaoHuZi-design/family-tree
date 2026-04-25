// Mock 开关 — 改为 false 即切回真实云端
export const USE_MOCK = true

// 模拟网络延迟
export function mockDelay(ms = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 100))
}
