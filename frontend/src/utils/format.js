/** 秒数转 mm:ss */
export function formatDuration(seconds) {
  const value = Number(seconds) || 0
  const m = Math.floor(value / 60)
  const s = Math.floor(value % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 播放量：超过一万显示为 x.x万 */
export function formatCount(count) {
  const value = Number(count) || 0
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
  return String(value)
}

/** 日期时间：后端已格式化为 yyyy-MM-dd HH:mm:ss，这里只取日期 */
export function formatDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

/** 解析 LRC 歌词为 [{ time, text }] */
export function parseLyric(lyric) {
  if (!lyric) return []
  const lines = []
  for (const raw of lyric.split('\n')) {
    const match = raw.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/)
    if (!match) continue
    const minutes = Number(match[1])
    const seconds = Number(match[2])
    const millis = match[3] ? Number(match[3].padEnd(3, '0')) : 0
    const text = match[4].trim()
    if (!text) continue
    lines.push({ time: minutes * 60 + seconds + millis / 1000, text })
  }
  return lines.sort((a, b) => a.time - b.time)
}
