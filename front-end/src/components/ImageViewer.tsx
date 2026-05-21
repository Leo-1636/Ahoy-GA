import type { RefObject } from 'react'
import type { ImageFile, SelectionBox, ActiveTab } from '../types'

interface ImageViewerProps {
  activeTab: ActiveTab
  editMode: 'crop' | 'arrow'
  selectedImage: ImageFile | null
  imageCacheKey: number
  isGenerating: boolean
  isCutting: boolean
  isSavingArrow: boolean
  selection: SelectionBox | null
  arrowStart: { x: number; y: number } | null
  arrowEnd: { x: number; y: number } | null
  arrowColor: string
  imageContainerRef: RefObject<HTMLDivElement | null>
  imageRef: RefObject<HTMLImageElement | null>
  getSelectionStyle: () => React.CSSProperties
  onMouseDown: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseUp: () => void
  onArrowClick: (e: React.MouseEvent) => void
  onConfirmCut: () => void
  onCancelCut: () => void
  onSaveArrow: () => void
  onClearArrow: () => void
}

export default function ImageViewer({
  activeTab,
  editMode,
  selectedImage,
  imageCacheKey,
  isGenerating,
  isCutting,
  isSavingArrow,
  selection,
  arrowStart,
  arrowEnd,
  arrowColor,
  imageContainerRef,
  imageRef,
  getSelectionStyle,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onArrowClick,
  onConfirmCut,
  onCancelCut,
  onSaveArrow,
  onClearArrow,
}: ImageViewerProps) {
  return (
    <main className="main-content">
      <div
        ref={imageContainerRef}
        className={`image-display ${activeTab === 'cut' && selectedImage ? 'cutting-mode' : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={onArrowClick}
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
            {selection && <div className="selection-box" style={getSelectionStyle()} />}
            {activeTab === 'cut' && (arrowStart || arrowEnd) && imageRef.current && (
              <svg
                className="arrow-overlay"
                style={{
                  position: 'absolute',
                  top: imageRef.current.offsetTop,
                  left: imageRef.current.offsetLeft,
                  width: imageRef.current.offsetWidth,
                  height: imageRef.current.offsetHeight,
                  pointerEvents: 'none',
                }}
              >
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill={arrowColor} />
                  </marker>
                </defs>
                {arrowStart && (
                  <circle
                    cx={`${(arrowStart.x / imageRef.current.naturalWidth) * 100}%`}
                    cy={`${(arrowStart.y / imageRef.current.naturalHeight) * 100}%`}
                    r="6"
                    fill={arrowColor}
                  />
                )}
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
            <p>{isGenerating ? 'Generating image...' : 'Select an image'}</p>
          </div>
        )}
        {(isGenerating || isCutting || isSavingArrow) && (
          <div className="generating-overlay">
            <span>
              {isGenerating ? 'Generating...' : isCutting ? 'Processing...' : 'Saving...'}
            </span>
          </div>
        )}
      </div>
      {activeTab === 'cut' && editMode === 'crop' && selection && (
        <div className="confirm-dialog">
          <p>Confirm crop this area?</p>
          <div className="confirm-buttons">
            <button type="button" onClick={onConfirmCut} disabled={isCutting}>
              {isCutting ? 'Processing...' : 'Confirm'}
            </button>
            <button type="button" onClick={onCancelCut} disabled={isCutting}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {activeTab === 'cut' && editMode === 'arrow' && arrowStart && arrowEnd && (
        <div className="confirm-dialog">
          <p>Save arrow to image?</p>
          <div className="confirm-buttons">
            <button type="button" onClick={onSaveArrow} disabled={isSavingArrow}>
              {isSavingArrow ? 'Saving...' : 'Confirm'}
            </button>
            <button type="button" onClick={onClearArrow} disabled={isSavingArrow}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
