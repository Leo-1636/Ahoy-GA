import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

/**
 * 圖片檔案介面
 */
interface ImageFile {
  name: string
  path: string // 格式如 "originals/filename.png"
  hasTag?: boolean // 是否有對應的 .txt 標籤檔案
}

/**
 * 圖片列表分類介面
 */
interface ImageList {
  originals: ImageFile[]
  datasets: ImageFile[]
}

/**
 * 裁切選取框座標介面
 */
interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
}

/**
 * 右側功能面板分頁類型
 */
type ActiveTab = 'generate' | 'cut' | 'other'

const PANEL_STORAGE_KEY = 'ahoy-function-panel-v1'

/** 從 sessionStorage 還原右側面板（含分頁與表單），避免往返設定頁或重新整理後重置 */
interface PersistedPanel {
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

function readPersistedPanel(): PersistedPanel {
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

function App() {
  const persisted = useMemo(() => readPersistedPanel(), [])

  // --- 狀態管理 ---
  
  // 伺服器上的圖片列表
  const [images, setImages] = useState<ImageList>({ originals: [], datasets: [] })
  // 當前在中間區域顯示的圖片
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null)
  // 圖片快取清除 key（用於強制重新載入）
  const [imageCacheKey, setImageCacheKey] = useState(0)
  // 滑鼠懸停預覽的圖片
  const [hoveredImage, setHoveredImage] = useState<ImageFile | null>(null)
  // 懸停預覽框的位置
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  
  // 多選刪除模式狀態
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  
  // 當前功能分頁
  const [activeTab, setActiveTab] = useState<ActiveTab>(persisted.activeTab ?? 'generate')
  
  // 生成圖片相關狀態
  const [systemPrompt, setSystemPrompt] = useState(persisted.systemPrompt ?? '')
  const [userPrompt, setUserPrompt] = useState(persisted.userPrompt ?? '')
  const [generateError, setGenerateError] = useState('')
  const [selectedModel, setSelectedModel] = useState(
    persisted.selectedModel ?? 'gemini-3.1-flash-image-preview'
  )
  const [selectedResolution, setSelectedResolution] = useState(persisted.selectedResolution ?? '1K')
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(
    persisted.selectedAspectRatio ?? '1:1'
  )
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]) // 原始 File 物件
  const [previewUrls, setPreviewUrls] = useState<string[]>([])    // 用於預覽的 Blob URLs
  const [isGenerating, setIsGenerating] = useState(false)

  // 系統狀態
  const [systemStatus, setSystemStatus] = useState<Record<string, string> | null>(null)
  
  // 裁切圖片相關狀態
  const [isDrawing, setIsDrawing] = useState(false)
  const [selection, setSelection] = useState<SelectionBox | null>(null)
  const [isCutting, setIsCutting] = useState(false)
  
  // 標籤生成相關狀態
  const [tagSystemPrompt, setTagSystemPrompt] = useState(persisted.tagSystemPrompt ?? '')
  const [tagUserPrompt, setTagUserPrompt] = useState(persisted.tagUserPrompt ?? '')
  const [generatedTag, setGeneratedTag] = useState(persisted.generatedTag ?? '')
  const [isGeneratingTag, setIsGeneratingTag] = useState(false)
  const [isManualTagMode, setIsManualTagMode] = useState(persisted.isManualTagMode ?? false)
  const [tagModel, setTagModel] = useState(persisted.tagModel ?? 'gemini-3-flash-preview')
  const [manualTag, setManualTag] = useState(persisted.manualTag ?? '')
  
  // 箭頭繪製相關狀態
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null)
  const [arrowEnd, setArrowEnd] = useState<{ x: number; y: number } | null>(null)
  const [isSavingArrow, setIsSavingArrow] = useState(false)
  const [arrowColor, setArrowColor] = useState(persisted.arrowColor ?? '#ff0000')
  
  // 編輯模式切換 (crop 或 arrow)
  const [editMode, setEditMode] = useState<'crop' | 'arrow'>(persisted.editMode ?? 'crop')

  const navigate = useNavigate()

  // 載入偏好設定 accent 顏色
  useEffect(() => {
    const saved = localStorage.getItem('accent-color')
    if (saved) document.documentElement.style.setProperty('--accent', saved)
  }, [])

  // 面板寬度調整
  const [sidebarWidth, setSidebarWidth] = useState(180)
  const [panelWidth, setPanelWidth] = useState(240)
  const sidebarDrag = useRef({ active: false, startX: 0, startWidth: 180 })
  const panelDrag = useRef({ active: false, startX: 0, startWidth: 240 })


  // DOM 引用
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // --- 副作用與資料獲取 ---

  /**
   * 從後端獲取最新的圖片列表
   */
  const fetchImages = useCallback(async () => {
    try {
      const response = await fetch('/api/images')
      const data = await response.json()
      const toImageFile = (items: { path: string; hasTag: boolean }[]) =>
        (items ?? []).map(item => ({
          name: item.path.split('/').pop() ?? item.path,
          path: item.path,
          hasTag: item.hasTag ?? false,
        }))
      setImages({
        originals: toImageFile(data.original ?? []),
        datasets: toImageFile(data.datasets ?? []),
      })
    } catch (error) {
      console.error('Failed to fetch images:', error)
    }
  }, [])

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setSystemStatus(data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }, [])

  // 初始化載入
  useEffect(() => {
    fetchImages()
    fetchStatus()
  }, [fetchImages, fetchStatus])

  // 按下生成後在請求進行中定期打 /api/status，VRAM 才會跟著推理過程更新
  useEffect(() => {
    if (!isGenerating) return
    void fetchStatus()
    const id = window.setInterval(() => {
      void fetchStatus()
    }, 750)
    return () => window.clearInterval(id)
  }, [isGenerating, fetchStatus])

  // 將右側面板選項與分頁寫入 sessionStorage（切換 Image/Edit/Tag 或往返設定頁皆保留）
  useEffect(() => {
    try {
      sessionStorage.setItem(
        PANEL_STORAGE_KEY,
        JSON.stringify({
          activeTab,
          systemPrompt,
          userPrompt,
          selectedModel,
          selectedResolution,
          selectedAspectRatio,
          tagSystemPrompt,
          tagUserPrompt,
          tagModel,
          isManualTagMode,
          manualTag,
          generatedTag,
          editMode,
          arrowColor,
        })
      )
    } catch {
      /* 無痕模式或配額 */
    }
  }, [
    activeTab,
    systemPrompt,
    userPrompt,
    selectedModel,
    selectedResolution,
    selectedAspectRatio,
    tagSystemPrompt,
    tagUserPrompt,
    tagModel,
    isManualTagMode,
    manualTag,
    generatedTag,
    editMode,
    arrowColor,
  ])

  // 面板拖曳調整寬度
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (sidebarDrag.current.active) {
        const delta = e.clientX - sidebarDrag.current.startX
        setSidebarWidth(Math.max(140, Math.min(380, sidebarDrag.current.startWidth + delta)))
      }
      if (panelDrag.current.active) {
        const delta = e.clientX - panelDrag.current.startX
        setPanelWidth(Math.max(200, Math.min(440, panelDrag.current.startWidth - delta)))
      }
    }
    const onMouseUp = () => {
      if (sidebarDrag.current.active || panelDrag.current.active) {
        sidebarDrag.current.active = false
        panelDrag.current.active = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])


  // --- 事件處理常式 ---

  /**
   * 處理圖片點擊選擇
   */
  const handleImageSelect = (image: ImageFile) => {
    if (isSelectMode) {
      // 選取模式：切換該圖片是否在刪除名單中
      setSelectedForDelete(prev => {
        const newSet = new Set(prev)
        if (newSet.has(image.path)) {
          newSet.delete(image.path)
        } else {
          newSet.add(image.path)
        }
        return newSet
      })
    } else {
      // 一般模式：切換中間顯示的圖片
      setSelectedImage(image)
      setSelection(null)
      // 清除箭頭狀態
      setArrowStart(null)
      setArrowEnd(null)
    }
  }

  /**
   * 處理滑鼠懸停預覽
   */
  const handleImageHover = (image: ImageFile | null, e?: React.MouseEvent) => {
    setHoveredImage(image)
    if (e && image) {
      setHoverPosition({ x: e.clientX, y: e.clientY })
    }
  }

  /**
   * 切換選取模式
   */
  const toggleSelectMode = () => {
    setIsSelectMode(prev => !prev)
    setSelectedForDelete(new Set())
  }

  /**
   * 執行批次刪除
   */
  const handleDeleteSelected = async () => {
    if (selectedForDelete.size === 0) return
    
    if (!confirm(`確定要刪除 ${selectedForDelete.size} 個檔案嗎？`)) return
    
    setIsDeleting(true)
    try {
      const response = await fetch('/api/images/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Array.from(selectedForDelete))
      })

      if (response.ok) {
        if (selectedImage && selectedForDelete.has(selectedImage.path)) {
          setSelectedImage(null)
        }
        await fetchImages()
        setSelectedForDelete(new Set())
      } else {
        alert('刪除失敗')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('刪除失敗')
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * 全選特定分類下的圖片
   */
  const selectAllInFolder = (folder: 'originals' | 'datasets') => {
    const folderImages = folder === 'originals' ? images.originals : images.datasets
    setSelectedForDelete(prev => {
      const newSet = new Set(prev)
      folderImages.forEach(img => newSet.add(img.path))
      return newSet
    })
  }

  /**
   * 處理拖曳進入區域
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  /**
   * 添加參考圖片並建立預覽 URL
   */
  const addReferenceFiles = (files: File[]) => {
    const newUrls = files.map(file => URL.createObjectURL(file))
    setReferenceFiles(prev => [...prev, ...files])
    setPreviewUrls(prev => [...prev, ...newUrls])
  }

  /**
   * 處理檔案拖放
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    addReferenceFiles(files)
  }

  /**
   * 處理檔案點擊上傳
   */
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      addReferenceFiles(files)
    }
  }

  /**
   * 移除特定的參考圖片並釋放記憶體
   */
  const removeReferenceFile = (index: number) => {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }
    setReferenceFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * 呼叫 AI 生成圖片
   */
  const handleGenerate = async () => {
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      setGenerateError('System Prompt 和 User Prompt 為必填')
      return
    }
    setGenerateError('')
    setIsGenerating(true)
    try {
      const formData = new FormData()
      formData.append('system_prompt', systemPrompt)
      formData.append('user_prompt', userPrompt)
      formData.append('model', selectedModel)
      formData.append('resolution', selectedResolution)
      formData.append('aspect_ratio', selectedAspectRatio)
      referenceFiles.forEach(file => {
        formData.append('image_prompts', file)
      })

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        await fetchImages()
        setGenerateError('')
        setSystemPrompt('')
        setUserPrompt('')
        previewUrls.forEach(url => URL.revokeObjectURL(url))
        setReferenceFiles([])
        setPreviewUrls([])
      } else {
        let errMsg = `生成失敗 (${response.status})`
        try {
          const errData = await response.json()
          if (errData.detail) errMsg = errData.detail
        } catch { /* ignore */ }
        setGenerateError(errMsg)
      }
    } catch (error) {
      console.error('Generate error:', error)
      setGenerateError('無法連線到後端，請確認伺服器是否啟動')
    } finally {
      setIsGenerating(false)
      void fetchStatus()
    }
  }

  /**
   * 呼叫 AI 生成標籤
   */
  const handleGenerateTag = async () => {
    if (!selectedImage) {
      alert('請先選擇一張圖片')
      return
    }

    if (!tagSystemPrompt || !tagUserPrompt) {
      alert('請填寫系統提示詞和使用者提示詞')
      return
    }

    setIsGeneratingTag(true)
    try {
      const formData = new FormData()
      formData.append('model', tagModel)
      formData.append('system_prompt', tagSystemPrompt)
      formData.append('user_prompt', tagUserPrompt)
      formData.append('image_path', selectedImage.path)

      const response = await fetch('/api/generate/text', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const tagText = data.text ?? ''
        setGeneratedTag(tagText)

        // 自動儲存 tag 到 txt 檔案
        const params = new URLSearchParams({
          image_path: selectedImage.path,
          tag_content: tagText,
        })
        await fetch(`/api/images/tag?${params}`, { method: 'POST' })
        alert('標籤生成成功！已儲存為 txt 檔案')
      } else {
        alert('標籤生成失敗')
      }
    } catch (error) {
      console.error('Generate tag error:', error)
      alert('標籤生成失敗')
    } finally {
      setIsGeneratingTag(false)
    }
  }

  /**
   * 手動儲存標籤
   */
  const handleSaveManualTag = async () => {
    if (!selectedImage) {
      alert('請先選擇一張圖片')
      return
    }

    if (!manualTag.trim()) {
      alert('請輸入標籤內容')
      return
    }

    try {
      const params = new URLSearchParams({
        image_path: selectedImage.path,
        tag_content: manualTag,
      })
      const response = await fetch(`/api/images/tag?${params}`, { method: 'POST' })

      if (response.ok) {
        setGeneratedTag(manualTag)
        alert('標籤儲存成功！')
        await fetchImages()
      } else {
        alert('標籤儲存失敗')
      }
    } catch (error) {
      console.error('Save tag error:', error)
      alert('標籤儲存失敗')
    }
  }

  /**
   * 處理箭頭繪製的點擊事件
   * 座標會轉換為原始圖片尺寸
   */
  const handleArrowClick = (e: React.MouseEvent) => {
    if (activeTab !== 'cut' || !selectedImage || !imageRef.current || editMode !== 'arrow') return
    
    const imageRect = imageRef.current.getBoundingClientRect()
    
    // 計算滑鼠相對於圖片的位置（顯示座標）
    const displayX = e.clientX - imageRect.left
    const displayY = e.clientY - imageRect.top
    
    // 限制在圖片範圍內
    const clampedDisplayX = Math.max(0, Math.min(displayX, imageRect.width))
    const clampedDisplayY = Math.max(0, Math.min(displayY, imageRect.height))
    
    // 計算縮放比例，轉換為原始圖片座標
    const scaleX = imageRef.current.naturalWidth / imageRect.width
    const scaleY = imageRef.current.naturalHeight / imageRect.height
    
    const naturalX = Math.round(clampedDisplayX * scaleX)
    const naturalY = Math.round(clampedDisplayY * scaleY)

    if (!arrowStart) {
      // 設定第一個點
      setArrowStart({ x: naturalX, y: naturalY })
      setArrowEnd(null)
    } else if (!arrowEnd) {
      // 設定第二個點
      setArrowEnd({ x: naturalX, y: naturalY })
    } else {
      // 重新開始
      setArrowStart({ x: naturalX, y: naturalY })
      setArrowEnd(null)
    }
  }

  /**
   * 清除箭頭
   */
  const clearArrow = () => {
    setArrowStart(null)
    setArrowEnd(null)
  }

  /**
   * 儲存帶有箭頭的圖片
   */
  const handleSaveArrowImage = async () => {
    if (!selectedImage || !arrowStart || !arrowEnd) {
      alert('請先選擇圖片並畫出箭頭')
      return
    }

    setIsSavingArrow(true)
    try {
      const params = new URLSearchParams({
        image_path: selectedImage.path,
        start_x: arrowStart.x.toString(),
        start_y: arrowStart.y.toString(),
        end_x: arrowEnd.x.toString(),
        end_y: arrowEnd.y.toString(),
        color: arrowColor,
      })
      const response = await fetch(`/api/images/arrow?${params}`, { method: 'POST' })

      if (response.ok) {
        clearArrow()
        
        // 判斷來源資料夾
        const isFromOriginals = selectedImage.path.startsWith('original/')
        
        if (isFromOriginals) {
          // 來自 originals，新檔案已儲存到 datasets
          alert('箭頭圖片已儲存到 Datasets！')
          await fetchImages()
        } else {
          // 來自 datasets，覆蓋原檔
          alert('箭頭已儲存到圖片！')
          setImageCacheKey(prev => prev + 1)
        }
      } else {
        alert('儲存失敗')
      }
    } catch (error) {
      console.error('Save arrow image error:', error)
      alert('儲存失敗')
    } finally {
      setIsSavingArrow(false)
    }
  }

  /**
   * 計算滑鼠相對於圖片內容的座標（考慮縮放與偏移）
   */
  const getRelativeCoords = (e: React.MouseEvent) => {
    if (!imageContainerRef.current || !imageRef.current) return null
    
    const containerRect = imageContainerRef.current.getBoundingClientRect()
    const imageRect = imageRef.current.getBoundingClientRect()
    
    // 計算圖片相對於容器的偏移
    const offsetX = imageRect.left - containerRect.left
    const offsetY = imageRect.top - containerRect.top
    
    // 計算滑鼠相對於圖片左上角的座標
    const x = e.clientX - imageRect.left
    const y = e.clientY - imageRect.top
    
    // 限制在圖片範圍內
    const clampedX = Math.max(0, Math.min(x, imageRect.width))
    const clampedY = Math.max(0, Math.min(y, imageRect.height))
    
    return { x: clampedX, y: clampedY, offsetX, offsetY, imageWidth: imageRect.width, imageHeight: imageRect.height }
  }

  /**
   * 開始繪製裁切框
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTab !== 'cut' || !selectedImage || editMode !== 'crop') return
    
    const coords = getRelativeCoords(e)
    if (!coords) return
    
    setIsDrawing(true)
    setSelection({
      startX: coords.x,
      startY: coords.y,
      endX: coords.x,
      endY: coords.y
    })
  }

  /**
   * 更新裁切框大小
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || activeTab !== 'cut') return
    
    const coords = getRelativeCoords(e)
    if (!coords || !selection) return
    
    setSelection(prev => prev ? {
      ...prev,
      endX: coords.x,
      endY: coords.y
    } : null)
  }

  /**
   * 結束繪製裁切框
   */
  const handleMouseUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    
    if (selection) {
      const width = Math.abs(selection.endX - selection.startX)
      const height = Math.abs(selection.endY - selection.startY)
      // 只有選取範圍夠大才顯示確認按鈕
      if (width > 10 && height > 10) {
        // selection 已設定，confirm-dialog 會自動顯示
      } else {
        setSelection(null)
      }
    }
  }

  /**
   * 執行圖片裁切並儲存
   */
  const handleConfirmCut = async () => {
    if (!selection || !selectedImage || !imageRef.current) return
    
    setIsCutting(true)
    try {
      const img = imageRef.current
      // 計算顯示尺寸與原始尺寸的比例
      const scaleX = img.naturalWidth / img.width
      const scaleY = img.naturalHeight / img.height
      
      // 轉換為原始圖片座標
      const x = Math.min(selection.startX, selection.endX) * scaleX
      const y = Math.min(selection.startY, selection.endY) * scaleY
      const width = Math.abs(selection.endX - selection.startX) * scaleX
      const height = Math.abs(selection.endY - selection.startY) * scaleY

      const params = new URLSearchParams({
        image_path: selectedImage.path,
        x: Math.round(x).toString(),
        y: Math.round(y).toString(),
        width: Math.round(width).toString(),
        height: Math.round(height).toString(),
      })
      const response = await fetch(`/api/images/cut?${params}`, { method: 'POST' })

      if (response.ok) {
        await fetchImages()
        alert('圖片切割成功！')
        setSelection(null)
      } else {
        alert('圖片切割失敗')
      }
    } catch (error) {
      console.error('Cut error:', error)
      alert('圖片切割失敗')
    } finally {
      setIsCutting(false)
    }
  }

  /**
   * 取消裁切
   */
  const handleCancelCut = () => {
    setSelection(null)
  }

  /**
   * 計算裁切選取框在畫面上的樣式位置
   */
  const getSelectionStyle = () => {
    if (!selection || !imageRef.current) return {}
    
    const imageRect = imageRef.current.getBoundingClientRect()
    const containerRect = imageContainerRef.current?.getBoundingClientRect()
    if (!containerRect) return {}
    
    const offsetX = imageRect.left - containerRect.left
    const offsetY = imageRect.top - containerRect.top
    
    const left = Math.min(selection.startX, selection.endX) + offsetX
    const top = Math.min(selection.startY, selection.endY) + offsetY
    const width = Math.abs(selection.endX - selection.startX)
    const height = Math.abs(selection.endY - selection.startY)
    
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`
    }
  }

  /**
   * 渲染左側檔案列表項目
   */
  const renderFileItem = (img: ImageFile) => {
    const isChecked = selectedForDelete.has(img.path)
    const isViewing = selectedImage?.path === img.path
    
    return (
      <div
        key={img.path}
        className={`file-item ${isViewing ? 'selected' : ''} ${isSelectMode && isChecked ? 'checked' : ''}`}
        onClick={() => handleImageSelect(img)}
        onMouseEnter={(e) => handleImageHover(img, e)}
        onMouseLeave={() => handleImageHover(null)}
      >
        {isSelectMode && (
          <span className={`checkbox ${isChecked ? 'checked' : ''}`}>
            {isChecked ? '✓' : ''}
          </span>
        )}
        <span className="file-name">
          <span className="file-name-text">{img.name}</span>
          {img.hasTag && (
            <span className="tag-icon" title="Has tag file">🏷️</span>
          )}
        </span>
      </div>
    )
  }

  // --- 畫面渲染 ---

  return (
    <div className="app-container">
      {/* 左側 - 檔案空間邊欄 */}
      <aside className="sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
        <div className="sidebar-header">
          <span>Files</span>
          <button 
            className={`select-mode-btn ${isSelectMode ? 'active' : ''}`}
            onClick={toggleSelectMode}
          >
            {isSelectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
        
        {/* 批次刪除工具列 */}
        {isSelectMode && selectedForDelete.size > 0 && (
          <div className="delete-bar">
            <span>{selectedForDelete.size} selected</span>
            <button 
              className="delete-btn"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
        
        {/* 原始圖片分類 */}
        <div className="folder-section">
          <div className="folder-title">
            <span>Originals ({images.originals.length})</span>
            {isSelectMode && images.originals.length > 0 && (
              <button className="select-all-btn" onClick={() => selectAllInFolder('originals')}>
                All
              </button>
            )}
          </div>
          <div className="file-list">
            {images.originals.map(renderFileItem)}
          </div>
        </div>
        
        {/* 裁切後的資料集分類 */}
        <div className="folder-section">
          <div className="folder-title">
            <span>Datasets ({images.datasets.length})</span>
            {isSelectMode && images.datasets.length > 0 && (
              <button className="select-all-btn" onClick={() => selectAllInFolder('datasets')}>
                All
              </button>
            )}
          </div>
          <div className="file-list">
            {images.datasets.map(renderFileItem)}
          </div>
        </div>
        
        <div className="sidebar-footer">
          <button className="footer-btn settings-btn" onClick={() => navigate('/settings')}>⚙</button>
          <button className="footer-btn refresh-btn" onClick={fetchImages}>Refresh</button>
        </div>
      </aside>

      {/* 左側拖曳調整把手 */}
      <div
        className="resize-handle"
        onMouseDown={(e) => {
          sidebarDrag.current = { active: true, startX: e.clientX, startWidth: sidebarWidth }
          document.body.style.cursor = 'col-resize'
          document.body.style.userSelect = 'none'
        }}
      />

      {/* 懸浮圖片預覽 (僅在非選取模式顯示) */}
      {hoveredImage && !isSelectMode && (
        <div 
          className="image-preview-tooltip"
          style={{
            left: hoverPosition.x + 15,
            top: hoverPosition.y + 15
          }}
        >
          <img src={`/api/images/${hoveredImage.path}`} alt={hoveredImage.name} />
        </div>
      )}

      {/* 中間 - 主圖片顯示與裁切區 */}
      <main className="main-content">
        <div 
          ref={imageContainerRef}
          className={`image-display ${activeTab === 'cut' && selectedImage ? 'cutting-mode' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleArrowClick}
        >
          {selectedImage ? (
            <>
              <img
                ref={imageRef}
                src={`/api/images/${selectedImage.path}?v=${imageCacheKey}`}
                alt={selectedImage.name}
                className="displayed-image"
                draggable={false}
              />
              {/* 裁切選取框 */}
              {selection && (
                <div 
                  className="selection-box"
                  style={getSelectionStyle()}
                />
              )}
              {/* 箭頭繪製 - SVG 覆蓋層 */}
              {activeTab === 'cut' && (arrowStart || arrowEnd) && imageRef.current && (
                <svg 
                  className="arrow-overlay"
                  style={{
                    position: 'absolute',
                    top: imageRef.current.offsetTop,
                    left: imageRef.current.offsetLeft,
                    width: imageRef.current.offsetWidth,
                    height: imageRef.current.offsetHeight,
                    pointerEvents: 'none'
                  }}
                >
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
                    </marker>
                  </defs>
                  {/* 起點標記 */}
                  {arrowStart && (
                    <circle
                      cx={`${(arrowStart.x / imageRef.current.naturalWidth) * 100}%`}
                      cy={`${(arrowStart.y / imageRef.current.naturalHeight) * 100}%`}
                      r="6"
                      fill={arrowColor}
                    />
                  )}
                  {/* 箭頭線 */}
                  {arrowStart && arrowEnd && (
                    <line
                      x1={`${(arrowStart.x / imageRef.current.naturalWidth) * 100}%`}
                      y1={`${(arrowStart.y / imageRef.current.naturalHeight) * 100}%`}
                      x2={`${(arrowEnd.x / imageRef.current.naturalWidth) * 100}%`}
                      y2={`${(arrowEnd.y / imageRef.current.naturalHeight) * 100}%`}
                      stroke={arrowColor}
                      strokeWidth="3"
                      markerEnd="url(#arrowhead)"
                    />
                  )}
                </svg>
              )}
            </>
          ) : (
            <div className="placeholder">
              <p>Select an image</p>
            </div>
          )}
        </div>

        {/* 裁切 / 箭頭 確認浮動視窗 */}
        {activeTab === 'cut' && editMode === 'crop' && selection && (
          <div className="confirm-dialog">
            <p>Confirm crop this area?</p>
            <div className="confirm-buttons">
              <button onClick={handleConfirmCut} disabled={isCutting}>
                {isCutting ? 'Processing...' : 'Confirm'}
              </button>
              <button onClick={handleCancelCut} disabled={isCutting}>Cancel</button>
            </div>
          </div>
        )}
        {activeTab === 'cut' && editMode === 'arrow' && arrowStart && arrowEnd && (
          <div className="confirm-dialog">
            <p>Save arrow to image?</p>
            <div className="confirm-buttons">
              <button onClick={handleSaveArrowImage} disabled={isSavingArrow}>
                {isSavingArrow ? 'Saving...' : 'Confirm'}
              </button>
              <button onClick={clearArrow} disabled={isSavingArrow}>Cancel</button>
            </div>
          </div>
        )}

      </main>

      {/* 右側拖曳調整把手 */}
      <div
        className="resize-handle"
        onMouseDown={(e) => {
          panelDrag.current = { active: true, startX: e.clientX, startWidth: panelWidth }
          document.body.style.cursor = 'col-resize'
          document.body.style.userSelect = 'none'
        }}
      />

      {/* 右側 - 功能控制面板 */}
      <aside className="function-panel" style={{ width: panelWidth, minWidth: panelWidth }}>
        {/* 功能分頁切換 */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            Image
          </button>
          <button 
            className={`tab ${activeTab === 'cut' ? 'active' : ''}`}
            onClick={() => setActiveTab('cut')}
          >
            Edit
          </button>
          <button 
            className={`tab ${activeTab === 'other' ? 'active' : ''}`}
            onClick={() => setActiveTab('other')}
          >
            Tag
          </button>
        </div>

        <div className="tab-content">
          {/* 分頁 1: 圖片生成 */}
          {activeTab === 'generate' && (
            <div className="generate-panel">
              {/* Model 選擇 */}
              <div className="form-group">
                <label className="panel-section-label">Model</label>
                <div className="select-wrapper">
                  <select
                    className="model-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <optgroup label="Gemini (Cloud)">
                      <option value="gemini-3-pro-image-preview">
                        Nano Banana Pro
                      </option>
                      <option value="gemini-3.1-flash-image-preview">
                        Nano Banana 2
                      </option>
                    </optgroup>
                    <optgroup label="FLUX (Local)">
                      <option value="black-forest-labs/FLUX.2-klein-4B">
                        FLUX.2 Klein 4B
                      </option>
                      <option value="black-forest-labs/FLUX.2-klein-9B">
                        FLUX.2 Klein 9B
                      </option>
                    </optgroup>
                  </select>
                  <span className="select-arrow">▾</span>
                </div>
              </div>

              {/* Resolution & Aspect Ratio 並排 */}
              <div className="config-row">
                <div className="form-group flex-1">
                  <label className="panel-section-label">Resolution</label>
                  <div className="select-wrapper">
                    <select
                      className="model-select"
                      value={selectedResolution}
                      onChange={(e) => setSelectedResolution(e.target.value)}
                    >
                      <option value="512">512</option>
                      <option value="1K">1K</option>
                      <option value="2K">2K</option>
                      <option value="4K">4K</option>
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                </div>
                <div className="form-group flex-1">
                  <label className="panel-section-label">Aspect Ratio</label>
                  <div className="select-wrapper">
                    <select
                      className="model-select"
                      value={selectedAspectRatio}
                      onChange={(e) => setSelectedAspectRatio(e.target.value)}
                    >
                      <option value="1:1">1 : 1</option>
                      <option value="16:9">16 : 9</option>
                      <option value="9:16">9 : 16</option>
                      <option value="4:3">4 : 3</option>
                      <option value="3:4">3 : 4</option>
                    </select>
                    <span className="select-arrow">▾</span>
                  </div>
                </div>
              </div>

              {/* 系統狀態 */}
              <div className="status-block">
                {systemStatus ? (
                  systemStatus.mode === 'GPU' ? (
                    <>
                      <div className="status-row">
                        <span className="status-badge gpu">GPU</span>
                        <span className="status-device">{systemStatus.device}</span>
                      </div>
                      <div className="status-mem">
                        <span className="status-mem-label">VRAM</span>
                        <div className="status-mem-bar-wrap">
                          <div 
                            className="status-mem-bar"
                            style={{
                              width: `${Math.min(100, (parseFloat(systemStatus.used_memory) / parseFloat(systemStatus.total_memory)) * 100)}%`
                            }}
                          />
                        </div>
                        <span className="status-mem-text">
                          {systemStatus.used_memory} / {systemStatus.total_memory}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="status-row">
                      <span className="status-badge cpu">CPU</span>
                      <span className="status-device">No CUDA device</span>
                    </div>
                  )
                ) : (
                  <div className="status-row">
                    <span className="status-device">Connecting...</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="panel-section-label">System Prompt <span className="required-mark">*</span></label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => { setSystemPrompt(e.target.value); setGenerateError('') }}
                  placeholder="Enter system prompt..."
                  rows={3}
                  className={!systemPrompt.trim() && generateError ? 'input-error' : ''}
                />
              </div>
              
              <div className="form-group">
                <label className="panel-section-label">User Prompt <span className="required-mark">*</span></label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => { setUserPrompt(e.target.value); setGenerateError('') }}
                  placeholder="Enter user prompt..."
                  rows={3}
                  className={!userPrompt.trim() && generateError ? 'input-error' : ''}
                />
              </div>
              
              <div className="form-group">
                <label className="panel-section-label">Reference Images</label>
                <div 
                  className="drop-zone"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <p>Drop images here</p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    id="file-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="file-input" className="file-input-label">
                    Browse
                  </label>
                </div>
                
                {/* 參考圖片預覽網格 */}
                {referenceFiles.length > 0 && (
                  <div className="reference-files-grid">
                    {referenceFiles.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${index}`} className="reference-file-preview">
                        <img src={previewUrls[index] || ''} alt={file.name} />
                        <button className="remove-btn" onClick={() => removeReferenceFile(index)}>×</button>
                        <span className="file-name-overlay">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {generateError && (
                <div className="generate-error">{generateError}</div>
              )}

              <button 
                className="generate-btn"
                onClick={handleGenerate}
                disabled={isGenerating || (!systemPrompt.trim() && !userPrompt.trim() && !generateError)}
              >
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </button>
            </div>
          )}

          {/* 分頁 2: 編輯 (裁切/箭頭) */}
          {activeTab === 'cut' && (
            <div className="cut-panel">
              {selectedImage ? (
                <>
                  <p className="info">Current: {selectedImage.name}</p>
                  
                  {/* 模式切換 */}
                  <div className="edit-mode-toggle">
                    <label className="panel-section-label">Edit Mode</label>
                    <div className="toggle-buttons">
                      <button 
                        className={`toggle-btn ${editMode === 'crop' ? 'active' : ''}`}
                        onClick={() => { setEditMode('crop'); setArrowStart(null); setArrowEnd(null); }}
                      >
                        Crop
                      </button>
                      <button 
                        className={`toggle-btn ${editMode === 'arrow' ? 'active' : ''}`}
                        onClick={() => { setEditMode('arrow'); setSelection(null); }}
                      >
                        Arrow
                      </button>
                    </div>
                  </div>
                  
                  {editMode === 'crop' ? (
                    /* 裁切模式 */
                    <div className="crop-section">
                      <p className="instruction">Drag on image to select crop area</p>
                      <div className="selection-info">
                        <span>Width: {selection ? `${Math.round(Math.abs(selection.endX - selection.startX))}px` : '-'}</span>
                        <span>Height: {selection ? `${Math.round(Math.abs(selection.endY - selection.startY))}px` : '-'}</span>
                      </div>
                    </div>
                  ) : (
                    /* 箭頭模式 */
                    <div className="arrow-section">
                      <p className="instruction">Click on image to set points</p>
                      <div className="arrow-color-row">
                        <span className="arrow-color-label">Color</span>
                        <label className="arrow-color-swatch-wrap" title="Pick arrow color">
                          <span className="arrow-color-dot" style={{ background: arrowColor }} />
                          <input
                            type="color"
                            className="arrow-color-picker-hidden"
                            value={arrowColor}
                            onChange={e => setArrowColor(e.target.value)}
                          />
                        </label>
                        <span className="arrow-color-hex">{arrowColor.toUpperCase()}</span>
                      </div>
                      <div className="arrow-status-row">
                        <span>Start: {arrowStart ? `(${Math.round(arrowStart.x)}, ${Math.round(arrowStart.y)})` : '-'}</span>
                        <span>End: {arrowEnd ? `(${Math.round(arrowEnd.x)}, ${Math.round(arrowEnd.y)})` : '-'}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="warning">Select an image first</p>
              )}
            </div>
          )}

          {/* 分頁 3: 標籤生成 */}
          {activeTab === 'other' && (
            <div className="tag-panel">
              {selectedImage ? (
                <>
                  <p className="info">Current: {selectedImage.name}</p>
                  
                  {/* 標籤模式切換 */}
                  <div className="tag-mode-toggle">
                    <label className="panel-section-label">Tag Mode</label>
                    <div className="toggle-buttons">
                      <button 
                        className={`toggle-btn ${!isManualTagMode ? 'active' : ''}`}
                        onClick={() => setIsManualTagMode(false)}
                      >
                        AI Generate
                      </button>
                      <button 
                        className={`toggle-btn ${isManualTagMode ? 'active' : ''}`}
                        onClick={() => setIsManualTagMode(true)}
                      >
                        Manual Input
                      </button>
                    </div>
                  </div>
                  
                  {isManualTagMode ? (
                    /* 手動輸入模式 */
                    <>
                      <div className="form-group">
                        <label className="panel-section-label">Tag Content</label>
                        <textarea
                          value={manualTag}
                          onChange={(e) => setManualTag(e.target.value)}
                          placeholder="Enter tag content manually..."
                          rows={5}
                        />
                      </div>
                      
                      <button 
                        className="generate-btn"
                        onClick={handleSaveManualTag}
                        disabled={!manualTag.trim()}
                      >
                        Save Tag
                      </button>
                    </>
                  ) : (
                    /* AI 生成模式 */
                    <>
                      {/* Tag Model 選擇 */}
                      <div className="form-group">
                        <label className="panel-section-label">Model</label>
                        <div className="select-wrapper">
                          <select
                            className="model-select"
                            value={tagModel}
                            onChange={(e) => setTagModel(e.target.value)}
                          >
                            <optgroup label="Gemini (Cloud)">
                              <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                            </optgroup>
                            <optgroup label="GPT (Cloud)">
                              <option value="gpt-5.4-2026-03-05">GPT-5.4</option>
                              <option value="gpt-5.4-mini-2026-03-17">GPT-5.4 Mini</option>
                            </optgroup>
                          </select>
                          <span className="select-arrow">▾</span>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="panel-section-label">System Prompt</label>
                        <textarea
                          value={tagSystemPrompt}
                          onChange={(e) => setTagSystemPrompt(e.target.value)}
                          placeholder="Enter system prompt..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label className="panel-section-label">User Prompt</label>
                        <textarea
                          value={tagUserPrompt}
                          onChange={(e) => setTagUserPrompt(e.target.value)}
                          placeholder="Enter user prompt..."
                          rows={3}
                        />
                      </div>
                      
                      <button 
                        className="generate-btn"
                        onClick={handleGenerateTag}
                        disabled={isGeneratingTag}
                      >
                        {isGeneratingTag ? 'Generating...' : 'Generate Tag'}
                      </button>
                    </>
                  )}
                  
                  {generatedTag && (
                    <div className="generated-tag-result">
                      <label>Current Tag:</label>
                      <div className="tag-output">{generatedTag}</div>
                    </div>
                  )}
                </>
              ) : (
                <p className="warning">Select an image first</p>
              )}
            </div>
          )}
        </div>
      </aside>

    </div>
  )
}

export default App
