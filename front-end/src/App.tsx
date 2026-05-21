import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import './App.css'
import type { ImageFile, ImageList, SelectionBox, ActiveTab } from './types'
import { FLUX_MODELS, GPT_IMAGE_MODELS } from './lib/constants'
import { formatApiError } from './lib/formatApiError'
import { readPersistedPanel, writePersistedPanel } from './lib/panelStorage'
import { useSystemStatus } from './hooks/useSystemStatus'
import Sidebar from './components/Sidebar'
import ImageViewer from './components/ImageViewer'
import FunctionPanel from './components/FunctionPanel'
import SettingsModal from './components/SettingsModal'

function App() {
  const persisted = useMemo(() => readPersistedPanel(), [])

  // --- 狀態管理 ---
  
  const [images, setImages] = useState<ImageList>({ originals: [], datasets: [] })
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null)
  const [imageCacheKey, setImageCacheKey] = useState(0)
  const [hoveredImage, setHoveredImage] = useState<ImageFile | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [activeTab, setActiveTab] = useState<ActiveTab>(persisted.activeTab ?? 'generate')
  
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
  const [referenceFiles, setReferenceFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFluxLoaded, setIsFluxLoaded] = useState(false)
  const [isFluxLoading, setIsFluxLoading] = useState(false)
  const [isFluxClosing, setIsFluxClosing] = useState(false)

  const isFluxModel = FLUX_MODELS.has(selectedModel)
  
  const [isDrawing, setIsDrawing] = useState(false)
  const [selection, setSelection] = useState<SelectionBox | null>(null)
  const [isCutting, setIsCutting] = useState(false)
  
  const [tagSystemPrompt, setTagSystemPrompt] = useState(persisted.tagSystemPrompt ?? '')
  const [tagUserPrompt, setTagUserPrompt] = useState(persisted.tagUserPrompt ?? '')
  const [generatedTag, setGeneratedTag] = useState(persisted.generatedTag ?? '')
  const [isGeneratingTag, setIsGeneratingTag] = useState(false)
  const [isManualTagMode, setIsManualTagMode] = useState(persisted.isManualTagMode ?? false)
  const [tagModel, setTagModel] = useState(persisted.tagModel ?? 'gemini-3-flash-preview')
  const [manualTag, setManualTag] = useState(persisted.manualTag ?? '')
  
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null)
  const [arrowEnd, setArrowEnd] = useState<{ x: number; y: number } | null>(null)
  const [isSavingArrow, setIsSavingArrow] = useState(false)
  const [arrowColor, setArrowColor] = useState(persisted.arrowColor ?? '#ff0000')
  
  const [editMode, setEditMode] = useState<'crop' | 'arrow'>(persisted.editMode ?? 'crop')

  const [isImporting, setIsImporting] = useState(false)

  const importInputRef = useRef<HTMLInputElement>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const {
    systemStatus,
    fetchStatus,
    memNow,
    memMax,
    memFree,
    memTotal,
    usedMemoryPct,
  } = useSystemStatus(isGenerating, isFluxModel)

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

  // 初始化載入
  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  // 切換離開 FLUX 模型時重置載入狀態
  useEffect(() => {
    if (!isFluxModel) {
      setIsFluxLoaded(false)
    }
  }, [isFluxModel])

  useEffect(() => {
    writePersistedPanel({
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setIsImporting(true)
    try {
      const formData = new FormData()
      Array.from(e.target.files).forEach(file => formData.append('files', file))
      const response = await fetch('/api/images/import', { method: 'POST', body: formData })
      if (response.ok) {
        await fetchImages()
      } else {
        console.error('Import failed:', response.status)
      }
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
      if (e.target) e.target.value = ''
    }
  }

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
        console.error('Delete failed:', response.status)
      }
    } catch (error) {
      console.error('Delete error:', error)
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

  const handleFluxLoad = async () => {
    setIsFluxLoading(true)
    setGenerateError('')
    try {
      const params = new URLSearchParams({ model_name: selectedModel })
      const response = await fetch(`/api/flux/load?${params}`, { method: 'POST' })
      if (response.ok) {
        setIsFluxLoaded(true)
        void fetchStatus()
      } else {
        let errMsg = `FLUX 載入失敗 (${response.status})`
        try {
          const errData = await response.json()
          if (errData.detail) errMsg = errData.detail
        } catch { /* ignore */ }
        setGenerateError(errMsg)
        setIsFluxLoaded(false)
      }
    } catch (error) {
      console.error('FLUX load error:', error)
      setGenerateError('無法連線到後端，請確認伺服器是否啟動')
      setIsFluxLoaded(false)
    } finally {
      setIsFluxLoading(false)
    }
  }

  const handleFluxClose = async () => {
    setIsFluxClosing(true)
    setGenerateError('')
    try {
      const response = await fetch('/api/flux/close', { method: 'POST' })
      if (response.ok) {
        setIsFluxLoaded(false)
        void fetchStatus()
      } else {
        let errMsg = `FLUX 卸載失敗 (${response.status})`
        try {
          const errData = await response.json()
          if (errData.detail) errMsg = errData.detail
        } catch { /* ignore */ }
        setGenerateError(errMsg)
      }
    } catch (error) {
      console.error('FLUX close error:', error)
      setGenerateError('無法連線到後端，請確認伺服器是否啟動')
    } finally {
      setIsFluxClosing(false)
    }
  }

  const handleGenerate = async () => {
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      setGenerateError('System Prompt 和 User Prompt 為必填')
      return
    }
    if (isFluxModel && !isFluxLoaded) {
      setGenerateError('請先按 Load 載入 FLUX 模型')
      return
    }
    setGenerateError('')
    setIsGenerating(true)
    try {
      const params = new URLSearchParams({
        model_name: selectedModel,
        resolution: selectedResolution,
        aspect_ratio: selectedAspectRatio,
        system_prompt: systemPrompt,
        user_prompt: userPrompt,
      })
      referenceFiles.forEach(file => params.append('image_prompts', file.name))

      let response: Response
      if (isFluxModel) {
        response = await fetch(`/api/flux/image?${params}`, { method: 'POST' })
      } else if (GPT_IMAGE_MODELS.has(selectedModel)) {
        response = await fetch(`/api/chatgpt/image?${params}`, { method: 'POST' })
      } else {
        response = await fetch(`/api/gemini/image?${params}`, { method: 'POST' })
      }

      if (response.ok) {
        const data = await response.json()
        await fetchImages()
        if (data.path) {
          const name = String(data.path).split('/').pop() ?? String(data.path)
          setSelectedImage({ name, path: data.path, hasTag: false })
          setImageCacheKey(prev => prev + 1)
        }
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
          errMsg = formatApiError(errData.detail, errMsg)
        } catch { /* ignore */ }
        setGenerateError(errMsg)
      }
    } catch (error) {
      console.error('Generate error:', error)
      setGenerateError('無法連線到後端，請確認伺服器是否啟動')
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * 呼叫 AI 生成標籤
   */
  const handleGenerateTag = async () => {
    if (!selectedImage || !tagSystemPrompt || !tagUserPrompt) return

    setIsGeneratingTag(true)
    try {
      const textParams = new URLSearchParams({
        model_name: tagModel,
        system_prompt: tagSystemPrompt,
        user_prompt: tagUserPrompt,
        image_prompts: selectedImage.path,
      })
      const endpoint = tagModel.startsWith('gemini') ? '/api/gemini/text' : '/api/chatgpt/text'
      const response = await fetch(`${endpoint}?${textParams}`, { method: 'POST' })

      if (response.ok) {
        const data = await response.json()
        const tagText = data.text ?? ''
        setGeneratedTag(tagText)

        // 自動儲存 tag 到 txt 檔案
        const params = new URLSearchParams({
          image_path: selectedImage.path,
          content: tagText,
        })
        await fetch(`/api/tags?${params}`, { method: 'POST' })
        await fetchImages()
      } else {
        console.error('Generate tag failed:', response.status)
      }
    } catch (error) {
      console.error('Generate tag error:', error)
    } finally {
      setIsGeneratingTag(false)
    }
  }

  /**
   * 手動儲存標籤
   */
  const handleSaveManualTag = async () => {
    if (!selectedImage || !manualTag.trim()) return

    try {
      const params = new URLSearchParams({
        image_path: selectedImage.path,
        content: manualTag,
      })
      const response = await fetch(`/api/tags?${params}`, { method: 'POST' })

      if (response.ok) {
        setGeneratedTag(manualTag)
        await fetchImages()
      } else {
        console.error('Save tag failed:', response.status)
      }
    } catch (error) {
      console.error('Save tag error:', error)
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

  const handleSaveArrowImage = async () => {
    if (!selectedImage || !arrowStart || !arrowEnd) return
    await saveArrowImage(arrowStart, arrowEnd)
  }

  const saveArrowImage = async (
    start: { x: number; y: number },
    end: { x: number; y: number },
  ) => {
    if (!selectedImage) return

    setIsSavingArrow(true)
    try {
      const params = new URLSearchParams({
        image_path: selectedImage.path,
        start_x: start.x.toString(),
        start_y: start.y.toString(),
        end_x: end.x.toString(),
        end_y: end.y.toString(),
        color: arrowColor,
      })
      const response = await fetch(`/api/images/arrow?${params}`, { method: 'POST' })

      if (response.ok) {
        clearArrow()
        const isFromOriginals = selectedImage.path.startsWith('original/')
        if (isFromOriginals) {
          await fetchImages()
        } else {
          setImageCacheKey(prev => prev + 1)
        }
      } else {
        console.error('Save arrow failed:', response.status)
      }
    } catch (error) {
      console.error('Save arrow image error:', error)
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
      if (width <= 10 || height <= 10) {
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
        setSelection(null)
      } else {
        console.error('Cut failed:', response.status)
      }
    } catch (error) {
      console.error('Cut error:', error)
    } finally {
      setIsCutting(false)
    }
  }

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


  return (
    <div className="app-container">
      <Sidebar
        width={sidebarWidth}
        images={images}
        isSelectMode={isSelectMode}
        selectedForDelete={selectedForDelete}
        selectedImage={selectedImage}
        isImporting={isImporting}
        isDeleting={isDeleting}
        importInputRef={importInputRef}
        onImport={handleImport}
        onToggleSelectMode={toggleSelectMode}
        onDeleteSelected={handleDeleteSelected}
        onSelectAllInFolder={selectAllInFolder}
        onImageSelect={handleImageSelect}
        onImageHover={handleImageHover}
        onRefresh={fetchImages}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

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
          <img src={`/api/images/${hoveredImage.path}?preview=1`} alt={hoveredImage.name} />
        </div>
      )}

      <ImageViewer
        activeTab={activeTab}
        editMode={editMode}
        selectedImage={selectedImage}
        imageCacheKey={imageCacheKey}
        isGenerating={isGenerating}
        isCutting={isCutting}
        isSavingArrow={isSavingArrow}
        selection={selection}
        arrowStart={arrowStart}
        arrowEnd={arrowEnd}
        arrowColor={arrowColor}
        imageContainerRef={imageContainerRef}
        imageRef={imageRef}
        getSelectionStyle={getSelectionStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onArrowClick={handleArrowClick}
        onConfirmCut={handleConfirmCut}
        onCancelCut={handleCancelCut}
        onSaveArrow={handleSaveArrowImage}
        onClearArrow={clearArrow}
      />

      {/* 右側拖曳調整把手 */}
      <div
        className="resize-handle"
        onMouseDown={(e) => {
          panelDrag.current = { active: true, startX: e.clientX, startWidth: panelWidth }
          document.body.style.cursor = 'col-resize'
          document.body.style.userSelect = 'none'
        }}
      />

      <FunctionPanel
        width={panelWidth}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        generate={{
          selectedModel,
          selectedResolution,
          selectedAspectRatio,
          systemPrompt,
          userPrompt,
          referenceFiles,
          previewUrls,
          generateError,
          isGenerating,
          isFluxModel,
          isFluxLoaded,
          isFluxLoading,
          isFluxClosing,
          systemStatus,
          memNow,
          memMax,
          memFree,
          memTotal,
          usedMemoryPct,
          onModelChange: setSelectedModel,
          onResolutionChange: setSelectedResolution,
          onAspectRatioChange: setSelectedAspectRatio,
          onSystemPromptChange: v => { setSystemPrompt(v); setGenerateError('') },
          onUserPromptChange: v => { setUserPrompt(v); setGenerateError('') },
          onFluxLoad: handleFluxLoad,
          onFluxClose: handleFluxClose,
          onDragOver: handleDragOver,
          onDrop: handleDrop,
          onFileInput: handleFileInput,
          onRemoveReference: removeReferenceFile,
          onGenerate: handleGenerate,
        }}
        edit={{
          selectedImage,
          editMode,
          selection,
          arrowStart,
          arrowEnd,
          arrowColor,
          onEditModeChange: mode => {
            setEditMode(mode)
            if (mode === 'crop') { setArrowStart(null); setArrowEnd(null) }
            else setSelection(null)
          },
          onArrowColorChange: setArrowColor,
          onClearCrop: () => setSelection(null),
          onClearArrow: clearArrow,
        }}
        tag={{
          selectedImage,
          isManualTagMode,
          manualTag,
          tagModel,
          tagSystemPrompt,
          tagUserPrompt,
          generatedTag,
          isGeneratingTag,
          onManualTagModeChange: setIsManualTagMode,
          onManualTagChange: setManualTag,
          onTagModelChange: setTagModel,
          onTagSystemPromptChange: setTagSystemPrompt,
          onTagUserPromptChange: setTagUserPrompt,
          onSaveManualTag: handleSaveManualTag,
          onGenerateTag: handleGenerateTag,
        }}
      />

      <SettingsModal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} />


    </div>
  )
}

export default App
