/**
 * 本地设置 Store — 替代后端用户系统
 * 所有配置存入 localStorage，无需登录
 */
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface WechatConfig {
  appId: string
  proxyUrl: string   // 用户自部署的 CF Worker URL
  enabled: boolean
}

const STORAGE_KEY = 'wx_layout_settings'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

export const useSettingsStore = defineStore('settings', () => {
  const username = ref<string>(load('wx_layout_username', ''))
  const wechat = ref<WechatConfig>(load('wx_layout_wechat', {
    appId: '',
    proxyUrl: '',
    enabled: false,
  }))

  // Persist on change
  watch(username, (v) => { localStorage.setItem('wx_layout_username', JSON.stringify(v)) })
  watch(wechat, (v) => { localStorage.setItem('wx_layout_wechat', JSON.stringify(v)) }, { deep: true })

  function setUsername(name: string) { username.value = name }
  function setWechat(cfg: Partial<WechatConfig>) { wechat.value = { ...wechat.value, ...cfg } }
  function clearAll() {
    username.value = ''
    wechat.value = { appId: '', proxyUrl: '', enabled: false }
    localStorage.removeItem('wx_layout_username')
    localStorage.removeItem('wx_layout_wechat')
  }

  return { username, wechat, setUsername, setWechat, clearAll }
})
