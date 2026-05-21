import type { ImageFile } from '../types'

interface TagPanelProps {
  selectedImage: ImageFile | null
  isManualTagMode: boolean
  manualTag: string
  tagModel: string
  tagSystemPrompt: string
  tagUserPrompt: string
  generatedTag: string
  isGeneratingTag: boolean
  onManualTagModeChange: (manual: boolean) => void
  onManualTagChange: (v: string) => void
  onTagModelChange: (v: string) => void
  onTagSystemPromptChange: (v: string) => void
  onTagUserPromptChange: (v: string) => void
  onSaveManualTag: () => void
  onGenerateTag: () => void
}

export default function TagPanel({
  selectedImage,
  isManualTagMode,
  manualTag,
  tagModel,
  tagSystemPrompt,
  tagUserPrompt,
  generatedTag,
  isGeneratingTag,
  onManualTagModeChange,
  onManualTagChange,
  onTagModelChange,
  onTagSystemPromptChange,
  onTagUserPromptChange,
  onSaveManualTag,
  onGenerateTag,
}: TagPanelProps) {
  if (!selectedImage) {
    return (
      <div className="tag-panel">
        <p className="warning">Select an image first</p>
      </div>
    )
  }

  return (
    <div className="tag-panel">
      <p className="info">Current: {selectedImage.name}</p>
      <div className="tag-mode-toggle">
        <label className="panel-section-label">Tag Mode</label>
        <div className="toggle-buttons">
          <button
            type="button"
            className={`toggle-btn ${!isManualTagMode ? 'active' : ''}`}
            onClick={() => onManualTagModeChange(false)}
          >
            AI Generate
          </button>
          <button
            type="button"
            className={`toggle-btn ${isManualTagMode ? 'active' : ''}`}
            onClick={() => onManualTagModeChange(true)}
          >
            Manual Input
          </button>
        </div>
      </div>
      {isManualTagMode ? (
        <>
          <div className="form-group">
            <label className="panel-section-label">Tag Content</label>
            <textarea
              value={manualTag}
              onChange={e => onManualTagChange(e.target.value)}
              placeholder="Enter tag content manually..."
              rows={5}
            />
          </div>
          <button type="button" className="generate-btn" onClick={onSaveManualTag} disabled={!manualTag.trim()}>
            Save Tag
          </button>
        </>
      ) : (
        <>
          <div className="form-group">
            <label className="panel-section-label">Model</label>
            <div className="select-wrapper">
              <select className="model-select" value={tagModel} onChange={e => onTagModelChange(e.target.value)}>
                <optgroup label="Gemini (Cloud)">
                  <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                </optgroup>
                <optgroup label="GPT (Cloud)">
                  <option value="gpt-5.4-mini">GPT 5.4 Mini</option>
                </optgroup>
              </select>
              <span className="select-arrow">▾</span>
            </div>
          </div>
          <div className="form-group">
            <label className="panel-section-label">System Prompt</label>
            <textarea
              value={tagSystemPrompt}
              onChange={e => onTagSystemPromptChange(e.target.value)}
              placeholder="Enter system prompt..."
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="panel-section-label">User Prompt</label>
            <textarea
              value={tagUserPrompt}
              onChange={e => onTagUserPromptChange(e.target.value)}
              placeholder="Enter user prompt..."
              rows={3}
            />
          </div>
          <button type="button" className="generate-btn" onClick={onGenerateTag} disabled={isGeneratingTag}>
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
    </div>
  )
}
