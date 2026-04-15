<script setup lang="ts">
/**
 * InlineFormatToolbar — 行内格式浮动工具栏
 * 在 contenteditable 块中选中文字时浮现，提供：加粗、下划线、颜色(预设)、链接、清除格式
 *
 * 使用方式：挂载一次到 Step2Curtain，监听全局 selectionchange 事件
 */
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const x = ref(0)
const y = ref(0)
const isBold = ref(false)
const isUnderline = ref(false)
const isLink = ref(false)
const activeColor = ref('')

// 工具栏 DOM ref，用于检测点击是否在工具栏内
const toolbarEl = ref<HTMLElement | null>(null)

// 判断当前选区是否在 contenteditable 块内
function getSelectionInCe(): Selection | null {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  // 找最近的 contenteditable 祖先
  let node: Node | null = range.commonAncestorContainer
  while (node && node !== document.body) {
    if (node instanceof HTMLElement && node.contentEditable === 'true') return sel
    node = node.parentNode
  }
  return null
}

function updateState() {
  isBold.value = document.queryCommandState('bold')
  isUnderline.value = document.queryCommandState('underline')
  isLink.value = document.queryCommandState('createLink')

  // 检测当前选区颜色
  const color = document.queryCommandValue('foreColor')
  activeColor.value = color || ''
}

function positionToolbar() {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (!rect.width && !rect.height) return

  // 工具栏宽度约 220px，高 36px
  const TW = 228
  const TH = 38
  const GAP = 8

  let lx = rect.left + rect.width / 2 - TW / 2
  let ly = rect.top - TH - GAP

  // 如果顶部放不下，放到下方
  if (ly < 4) ly = rect.bottom + GAP

  // 水平边界 clamp
  lx = Math.max(8, Math.min(lx, window.innerWidth - TW - 8))

  x.value = lx
  y.value = ly
}

function handleSelectionChange() {
  const sel = getSelectionInCe()
  if (sel) {
    updateState()
    positionToolbar()
    visible.value = true
  } else {
    visible.value = false
  }
}

// execCommand 包装（带 focus 保护）
function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value)
  updateState()
}

function applyBold() { exec('bold') }
function applyUnderline() { exec('underline') }
function applyColor(color: string) {
  if (!color) {
    // 清除颜色：用 removeFormat 只移除颜色，再重置
    exec('foreColor', 'inherit')
  } else {
    exec('foreColor', color)
  }
}

function handleLink() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) return

  // 如果当前是链接，取消链接
  if (document.queryCommandState('unlink') || isLink.value) {
    exec('unlink')
    isLink.value = false
    return
  }

  // eslint-disable-next-line no-alert
  const url = window.prompt('输入链接地址：', 'https://')
  if (url && url !== 'https://') {
    exec('createLink', url)
    isLink.value = true
  }
}

function clearFormat() {
  exec('removeFormat')
  exec('unlink')
  isBold.value = false
  isUnderline.value = false
  isLink.value = false
  activeColor.value = ''
}

onMounted(() => {
  document.addEventListener('selectionchange', handleSelectionChange)
})
onUnmounted(() => {
  document.removeEventListener('selectionchange', handleSelectionChange)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="toolbarEl"
      class="inline-fmt-toolbar"
      :style="{ top: y + 'px', left: x + 'px' }"
    >
      <!-- 加粗 -->
      <button
        class="fmt-btn"
        :class="{ active: isBold }"
        @mousedown.prevent="applyBold"
        title="加粗 (Ctrl+B)"
      >
        <strong>B</strong>
      </button>

      <!-- 下划线 -->
      <button
        class="fmt-btn"
        :class="{ active: isUnderline }"
        @mousedown.prevent="applyUnderline"
        title="下划线 (Ctrl+U)"
      >
        <u>U</u>
      </button>

      <span class="fmt-sep" />

      <!-- 颜色预设：红 / 橙 / 蓝 / 清除 -->
      <button
        class="fmt-btn color-btn"
        :class="{ active: activeColor.includes('229, 62') || activeColor === 'rgb(229, 62, 62)' || activeColor === '#e53e3e' }"
        style="color: #e53e3e;"
        @mousedown.prevent="applyColor('#e53e3e')"
        title="标红"
      >A</button>

      <button
        class="fmt-btn color-btn"
        :class="{ active: activeColor.includes('221, 107') || activeColor === 'rgb(221, 107, 32)' }"
        style="color: #dd6b20;"
        @mousedown.prevent="applyColor('#dd6b20')"
        title="橙色"
      >A</button>

      <button
        class="fmt-btn color-btn"
        :class="{ active: activeColor.includes('43, 108') || activeColor === 'rgb(43, 108, 176)' }"
        style="color: #2b6cb0;"
        @mousedown.prevent="applyColor('#2b6cb0')"
        title="蓝色"
      >A</button>

      <button
        class="fmt-btn color-btn clear-color"
        @mousedown.prevent="applyColor('')"
        title="清除颜色"
      >A</button>

      <span class="fmt-sep" />

      <!-- 链接 -->
      <button
        class="fmt-btn"
        :class="{ active: isLink }"
        @mousedown.prevent="handleLink"
        title="插入/移除链接"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>

      <!-- 清除格式 -->
      <button
        class="fmt-btn fmt-clear"
        @mousedown.prevent="clearFormat"
        title="清除所有格式"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm3.5 11.5l-7-7m0 7l7-7"/>
        </svg>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.inline-fmt-toolbar {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 3px 5px;
  background: #1a1a1a;
  border-radius: 7px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.18);
  pointer-events: auto;
  animation: toolbar-in 0.12s ease;
}

@keyframes toolbar-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.fmt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.85);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.1s, color 0.1s;
  flex-shrink: 0;
}
.fmt-btn:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}
.fmt-btn.active {
  background: rgba(255,255,255,0.18);
  color: #fff;
}

.color-btn {
  font-size: 12px;
  font-weight: 700;
}
.clear-color {
  color: rgba(255,255,255,0.5) !important;
  text-decoration: line-through;
  font-weight: 700;
}

.fmt-sep {
  width: 1px;
  height: 18px;
  background: rgba(255,255,255,0.15);
  margin: 0 2px;
  flex-shrink: 0;
}

.fmt-clear {
  color: rgba(255,255,255,0.45);
}
.fmt-clear:hover {
  color: #fc8181 !important;
}
</style>
