import type { ImageFile, SelectionBox } from '../types'

interface EditPanelProps {
  selectedImage: ImageFile | null
  editMode: 'crop' | 'arrow'
  selection: SelectionBox | null
  arrowStart: { x: number; y: number } | null
  arrowEnd: { x: number; y: number } | null
  arrowColor: string
  onEditModeChange: (mode: 'crop' | 'arrow') => void
  onArrowColorChange: (color: string) => void
  onClearCrop: () => void
  onClearArrow: () => void
}

export default function EditPanel({
  selectedImage,
  editMode,
  selection,
  arrowStart,
  arrowEnd,
  arrowColor,
  onEditModeChange,
  onArrowColorChange,
  onClearCrop,
  onClearArrow,
}: EditPanelProps) {
  if (!selectedImage) {
    return (
      <div className="cut-panel">
        <p className="warning">Select an image first</p>
      </div>
    )
  }

  return (
    <div className="cut-panel">
      <p className="info">Current: {selectedImage.name}</p>
      <div className="edit-mode-toggle">
        <label className="panel-section-label">Edit Mode</label>
        <div className="toggle-buttons">
          <button
            type="button"
            className={`toggle-btn ${editMode === 'crop' ? 'active' : ''}`}
            onClick={() => { onEditModeChange('crop'); onClearArrow() }}
          >
            Crop
          </button>
          <button
            type="button"
            className={`toggle-btn ${editMode === 'arrow' ? 'active' : ''}`}
            onClick={() => { onEditModeChange('arrow'); onClearCrop() }}
          >
            Arrow
          </button>
        </div>
      </div>
      {editMode === 'crop' ? (
        <div className="crop-section">
          <p className="instruction">Drag on image to select crop area</p>
          <div className="selection-info">
            <span>Width: {selection ? `${Math.round(Math.abs(selection.endX - selection.startX))}px` : '-'}</span>
            <span>Height: {selection ? `${Math.round(Math.abs(selection.endY - selection.startY))}px` : '-'}</span>
          </div>
        </div>
      ) : (
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
                onChange={e => onArrowColorChange(e.target.value)}
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
    </div>
  )
}
