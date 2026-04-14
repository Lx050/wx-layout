/**
 * Style Service — 本地 localStorage 实现（替代后端 API）
 */

export interface StyleTemplate {
    id: string;
    name: string;
    type: 'title' | 'body' | 'intro';
    preview: string;
    fullExample: string;
    isCustom: boolean;
    tenantId: string | null;
    ownerId: string | null;
    createdAt: string;
    updatedAt: string;
}

const STORAGE_KEY = 'wx_layout_custom_styles'

function loadStyles(): StyleTemplate[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch { return [] }
}

function saveStyles(styles: StyleTemplate[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(styles))
}

class StyleService {
    async getAllStyles(): Promise<StyleTemplate[]> {
        return loadStyles()
    }

    async getStyle(id: string): Promise<StyleTemplate> {
        const styles = loadStyles()
        const found = styles.find(s => s.id === id)
        if (!found) throw new Error(`Style ${id} not found`)
        return found
    }

    async createStyle(data: { name: string; type: string; preview: string; fullExample: string }): Promise<StyleTemplate> {
        const styles = loadStyles()
        const newStyle: StyleTemplate = {
            id: `local_${Date.now()}`,
            name: data.name,
            type: data.type as StyleTemplate['type'],
            preview: data.preview,
            fullExample: data.fullExample,
            isCustom: true,
            tenantId: null,
            ownerId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        styles.push(newStyle)
        saveStyles(styles)
        return newStyle
    }

    async updateStyle(id: string, data: Partial<StyleTemplate>): Promise<StyleTemplate> {
        const styles = loadStyles()
        const idx = styles.findIndex(s => s.id === id)
        if (idx < 0) throw new Error(`Style ${id} not found`)
        styles[idx] = { ...styles[idx], ...data, updatedAt: new Date().toISOString() }
        saveStyles(styles)
        return styles[idx]
    }

    async deleteStyle(id: string): Promise<void> {
        const styles = loadStyles().filter(s => s.id !== id)
        saveStyles(styles)
    }
}

export const styleService = new StyleService()
