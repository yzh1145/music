/**
 * 格式化工具（JS 侧）
 */
function pad2(value) {
  const number = Number(value) || 0
  return (number < 10 ? '0' : '') + number
}

/** 秒数转 mm:ss */
function formatDuration(seconds) {
  const value = Number(seconds) || 0
  return pad2(Math.floor(value / 60)) + ':' + pad2(Math.floor(value % 60))
}

/** 播放量：超过一万显示为 x.x万 */
function formatCount(count) {
  const value = Number(count) || 0
  if (value >= 100000000) return (value / 100000000).toFixed(1) + '亿'
  if (value >= 10000) return (value / 10000).toFixed(1) + '万'
  return String(value)
}

/** 只保留日期：2026-11-06 */
function formatDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

/** 保留到分钟：2026-11-06 12:30 */
function formatDateTime(value) {
  if (!value) return ''
  return String(value).slice(0, 16)
}

/**
 * 解析 LRC 歌词为 [{ time, text }]，与 Web 端 utils/format.js 保持一致
 */
function parseLyric(lyric) {
  if (!lyric) return []
  const lines = []
  const rows = String(lyric).split('\n')
  for (let i = 0; i < rows.length; i += 1) {
    const match = rows[i].match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)$/)
    if (!match) continue
    const minutes = Number(match[1])
    const seconds = Number(match[2])
    let millis = 0
    if (match[3]) {
      // 两位数按 0.xx 秒处理，三位数按毫秒处理
      millis = Number(match[3].length === 2 ? match[3] + '0' : match[3])
    }
    const text = match[4].trim()
    if (!text) continue
    lines.push({ time: minutes * 60 + seconds + millis / 1000, text })
  }
  return lines.sort((a, b) => a.time - b.time)
}

module.exports = {
  pad2,
  formatDuration,
  formatCount,
  formatDate,
  formatDateTime,
  parseLyric
}
