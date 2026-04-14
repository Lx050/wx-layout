import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAppStore } from '../stores/appStore'

// Hash history for GitHub Pages compatibility (no server config needed)
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Step1',
    component: () => import('../views/Step1TextInput.vue'),
    meta: { title: '输入文本', step: 1 }
  },
  {
    path: '/editor',
    name: 'Step2',
    component: () => import('../views/Step2Editor.vue'),
    meta: { title: '排版编辑', step: 2 }
  },
  {
    path: '/preview',
    name: 'Step3',
    component: () => import('../views/Step3Preview.vue'),
    meta: { title: '预览导出', step: 3 }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: '设置' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// Step guards: ensure content exists before proceeding
router.beforeEach((to, _from, next) => {
  document.title = `wx-layout${to.meta.title ? ' · ' + to.meta.title : ''}`
  const appStore = useAppStore()

  if (to.path === '/editor') {
    const hasContent = appStore.rawText || appStore.contentBlocks?.length ||
      appStore.editorJson || localStorage.getItem('manifold_editor_autosave')
    if (!hasContent) { next('/'); return }
  }

  if (to.path === '/preview') {
    const hasContent = appStore.editorJson || appStore.contentBlocks?.length
    if (!hasContent) { next('/editor'); return }
  }

  next()
})

export default router
