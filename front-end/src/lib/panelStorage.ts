import type { PersistedPanel } from '../types'
import { PANEL_STORAGE_KEY } from './constants'

export function readPersistedPanel(): PersistedPanel {
  try {
    const raw = sessionStorage.getItem(PANEL_STORAGE_KEY)
    if (!raw) return {}
    const o = JSON.parse(raw) as Record<string, unknown>
    const out: PersistedPanel = {}
    if (o.activeTab === 'generate' || o.activeTab === 'cut' || o.activeTab === 'other') {
      out.activeTab = o.activeTab
    }
    if (typeof o.systemPrompt === 'string') out.systemPrompt = o.systemPrompt
    if (typeof o.userPrompt === 'string') out.userPrompt = o.userPrompt
    if (typeof o.selectedModel === 'string') out.selectedModel = o.selectedModel
    if (typeof o.selectedResolution === 'string') out.selectedResolution = o.selectedResolution
    if (typeof o.selectedAspectRatio === 'string') out.selectedAspectRatio = o.selectedAspectRatio
    if (typeof o.tagSystemPrompt === 'string') out.tagSystemPrompt = o.tagSystemPrompt
    if (typeof o.tagUserPrompt === 'string') out.tagUserPrompt = o.tagUserPrompt
    if (typeof o.tagModel === 'string') out.tagModel = o.tagModel
    if (typeof o.isManualTagMode === 'boolean') out.isManualTagMode = o.isManualTagMode
    if (typeof o.manualTag === 'string') out.manualTag = o.manualTag
    if (typeof o.generatedTag === 'string') out.generatedTag = o.generatedTag
    if (o.editMode === 'crop' || o.editMode === 'arrow') out.editMode = o.editMode
    if (typeof o.arrowColor === 'string') out.arrowColor = o.arrowColor
    return out
  } catch {
    return {}
  }
}

export function writePersistedPanel(data: PersistedPanel): void {
  try {
    sessionStorage.setItem(PANEL_STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota / private mode */
  }
}
