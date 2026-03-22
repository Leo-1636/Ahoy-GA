/**
 * 應用程式進入點
 * - 建立 React 根節點並掛載到 #root
 * - 使用 BrowserRouter 啟用前端路由
 * - 路由：/ → 主頁面 App，/settings → 設定頁面 Settings
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Settings from './Settings'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 主頁面：圖片列表、編輯、生成 */}
        <Route path="/" element={<App />} />
        {/* 設定頁面：API Key、外觀主題、系統狀態 */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
