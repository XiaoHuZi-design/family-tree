import App from './App.vue'
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { setupMock } from './mock/index'

setupMock()

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  app.use(pinia)
  return {
    app,
    pinia
  }
}
