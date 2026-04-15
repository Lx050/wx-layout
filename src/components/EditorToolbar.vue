<script setup lang="ts">
import { computed } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { ref } from 'vue'

const props = defineProps<{ editor: Editor | null; aiFilling?: boolean }>()
const emit = defineEmits<{
  (e: 'open-svg-panel'): void
  (e: 'edit-link'): void
  (e: 'ai-fill-slots'): void
}>()

const imageInput = ref<HTMLInputElement | null>(null)

const canUndo = computed(() => props.editor?.can().undo() ?? false)
const canRedo = computed(() => props.editor?.can().redo() ?? false)

// Save selection before the <select> steals focus from the editor
let savedSelection: { from: number; to: number } | null = null
function onSelectMousedown() {
  if (!props.editor) return
  const { from, to } = props.editor.state.selection
  savedSelection = { from, to }
}

function isActive(name: string, attrs?: Record<string, unknown>): boolean {
  return props.editor?.isActive(name, attrs) ?? false
}

function run(fn: () => boolean | void) {
  if (props.editor) fn()
}

// --- Block type switcher ---
type BlockType = 'body' | 'intro' | 'outro' | 'h1' | 'h2' | 'h3' | 'blockquote'

const blockTypeOptions: { value: BlockType; label: string }[] = [
  { value: 'body',       label: '正文' },
  { value: 'h1',        label: 'H1 大标题' },
  { value: 'h2',        label: 'H2 小标题' },
  { value: 'h3',        label: 'H3 段标题' },
  { value: 'blockquote', label: '引用块' },
  { value: 'intro',     label: '引言' },
  { value: 'outro',     label: '结尾语' },
]

const currentBlockType = computed<BlockType>(() => {
  if (!props.editor) return 'body'
  if (isActive('manifoldHeading', { level: 1 })) return 'h1'
  if (isActive('manifoldHeading', { level: 2 })) return 'h2'
  if (isActive('manifoldHeading', { level: 3 })) return 'h3'
  if (isActive('blockquote')) return 'blockquote'
  if (isActive('paragraph')) {
    const { $from } = props.editor.state.selection
    const role = $from.parent.attrs?.blockRole || 'body'
    if (role === 'intro') return 'intro'
    if (role === 'outro') return 'outro'
    return 'body'
  }
  return 'body'
})

function setBlockType(type: BlockType) {
  if (!props.editor) return
  // Restore selection that was lost when <select> stole focus
  if (savedSelection) {
    props.editor.chain().setTextSelection(savedSelection).run()
    savedSelection = null
  }
  const chain = props.editor.chain().focus()
  switch (type) {
    case 'h1': chain.setNode('manifoldHeading', { level: 1 }).run(); break
    case 'h2': chain.setNode('manifoldHeading', { level: 2 }).run(); break
    case 'h3': chain.setNode('manifoldHeading', { level: 3 }).run(); break
    case 'blockquote':
      if (isActive('blockquote')) { chain.lift('blockquote').run() }
      else { chain.setParagraph().run(); props.editor.chain().focus().toggleBlockquote().run() }
      break
    case 'intro':
      chain.setParagraph().updateAttributes('paragraph', { blockRole: 'intro' }).run(); break
    case 'outro':
      chain.setParagraph().updateAttributes('paragraph', { blockRole: 'outro' }).run(); break
    default:
      chain.setParagraph().updateAttributes('paragraph', { blockRole: 'body' }).run(); break
  }
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !props.editor) return
  const localUrl = URL.createObjectURL(file)
  props.editor.chain().focus().insertContent({
    type: 'manifoldImage',
    attrs: { src: localUrl, caption: '', layout: 'full_width' },
  }).run()
  input.value = ''
}

function toggleLink() {
  if (!props.editor) return
  emit('edit-link')
}
</script>

<template>
  <div v-if="editor" role="toolbar" aria-label="编辑器工具栏" class="toolbar-bar">

    <!-- 块类型 — 主要操作，放大展示 -->
    <select
      class="block-type-select"
      :value="currentBlockType"
      @mousedown="onSelectMousedown"
      @change="setBlockType(($event.target as HTMLSelectElement).value as BlockType)"
      title="块类型"
    >
      <option v-for="opt in blockTypeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>

    <span class="divider" />

    <!-- 加粗 -->
    <button
      class="toolbar-btn"
      :class="{ active: isActive('bold') }"
      @click="run(() => editor!.chain().focus().toggleBold().run())"
      title="加粗 (Ctrl+B)"
    ><strong>B</strong></button>

    <!-- 链接 -->
    <button
      class="toolbar-btn"
      :class="{ active: isActive('link') }"
      @click="toggleLink"
      title="插入链接 (Ctrl+K)"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    </button>

    <!-- 插入图片 -->
    <button
      class="toolbar-btn"
      @click="imageInput?.click()"
      title="插入图片"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </button>
    <input ref="imageInput" type="file" accept="image/*" class="hidden" @change="handleImageUpload" />

    <span class="divider" />

    <!-- 撤销 / 重做 -->
    <button class="toolbar-btn" :class="{ 'opacity-25': !canUndo }" :disabled="!canUndo" @click="run(() => editor!.chain().focus().undo().run())" title="撤销 (Ctrl+Z)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
      </svg>
    </button>
    <button class="toolbar-btn" :class="{ 'opacity-25': !canRedo }" :disabled="!canRedo" @click="run(() => editor!.chain().focus().redo().run())" title="重做 (Ctrl+Shift+Z)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>
      </svg>
    </button>

  </div>
</template>

<style scoped>
.toolbar-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  background: #fff;
}

/* 块类型选择器 — 更突出 */
.block-type-select {
  height: 34px;
  min-width: 110px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(0,0,0,0.75);
  background: #fff;
  border: 1.5px solid rgba(0,0,0,0.18);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.block-type-select:hover,
.block-type-select:focus {
  border-color: var(--color-accent-primary, #0075de);
  outline: none;
}

.divider {
  width: 1px;
  height: 20px;
  margin: 0 4px;
  background: rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.toolbar-btn {
  width: 34px;
  height: 34px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: rgba(0,0,0,0.55);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  flex-shrink: 0;
  border: none;
  background: transparent;
}
.toolbar-btn:hover {
  background: rgba(0,0,0,0.06);
  color: rgba(0,0,0,0.85);
}
.toolbar-btn.active {
  background: var(--color-badge-bg, #f2f9ff);
  color: var(--color-accent-primary, #0075de);
}
.toolbar-btn:disabled {
  cursor: default;
}

@media (pointer: coarse) {
  .toolbar-btn { width: 40px; height: 40px; }
  .block-type-select { height: 40px; }
}
</style>
