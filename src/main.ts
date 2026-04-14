import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './styles/main.css'
import './styles/compatibility.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// 移除初始加载动画
requestAnimationFrame(() => {
  const loader = document.getElementById('initial-loader')
  if (loader) {
    loader.style.transition = 'opacity 200ms'
    loader.style.opacity = '0'
    setTimeout(() => loader.remove(), 220)
  }
})
