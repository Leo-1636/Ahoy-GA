import type { RefObject } from 'react'
import type { ImageFile, ImageList } from '../types'

interface SidebarProps {
  width: number
  images: ImageList
  isSelectMode: boolean
  selectedForDelete: Set<string>
  selectedImage: ImageFile | null
  isImporting: boolean
  isDeleting: boolean
  importInputRef: RefObject<HTMLInputElement | null>
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void
  onToggleSelectMode: () => void
  onDeleteSelected: () => void
  onSelectAllInFolder: (folder: 'originals' | 'datasets') => void
  onImageSelect: (image: ImageFile) => void
  onImageHover: (image: ImageFile | null, e?: React.MouseEvent) => void
  onRefresh: () => void
  onOpenSettings: () => void
}

export default function Sidebar({
  width,
  images,
  isSelectMode,
  selectedForDelete,
  selectedImage,
  isImporting,
  isDeleting,
  importInputRef,
  onImport,
  onToggleSelectMode,
  onDeleteSelected,
  onSelectAllInFolder,
  onImageSelect,
  onImageHover,
  onRefresh,
  onOpenSettings,
}: SidebarProps) {
  const renderFileItem = (img: ImageFile) => {
    const isChecked = selectedForDelete.has(img.path)
    const isViewing = selectedImage?.path === img.path
    return (
      <div
        key={img.path}
        className={`file-item ${isViewing ? 'selected' : ''} ${isSelectMode && isChecked ? 'checked' : ''}`}
        onClick={() => onImageSelect(img)}
        onMouseEnter={e => onImageHover(img, e)}
        onMouseLeave={() => onImageHover(null)}
      >
        {isSelectMode && (
          <span className={`checkbox ${isChecked ? 'checked' : ''}`}>{isChecked ? '✓' : ''}</span>
        )}
        <span className="file-name">
          <span className="file-name-text">{img.name}</span>
          {img.hasTag && <span className="tag-icon" title="Has tag file">🏷️</span>}
        </span>
      </div>
    )
  }

  return (
    <aside className="sidebar" style={{ width, minWidth: width }}>
      <div className="sidebar-brand">Ahoy-GA</div>
      <input
        ref={importInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onImport}
        style={{ display: 'none' }}
      />
      <div className="sidebar-header">
        <span>Files</span>
        <div className="sidebar-header-actions">
          <button
            type="button"
            className={`sidebar-icon-btn ${isSelectMode ? 'active' : ''}`}
            onClick={onToggleSelectMode}
            title={isSelectMode ? '取消選取' : '選取模式'}
            aria-label={isSelectMode ? '取消選取' : '選取模式'}
          >
            {isSelectMode ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="sidebar-icon-btn"
            onClick={onRefresh}
            title="重新整理"
            aria-label="重新整理"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
          </button>
        </div>
      </div>
      {isSelectMode && selectedForDelete.size > 0 && (
        <div className="delete-bar">
          <span>{selectedForDelete.size} selected</span>
          <button type="button" className="delete-btn" onClick={onDeleteSelected} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      )}
      <div className="folder-section">
        <div className="folder-title">
          <span>Originals ({images.originals.length})</span>
          {isSelectMode && images.originals.length > 0 && (
            <button type="button" className="select-all-btn" onClick={() => onSelectAllInFolder('originals')}>
              All
            </button>
          )}
        </div>
        <div className="file-list">{images.originals.map(renderFileItem)}</div>
      </div>
      <div className="folder-section">
        <div className="folder-title">
          <span>Datasets ({images.datasets.length})</span>
          {isSelectMode && images.datasets.length > 0 && (
            <button type="button" className="select-all-btn" onClick={() => onSelectAllInFolder('datasets')}>
              All
            </button>
          )}
        </div>
        <div className="file-list">{images.datasets.map(renderFileItem)}</div>
      </div>
      <div className="sidebar-footer">
        <button
          type="button"
          className="footer-btn settings-btn"
          onClick={onOpenSettings}
          title="設定"
          aria-label="設定"
        >
          ⚙
        </button>
        <button
          type="button"
          className="footer-btn import-btn"
          onClick={() => importInputRef.current?.click()}
          disabled={isImporting}
          title={isImporting ? '匯入中…' : '匯入圖片'}
          aria-label="匯入圖片"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v12" />
            <path d="M8 11l4 4 4-4" />
            <path d="M4 21h16" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
