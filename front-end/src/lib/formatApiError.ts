export function formatApiError(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map(item => {
        if (typeof item === 'object' && item && 'msg' in item) {
          return String((item as { msg: string }).msg)
        }
        return String(item)
      })
      .join('; ')
  }
  return fallback
}
