export function formatTimecode(seconds: number) {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainder = Math.floor(safeSeconds % 60)
  const value = [minutes, remainder]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${value}` : value
}
