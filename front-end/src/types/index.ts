export interface ImageFile {
  name: string
  path: string
  hasTag?: boolean
}

export interface ImageList {
  originals: ImageFile[]
  datasets: ImageFile[]
}

export interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
}

export type ActiveTab = 'generate' | 'cut' | 'other'

export interface PersistedPanel {
  activeTab?: ActiveTab
  systemPrompt?: string
  userPrompt?: string
  selectedModel?: string
  selectedResolution?: string
  selectedAspectRatio?: string
  tagSystemPrompt?: string
  tagUserPrompt?: string
  tagModel?: string
  isManualTagMode?: boolean
  manualTag?: string
  generatedTag?: string
  editMode?: 'crop' | 'arrow'
  arrowColor?: string
}

export interface SystemStatus {
  mode: string
  device?: string
  'now-memory'?: string
  'max-memory'?: string
  'free-memory'?: string
  'total-memory'?: string
}
