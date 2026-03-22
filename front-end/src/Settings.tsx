/**
 * Settings 頁面
 * 提供三個區塊：
 * 1. System Status  - 顯示 GPU/CPU 使用狀況，每 5 秒自動更新
 * 2. Appearance     - 選擇介面強調色（accent color），即時套用並儲存至 localStorage
 * 3. API Keys       - 儲存 Gemini 與 ChatGPT 的 API Key 至後端記憶體
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './Settings.css'

/** 後端 /api/status 回傳的系統狀態格式 */
interface SystemStatus {
  mode: 'GPU' | 'CPU'
  device?: string       // GPU 裝置名稱
  used_memory?: string  // 已使用 VRAM（格式如 "1.23 GB"）
  total_memory?: string // 總 VRAM
}

/** 強調色預設選項 */
const ACCENT_PRESETS = [
  { label: 'White',   value: '#e0e0e0' },
  { label: 'Blue',    value: '#60a5fa' },
  { label: 'Purple',  value: '#a78bfa' },
  { label: 'Pink',    value: '#f472b6' },
  { label: 'Amber',   value: '#fbbf24' },
  { label: 'Teal',    value: '#2dd4bf' },
]

/** localStorage 儲存 accent color 的 key */
const ACCENT_KEY = 'accent-color'

export default function Settings() {
  const navigate = useNavigate()

  // ── API Keys 狀態 ──
  const [geminiKey, setGeminiKey]   = useState('')
  const [chatgptKey, setChatgptKey] = useState('')
  const [isSaving, setIsSaving]     = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')   // 儲存結果訊息

  // ── 系統狀態 ──
  const [status, setStatus] = useState<SystemStatus | null>(null)

  // ── 外觀設定：從 localStorage 初始化 accent 顏色 ──
  const [accentColor, setAccentColor] = useState<string>(() =>
    localStorage.getItem(ACCENT_KEY) ?? '#e0e0e0'
  )

  /**
   * 套用強調色：同時更新 state、CSS 變數、localStorage
   */
  const applyAccent = (color: string) => {
    setAccentColor(color)
    document.documentElement.style.setProperty('--accent', color)
    localStorage.setItem(ACCENT_KEY, color)
  }

  /**
   * 從後端取得系統狀態（GPU/CPU 資訊）
   */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      const data = await res.json()
      setStatus(data)
    } catch { /* 後端未啟動時靜默忽略 */ }
  }, [])

  // 頁面載入後立即取得狀態，之後每 5 秒更新一次
  useEffect(() => {
    fetchStatus()
    const id = setInterval(fetchStatus, 5000)
    return () => clearInterval(id)
  }, [fetchStatus])

  // 頁面掛載時確保 CSS 變數與 state 同步
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accentColor)
  }, [accentColor])

  /**
   * 將 API Key 傳送至後端儲存（寫入記憶體，重啟後需重設）
   */
  const handleSave = async () => {
    setIsSaving(true)
    setSaveMsg('')
    try {
      const formData = new FormData()
      formData.append('gemini_api_key', geminiKey)
      formData.append('chatgpt_api_key', chatgptKey)
      const res = await fetch('/api/settings/api-key', { method: 'POST', body: formData })
      if (res.ok) {
        setSaveMsg('已儲存')
        setTimeout(() => setSaveMsg(''), 2500)
      } else {
        setSaveMsg('儲存失敗')
      }
    } catch {
      setSaveMsg('無法連線到後端')
    } finally {
      setIsSaving(false)
    }
  }

  /** 計算 VRAM 使用率百分比（0～100），僅 GPU 模式有效 */
  const usedPct =
    status?.mode === 'GPU' && status.used_memory && status.total_memory
      ? Math.min(100, (parseFloat(status.used_memory) / parseFloat(status.total_memory)) * 100)
      : 0

  return (
    <div className="settings-page">
      {/* ── 頂部導覽列 ── */}
      <header className="settings-nav">
        <button className="settings-back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <span className="settings-nav-title">Settings</span>
      </header>

      <div className="settings-content">

        {/* ── 系統狀態卡片 ── */}
        <section className="settings-card">
          <div className="settings-card-title">System Status</div>

          {status ? (
            status.mode === 'GPU' ? (
              <div className="status-detail">
                {/* 裝置名稱列 */}
                <div className="status-detail-row">
                  <span className="status-badge-lg gpu">GPU</span>
                  <span className="status-detail-device">{status.device}</span>
                </div>
                {/* VRAM 使用率進度條 */}
                <div className="status-vram-row">
                  <span className="status-vram-label">VRAM</span>
                  <div className="status-vram-track">
                    <div className="status-vram-fill" style={{ width: `${usedPct}%` }} />
                  </div>
                  <span className="status-vram-text">
                    {status.used_memory} / {status.total_memory}
                  </span>
                </div>
              </div>
            ) : (
              /* CPU 模式：無 VRAM 資訊 */
              <div className="status-detail">
                <div className="status-detail-row">
                  <span className="status-badge-lg cpu">CPU</span>
                  <span className="status-detail-device">No CUDA device detected</span>
                </div>
              </div>
            )
          ) : (
            /* 尚未取得狀態 */
            <div className="status-detail-placeholder">Connecting...</div>
          )}
        </section>

        {/* ── 外觀偏好設定卡片 ── */}
        <section className="settings-card">
          <div className="settings-card-title">Appearance</div>

          {/* 左右並排：顏色選擇 + 即時預覽 */}
          <div className="appearance-main-row">

            {/* 左側：色點選擇器 + 預設色票 */}
            <div className="appearance-left">
              {/* 目前顏色圓點（點擊開啟系統色盤） */}
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

              {/* 預設色票列 */}
              <div className="appearance-presets-row">
                {ACCENT_PRESETS.map(p => (
                  <button
                    key={p.value}
                    className={`appearance-preset-dot ${accentColor === p.value ? 'active' : ''}`}
                    style={{ background: p.value }}
                    onClick={() => applyAccent(p.value)}
                    title={p.label}
                  />
                ))}
              </div>
            </div>

            {/* 右側：即時預覽（Tab 文字 + Toggle 按鈕） */}
            <div className="appearance-right">
              <div className="appearance-preview-label">Preview</div>
              <div className="appearance-preview-items">
                {/* Tab 標籤預覽 */}
                <span
                  className="appearance-preview-tab"
                  style={{ color: accentColor, borderColor: accentColor }}
                >
                  Active Tab
                </span>
                {/* Toggle 按鈕 On/Off 預覽 */}
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

        {/* ── API Keys 卡片 ── */}
        <section className="settings-card">
          <div className="settings-card-title">API Keys</div>

          {/* Gemini API Key 輸入欄 */}
          <div className="settings-field">
            <label className="settings-field-label">Gemini API Key</label>
            <input
              type="password"
              className="settings-field-input"
              value={geminiKey}
              onChange={(e) => { setGeminiKey(e.target.value); setSaveMsg('') }}
              placeholder="AIza..."
              autoComplete="off"
            />
          </div>

          {/* ChatGPT API Key 輸入欄 */}
          <div className="settings-field">
            <label className="settings-field-label">ChatGPT API Key</label>
            <input
              type="password"
              className="settings-field-input"
              value={chatgptKey}
              onChange={(e) => { setChatgptKey(e.target.value); setSaveMsg('') }}
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>

          {/* 儲存按鈕與結果訊息 */}
          <div className="settings-card-footer">
            {saveMsg && (
              <span className={`settings-save-msg ${saveMsg === '已儲存' ? 'ok' : 'err'}`}>
                {saveMsg}
              </span>
            )}
            <button
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
  )
}
