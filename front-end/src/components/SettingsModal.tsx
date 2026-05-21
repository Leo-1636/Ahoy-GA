import { useState, useEffect } from 'react'
import '../Settings.css'
import './SettingsModal.css'
import { ACCENT_KEY } from '../lib/constants'

const ACCENT_PRESETS = [
  { label: 'White', value: '#e0e0e0' },
  { label: 'Blue', value: '#60a5fa' },
  { label: 'Purple', value: '#a78bfa' },
  { label: 'Pink', value: '#f472b6' },
  { label: 'Amber', value: '#fbbf24' },
  { label: 'Teal', value: '#2dd4bf' },
]

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [geminiKey, setGeminiKey] = useState('')
  const [chatgptKey, setChatgptKey] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [accentColor, setAccentColor] = useState<string>(
    () => localStorage.getItem(ACCENT_KEY) ?? '#e0e0e0',
  )

  const applyAccent = (color: string) => {
    setAccentColor(color)
    document.documentElement.style.setProperty('--accent', color)
    localStorage.setItem(ACCENT_KEY, color)
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMsg('')
    try {
      const requests: Promise<Response>[] = []
      if (geminiKey.trim()) {
        const params = new URLSearchParams({ name: 'GOOGLE_API_KEY', key: geminiKey })
        requests.push(fetch(`/api/settings/api-key?${params}`, { method: 'POST' }))
      }
      if (chatgptKey.trim()) {
        const params = new URLSearchParams({ name: 'OPENAI_API_KEY', key: chatgptKey })
        requests.push(fetch(`/api/settings/api-key?${params}`, { method: 'POST' }))
      }
      const responses = await Promise.all(requests)
      if (responses.length > 0 && responses.every(res => res.ok)) {
        setSaveMsg('已儲存')
        setTimeout(() => setSaveMsg(''), 2500)
      } else {
        setSaveMsg(responses.length === 0 ? '請輸入 API Key' : '儲存失敗')
      }
    } catch {
      setSaveMsg('無法連線到後端')
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <header className="settings-modal-header">
          <span className="settings-modal-title">Settings</span>
          <button type="button" className="settings-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="settings-modal-body">
          <section className="settings-card">
            <div className="settings-card-title">Appearance</div>
            <div className="appearance-main-row">
              <div className="appearance-left">
                <div className="appearance-color-row">
                  <label className="appearance-color-swatch-wrap" title="Pick accent color">
                    <span className="appearance-color-dot" style={{ background: accentColor }} />
                    <input
                      type="color"
                      className="appearance-color-picker-hidden"
                      value={accentColor}
                      onChange={e => applyAccent(e.target.value)}
                    />
                  </label>
                  <span className="appearance-color-hex">{accentColor.toUpperCase()}</span>
                </div>
                <div className="appearance-presets-row">
                  {ACCENT_PRESETS.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      className={`appearance-preset-dot ${accentColor === p.value ? 'active' : ''}`}
                      style={{ background: p.value }}
                      onClick={() => applyAccent(p.value)}
                      title={p.label}
                    />
                  ))}
                </div>
              </div>
              <div className="appearance-right">
                <div className="appearance-preview-label">Preview</div>
                <div className="appearance-preview-items">
                  <span
                    className="appearance-preview-tab"
                    style={{ color: accentColor, borderColor: accentColor }}
                  >
                    Active Tab
                  </span>
                  <div className="appearance-preview-toggle">
                    <span
                      className="appearance-preview-toggle-btn"
                      style={{ background: accentColor, borderColor: accentColor, color: '#0a0a0a' }}
                    >
                      On
                    </span>
                    <span className="appearance-preview-toggle-btn inactive">Off</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-title">API Keys</div>
            <div className="settings-field">
              <label className="settings-field-label">Gemini API Key</label>
              <input
                type="password"
                className="settings-field-input"
                value={geminiKey}
                onChange={e => { setGeminiKey(e.target.value); setSaveMsg('') }}
                placeholder="AIza..."
                autoComplete="off"
              />
            </div>
            <div className="settings-field">
              <label className="settings-field-label">ChatGPT API Key</label>
              <input
                type="password"
                className="settings-field-input"
                value={chatgptKey}
                onChange={e => { setChatgptKey(e.target.value); setSaveMsg('') }}
                placeholder="sk-..."
                autoComplete="off"
              />
            </div>
            <div className="settings-card-footer">
              {saveMsg && (
                <span className={`settings-save-msg ${saveMsg === '已儲存' ? 'ok' : 'err'}`}>
                  {saveMsg}
                </span>
              )}
              <button
                type="button"
                className="settings-save-key-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
