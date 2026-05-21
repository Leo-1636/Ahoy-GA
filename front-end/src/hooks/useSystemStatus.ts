import { useState, useCallback, useEffect, useMemo } from 'react'
import type { SystemStatus } from '../types'
import { STATUS_POLL_IDLE_MS, STATUS_POLL_GENERATING_MS } from '../lib/constants'

export function useSystemStatus(isGenerating: boolean, isFluxModel: boolean) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setSystemStatus(data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }, [])

  // 非 FLUX 生成／閒置：10 秒；FLUX 生成中：1 秒
  const pollMs = isGenerating && isFluxModel ? STATUS_POLL_GENERATING_MS : STATUS_POLL_IDLE_MS

  useEffect(() => {
    void fetchStatus()
    const id = window.setInterval(() => void fetchStatus(), pollMs)
    return () => window.clearInterval(id)
  }, [fetchStatus, pollMs])

  const memNow = systemStatus?.['now-memory'] ?? '-'
  const memMax = systemStatus?.['max-memory'] ?? '-'
  const memFree = systemStatus?.['free-memory'] ?? '-'
  const memTotal = systemStatus?.['total-memory'] ?? '-'

  const usedMemoryPct = useMemo(() => {
    const total = parseFloat(memTotal)
    const free = parseFloat(memFree)
    if (!total || Number.isNaN(total) || Number.isNaN(free)) return 0
    return Math.min(100, ((total - free) / total) * 100)
  }, [memTotal, memFree])

  return {
    systemStatus,
    fetchStatus,
    memNow,
    memMax,
    memFree,
    memTotal,
    usedMemoryPct,
  }
}
