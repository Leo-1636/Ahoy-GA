import GpuStatusBlock from './GpuStatusBlock'
import type { SystemStatus } from '../types'

export interface GeneratePanelProps {
  selectedModel: string
  selectedResolution: string
  selectedAspectRatio: string
  systemPrompt: string
  userPrompt: string
  referenceFiles: File[]
  previewUrls: string[]
  generateError: string
  isGenerating: boolean
  isFluxModel: boolean
  isFluxLoaded: boolean
  isFluxLoading: boolean
  isFluxClosing: boolean
  systemStatus: SystemStatus | null
  memNow: string
  memMax: string
  memFree: string
  memTotal: string
  usedMemoryPct: number
  onModelChange: (v: string) => void
  onResolutionChange: (v: string) => void
  onAspectRatioChange: (v: string) => void
  onSystemPromptChange: (v: string) => void
  onUserPromptChange: (v: string) => void
  onFluxLoad: () => void
  onFluxClose: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveReference: (index: number) => void
  onGenerate: () => void
}

export default function GeneratePanel(props: GeneratePanelProps) {
  const {
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
    onModelChange,
    onResolutionChange,
    onAspectRatioChange,
    onSystemPromptChange,
    onUserPromptChange,
    onFluxLoad,
    onFluxClose,
    onDragOver,
    onDrop,
    onFileInput,
    onRemoveReference,
    onGenerate,
  } = props

  return (
    <div className="generate-panel">
      <div className="form-group">
        <label className="panel-section-label">Model</label>
        <div className="select-wrapper">
          <select className="model-select" value={selectedModel} onChange={e => onModelChange(e.target.value)}>
            <optgroup label="Gemini (Cloud)">
              <option value="gemini-3-pro-image-preview">Nano Banana Pro</option>
              <option value="gemini-3.1-flash-image-preview">Nano Banana 2</option>
            </optgroup>
            <optgroup label="GPT (Cloud)">
              <option value="gpt-image-2">GPT Image 2</option>
            </optgroup>
            <optgroup label="FLUX (Local)">
              <option value="black-forest-labs/FLUX.2-klein-4B">FLUX.2 Klein 4B</option>
              <option value="black-forest-labs/FLUX.2-klein-9B">FLUX.2 Klein 9B</option>
            </optgroup>
          </select>
          <span className="select-arrow">▾</span>
        </div>
      </div>
      {isFluxModel && (
        <div className="flux-controls">
          <button
            type="button"
            className="flux-btn load"
            onClick={onFluxLoad}
            disabled={isFluxLoading || isFluxClosing || isFluxLoaded || isGenerating}
          >
            {isFluxLoading ? 'Loading...' : 'Load'}
          </button>
          <button
            type="button"
            className="flux-btn close"
            onClick={onFluxClose}
            disabled={isFluxClosing || isFluxLoading || !isFluxLoaded || isGenerating}
          >
            {isFluxClosing ? 'Closing...' : 'Close'}
          </button>
          <span className={`flux-status-text ${isFluxLoaded ? 'loaded' : ''}`}>
            {isFluxLoaded ? 'Loaded' : 'Not loaded'}
          </span>
        </div>
      )}
      <div className="config-row">
        <div className="form-group flex-1">
          <label className="panel-section-label">Resolution</label>
          <div className="select-wrapper">
            <select className="model-select" value={selectedResolution} onChange={e => onResolutionChange(e.target.value)}>
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
            <select className="model-select" value={selectedAspectRatio} onChange={e => onAspectRatioChange(e.target.value)}>
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
      <GpuStatusBlock
        systemStatus={systemStatus}
        memNow={memNow}
        memMax={memMax}
        memFree={memFree}
        memTotal={memTotal}
        usedMemoryPct={usedMemoryPct}
      />
      <div className="form-group">
        <label className="panel-section-label">System Prompt <span className="required-mark">*</span></label>
        <textarea
          value={systemPrompt}
          onChange={e => onSystemPromptChange(e.target.value)}
          placeholder="Enter system prompt..."
          rows={3}
          className={!systemPrompt.trim() && generateError ? 'input-error' : ''}
        />
      </div>
      <div className="form-group">
        <label className="panel-section-label">User Prompt <span className="required-mark">*</span></label>
        <textarea
          value={userPrompt}
          onChange={e => onUserPromptChange(e.target.value)}
          placeholder="Enter user prompt..."
          rows={3}
          className={!userPrompt.trim() && generateError ? 'input-error' : ''}
        />
      </div>
      <div className="form-group">
        <label className="panel-section-label">Reference Images</label>
        <div className="drop-zone" onDragOver={onDragOver} onDrop={onDrop}>
          <p>Drop images here</p>
          <input type="file" accept="image/*" multiple onChange={onFileInput} id="file-input" style={{ display: 'none' }} />
          <label htmlFor="file-input" className="file-input-label">Browse</label>
        </div>
        {referenceFiles.length > 0 && (
          <div className="reference-files-grid">
            {referenceFiles.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`} className="reference-file-preview">
                <img src={previewUrls[index] || ''} alt={file.name} />
                <button type="button" className="remove-btn" onClick={() => onRemoveReference(index)}>×</button>
                <span className="file-name-overlay">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {generateError && <div className="generate-error">{generateError}</div>}
      <button
        type="button"
        className="generate-btn"
        onClick={onGenerate}
        disabled={
          isGenerating
          || (!systemPrompt.trim() && !userPrompt.trim() && !generateError)
          || (isFluxModel && !isFluxLoaded)
        }
      >
        {isGenerating ? 'Generating...' : 'Generate Image'}
      </button>
    </div>
  )
}
