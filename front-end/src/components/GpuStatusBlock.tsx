import type { SystemStatus } from '../types'

interface GpuStatusBlockProps {
  systemStatus: SystemStatus | null
  memNow: string
  memMax: string
  memFree: string
  memTotal: string
  usedMemoryPct: number
}

export default function GpuStatusBlock({
  systemStatus,
  memNow,
  memMax,
  memFree,
  memTotal,
  usedMemoryPct,
}: GpuStatusBlockProps) {
  return (
    <div className="status-block">
      {systemStatus ? (
        systemStatus.mode === 'GPU' ? (
          <>
            <div className="status-row">
              <span className="status-badge gpu">GPU</span>
              <span className="status-device">{systemStatus.device}</span>
            </div>
            <div className="status-mem">
              <div className="status-mem-bar-wrap">
                <div className="status-mem-bar" style={{ width: `${usedMemoryPct}%` }} />
              </div>
              <div className="status-mem-grid">
                <div className="status-mem-item">
                  <span className="status-mem-key">NOW</span>
                  <span className="status-mem-val">{memNow}</span>
                </div>
                <div className="status-mem-item">
                  <span className="status-mem-key">MAX</span>
                  <span className="status-mem-val">{memMax}</span>
                </div>
                <div className="status-mem-item">
                  <span className="status-mem-key">FREE</span>
                  <span className="status-mem-val">{memFree}</span>
                </div>
                <div className="status-mem-item">
                  <span className="status-mem-key">TOTAL</span>
                  <span className="status-mem-val">{memTotal}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="status-row">
            <span className="status-badge cpu">CPU</span>
            <span className="status-device">No CUDA device</span>
          </div>
        )
      ) : (
        <div className="status-row">
          <span className="status-device">Connecting...</span>
        </div>
      )}
    </div>
  )
}
