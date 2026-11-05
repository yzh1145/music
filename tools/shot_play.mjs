// 播放交互验证：在歌单页双击第一首歌，截图播放条与播放页
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT_DIR = 'D:\\work\\music\\.tmp'
const WEB = 'http://127.0.0.1:5173'
const PORT = 9223

const edge = spawn(EDGE, [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
  '--autoplay-policy=no-user-gesture-required',
  '--window-size=1440,1200', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${OUT_DIR}\\edge-play`, 'about:blank'
], { stdio: 'ignore', detached: true })
edge.unref()

let version
for (let i = 0; i < 40; i++) {
  try { version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()); break } catch { await sleep(250) }
}
const target = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(WEB + '/playlist/1')}`, { method: 'PUT' }).then((r) => r.json())
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let seq = 0
const pending = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id)
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
  }
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq
  pending.set(id, { resolve, reject })
  ws.send(JSON.stringify({ id, method, params }))
})

await send('Page.enable')
await send('Runtime.enable')
await sleep(4000)

// 双击歌曲列表第一行（坐标取自页面布局）
for (const type of ['mousePressed', 'mouseReleased']) {
  await send('Input.dispatchMouseEvent', { type, x: 400, y: 484, button: 'left', clickCount: 2 })
}
await sleep(4000)

const state = await send('Runtime.evaluate', {
  expression: `JSON.stringify({ title: document.querySelector('.player-song')?.textContent || document.body.innerText.includes('夏夜晚风'), audio: document.querySelector('audio')?.src || '' })`,
  returnByValue: true
})
console.log('播放状态:', state.result.value)

const shot = async (name) => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT_DIR}\\${name}.png`, Buffer.from(data, 'base64'))
  console.log('已保存', name + '.png')
}
await shot('playing-bar')
await send('Page.navigate', { url: WEB + '/song/1' })
await sleep(4000)
await shot('playing-detail')
ws.close()
process.exit(0)
