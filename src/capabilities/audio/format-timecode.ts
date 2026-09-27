export function formatAudioTimecode(seconds: number) {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0)
  const minutes = Math.floor(safeSeconds / 60)
  const remainder = Math.floor(safeSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}
