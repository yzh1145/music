// 登录后页面截图：用 CDP 注入登录态，验证「我的音乐」「后台管理」页面渲染
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT_DIR = 'D:\\work\\music\\.tmp'
const WEB = 'http://127.0.0.1:5173'
const API = 'http://127.0.0.1:8080'
const PORT = 9222

mkdirSync(OUT_DIR, { recursive: true })

const login = await fetch(`${API}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: '123456' })
}).then((r) => r.json())
if (login.code !== 200) throw new Error('登录失败: ' + JSON.stringify(login))
const { token, user } = login.data
console.log('登录成功:', user.nickname, 'role=' + user.role)

const edge = spawn(EDGE, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1440,1200',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${OUT_DIR}\\edge-auth`,
  'about:blank'
], { stdio: 'ignore', detached: true })
edge.unref()

let version
for (let i = 0; i < 40; i++) {
  try {
    version = await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json())
    break
  } catch {
    await sleep(250)
  }
}
if (!version) throw new Error('无法连接调试端口')
console.log('浏览器已启动:', version['Browser'])

const target = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(WEB + '/')}`, { method: 'PUT' }).then((r) => r.json())
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

let seq = 0
const pending = new Map()
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  }
}
function send(method, params = {}) {
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

await send('Page.enable')
await sleep(2000)
await send('Runtime.evaluate', {
  expression: `localStorage.setItem('music_token', ${JSON.stringify(token)});localStorage.setItem('music_user', ${JSON.stringify(JSON.stringify(user))});`
})

async function shot(path, name) {
  await send('Page.navigate', { url: WEB + path })
  await sleep(5000)
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT_DIR}\\${name}.png`, Buffer.from(data, 'base64'))
  console.log('已保存', name + '.png')
}

await shot('/my', 'my-music')
await shot('/admin', 'admin')

ws.close()
process.exit(0)
