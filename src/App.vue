<template>
  <div id="app" class="min-h-screen flex flex-col" style="background: var(--color-bg-page)">
    <Toast />
    <ConfirmDialog />

    <!-- 顶部导航栏 -->
    <header
      v-if="showHeader"
      class="flex-none z-50"
      style="
        background: #ffffff;
        border-bottom: 1px solid rgba(0,0,0,0.1);
        position: sticky;
        top: 0;
      "
    >
      <div style="max-width: 1200px; margin: 0 auto; padding: 0 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; height: 52px; gap: 16px;">

          <!-- Logo -->
          <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0; cursor: pointer;" @click="router.push('/')">
            <div style="
              width: 32px; height: 32px;
              background: var(--color-accent-primary);
              border-radius: 6px;
              display: flex; align-items: center; justify-content: center;
            ">
              <span style="color:#fff;font-weight:700;font-size:16px;font-family:var(--font-display)">W</span>
            </div>
            <span class="hidden sm:inline" style="
              font-size: 15px; font-weight: 600;
              color: rgba(0,0,0,0.95);
              font-family: var(--font-display);
            ">wx-layout</span>
          </div>

          <!-- 步骤指示器 -->
          <div
            v-if="isStepPage"
            style="
              display: flex; align-items: center;
              background: var(--color-bg-warm);
              border: 1px solid rgba(0,0,0,0.08);
              border-radius: 8px;
              padding: 6px 16px;
            "
          >
            <template v-for="(step, idx) in steps" :key="step.num">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div :style="{
                  width:'26px', height:'26px', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'12px', fontWeight:'700', flexShrink:'0', transition:'all 200ms',
                  background: currentStep > step.num ? 'var(--color-badge-bg)' : currentStep === step.num ? 'var(--color-accent-primary)' : '#fff',
                  color: currentStep > step.num ? 'var(--color-accent-primary)' : currentStep === step.num ? '#fff' : 'rgba(0,0,0,0.3)',
                  border: currentStep <= step.num && currentStep !== step.num ? '1.5px solid rgba(0,0,0,0.15)' : '1.5px solid transparent',
                }">
                  <svg v-if="currentStep > step.num" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span v-else>{{ step.num }}</span>
                </div>
                <span class="hidden lg:inline" :style="{
                  fontSize:'13px',
                  fontWeight: currentStep === step.num ? '600' : '400',
                  color: currentStep === step.num ? 'rgba(0,0,0,0.95)' : currentStep > step.num ? 'var(--color-accent-primary)' : 'rgba(0,0,0,0.4)',
                  whiteSpace:'nowrap',
                }">{{ step.label }}</span>
              </div>
              <div v-if="idx < steps.length - 1" :style="{
                width:'32px', height:'1px', margin:'0 8px',
                background: currentStep > step.num ? 'var(--color-accent-primary)' : 'rgba(0,0,0,0.12)',
                transition:'background 300ms', flexShrink:'0',
              }"></div>
            </template>
          </div>

          <!-- 右侧操作 -->
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
            <button
              @click="router.push('/settings')"
              title="设置"
              style="
                display:flex;align-items:center;justify-content:center;
                width:34px;height:34px;
                background:transparent;border:1px solid rgba(0,0,0,0.12);
                border-radius:6px;cursor:pointer;transition:background 150ms;
              "
              onmouseover="this.style.background='rgba(0,0,0,0.05)'"
              onmouseout="this.style.background='transparent'"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="rgba(0,0,0,0.6)" stroke-width="1.5"/>
                <path d="M13.3 6.6l-.7-1.7L14 3.5 12.5 2l-1.4 1.4-1.7-.7L9 1H7l-.4 1.7-1.7.7L3.5 2 2 3.5l1.4 1.4-.7 1.7L1 7v2l1.7.4.7 1.7L2 12.5 3.5 14l1.4-1.4 1.7.7L7 15h2l.4-1.7 1.7-.7 1.4 1.4 1.5-1.5-1.4-1.4.7-1.7L15 9V7l-1.7-.4z" stroke="rgba(0,0,0,0.6)" stroke-width="1.5"/>
              </svg>
            </button>
          </div>

        </div>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="flex-1 flex flex-col min-h-0 relative">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from './stores/appStore'
import Toast from './components/Toast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const steps = [
  { num: 1, label: '输入文本' },
  { num: 2, label: '排版编辑' },
  { num: 3, label: '预览导出' },
]

const showHeader = computed(() => route.name !== undefined)
const isStepPage = computed(() => typeof route.meta?.step === 'number')
const currentStep = computed(() => {
  const step = route.meta?.step
  if (typeof step === 'number') { appStore.setStep(step); return step }
  return 0
})
</script>

<style>
#app { width: 100vw; min-height: 100vh; }
.flex-1 { flex: 1 1 0%; }
</style>
