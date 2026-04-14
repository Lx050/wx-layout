<template>
  <div style="max-width:720px;margin:40px auto;padding:0 24px 80px;">

    <h1 style="font-size:22px;font-weight:700;color:rgba(0,0,0,0.9);margin-bottom:32px;font-family:var(--font-display)">
      设置
    </h1>

    <!-- 基础信息 -->
    <section class="notion-card" style="padding:24px;margin-bottom:24px;">
      <h2 style="font-size:15px;font-weight:600;color:rgba(0,0,0,0.8);margin-bottom:16px;">基础信息</h2>
      <div style="margin-bottom:16px;">
        <label class="settings-label">默认署名</label>
        <input
          v-model="settings.username"
          class="notion-input"
          placeholder="你的名字（用于文章尾部署名）"
          @change="store.setUsername(settings.username)"
        />
      </div>
    </section>

    <!-- 微信公众号配置 -->
    <section class="notion-card" style="padding:24px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h2 style="font-size:15px;font-weight:600;color:rgba(0,0,0,0.8);margin:0;">微信公众号</h2>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
          <span style="font-size:13px;color:rgba(0,0,0,0.55);">启用图片上传</span>
          <input type="checkbox" v-model="wechatEnabled" @change="saveWechat" style="width:16px;height:16px;cursor:pointer;" />
        </label>
      </div>

      <div v-if="wechatEnabled" style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="settings-label">AppID</label>
          <input v-model="wechatForm.appId" class="notion-input" placeholder="wx_xxxxxxxxxxxxxxxx" />
        </div>
        <div>
          <label class="settings-label">代理地址 (CF Worker URL)</label>
          <input v-model="wechatForm.proxyUrl" class="notion-input" placeholder="https://your-proxy.workers.dev" />
          <p style="margin:6px 0 0;font-size:12px;color:var(--color-text-secondary);">
            需要自部署 Cloudflare Worker 代理来转发微信 API 请求。
            <a href="https://github.com/YOUR_ORG/wx-layout/blob/main/worker/README.md" target="_blank"
               style="color:var(--color-accent-primary);text-decoration:none;">查看一键部署说明 →</a>
          </p>
        </div>

        <div style="display:flex;gap:10px;margin-top:4px;">
          <button class="magazine-btn-primary" @click="saveWechat">保存</button>
          <button @click="testProxy" :disabled="testing"
            style="padding:7px 16px;background:transparent;border:1px solid rgba(0,0,0,0.15);border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;">
            {{ testing ? '测试中...' : '测试连接' }}
          </button>
        </div>

        <div v-if="testResult" :style="{
          padding:'10px 14px', borderRadius:'6px', fontSize:'13px',
          background: testResult.ok ? 'var(--color-success-light)' : 'var(--color-error-light)',
          color: testResult.ok ? 'var(--color-success)' : 'var(--color-error)',
        }">
          {{ testResult.message }}
        </div>
      </div>
    </section>

    <!-- 资产库 -->
    <section class="notion-card" style="padding:24px;margin-bottom:24px;">
      <h2 style="font-size:15px;font-weight:600;color:rgba(0,0,0,0.8);margin-bottom:16px;">资产库</h2>
      <p style="font-size:13px;color:var(--color-text-secondary);margin-bottom:16px;">
        所有上传的图片和自定义模板保存在浏览器本地存储 (IndexedDB)。
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button @click="exportAssets"
          style="padding:7px 16px;background:transparent;border:1px solid rgba(0,0,0,0.15);border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;">
          导出资产库
        </button>
        <button @click="importAssets"
          style="padding:7px 16px;background:transparent;border:1px solid rgba(0,0,0,0.15);border-radius:4px;font-size:13px;font-weight:500;cursor:pointer;">
          导入资产库
        </button>
        <button @click="clearData"
          style="padding:7px 16px;background:transparent;border:1px solid var(--color-error);border-radius:4px;font-size:13px;font-weight:500;color:var(--color-error);cursor:pointer;">
          清除所有本地数据
        </button>
      </div>
    </section>

    <!-- 关于 -->
    <section class="notion-card" style="padding:24px;">
      <h2 style="font-size:15px;font-weight:600;color:rgba(0,0,0,0.8);margin-bottom:12px;">关于</h2>
      <p style="font-size:13px;color:var(--color-text-secondary);line-height:1.6;margin:0;">
        wx-layout 是一个开源的微信公众号版式装配引擎，纯前端运行，无需登录，无需后端。<br>
        <a href="https://github.com/YOUR_ORG/wx-layout" target="_blank"
           style="color:var(--color-accent-primary);text-decoration:none;">GitHub ↗</a>
        &nbsp;·&nbsp;
        <a href="https://github.com/YOUR_ORG/wx-layout/issues" target="_blank"
           style="color:var(--color-accent-primary);text-decoration:none;">反馈问题 ↗</a>
      </p>
    </section>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'
import toast from '../composables/useToast'

const store = useSettingsStore()
const showSuccess = (msg: string) => toast.success(msg)
const showError = (msg: string) => toast.error(msg)

const settings = reactive({ username: store.username })
const wechatEnabled = ref(store.wechat.enabled)
const wechatForm = reactive({ appId: store.wechat.appId, proxyUrl: store.wechat.proxyUrl })
const testing = ref(false)
const testResult = ref<{ ok: boolean; message: string } | null>(null)

watch(() => store.username, (v) => { settings.username = v })

function saveWechat() {
  store.setWechat({ ...wechatForm, enabled: wechatEnabled.value })
  showSuccess('微信配置已保存')
}

async function testProxy() {
  if (!wechatForm.proxyUrl) { showError('请先填写代理地址'); return }
  testing.value = true
  testResult.value = null
  try {
    const res = await fetch(`${wechatForm.proxyUrl}/ping`, { signal: AbortSignal.timeout(5000) })
    testResult.value = res.ok
      ? { ok: true, message: '连接成功，代理正常工作' }
      : { ok: false, message: `代理返回 HTTP ${res.status}` }
  } catch (e: any) {
    testResult.value = { ok: false, message: `连接失败: ${e.message}` }
  } finally {
    testing.value = false
  }
}

function exportAssets() {
  const data: Record<string, any> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!
    if (k.startsWith('manifold_') || k.startsWith('wx_layout_')) data[k] = localStorage.getItem(k)
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `wx-layout-assets-${Date.now()}.json`
  a.click()
}

function importAssets() {
  const input = document.createElement('input')
  input.type = 'file'; input.accept = '.json'
  input.onchange = async () => {
    if (!input.files?.[0]) return
    try {
      const text = await input.files[0].text()
      const data = JSON.parse(text)
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v as string)
      showSuccess('资产库导入成功，请刷新页面')
    } catch { showError('导入失败：文件格式无效') }
  }
  input.click()
}

function clearData() {
  if (!confirm('确定要清除所有本地数据吗？此操作不可撤销。')) return
  const toRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)!
    if (k.startsWith('manifold_') || k.startsWith('wx_layout_')) toRemove.push(k)
  }
  toRemove.forEach(k => localStorage.removeItem(k))
  store.clearAll()
  showSuccess('已清除所有本地数据')
}
</script>

<style scoped>
.settings-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(0,0,0,0.55);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}
</style>
