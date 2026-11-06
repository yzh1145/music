/**
 * 小程序端逻辑冒烟测试（不依赖微信开发者工具）
 *
 * 用 Node 模拟 wx 全局对象，直接 require 小程序里的公共模块，覆盖：
 * - 服务端地址配置、媒体地址补全、统一响应解包与错误处理
 * - 登录态存取、401 清理
 * - 播放器队列 / 上一首 / 下一首 / 模式 / 进度 / 喜欢状态
 * - LRC 解析与 WXS 格式化函数
 * - 页面里调用的 api / player / userStore 方法是否都已导出
 *
 * 用法：node tools/mp_smoke_test.mjs
 */

import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MP = path.resolve(__dirname, '..', 'miniprogram')

const storage = new Map()
const toasts = []
const calls = []

function makeAudio() {
  const handlers = {}
  return {
    src: '',
    duration: 180,
    currentTime: 0,
    paused: true,
    obeyMuteSwitch: true,
    handlers,
    onCanplay(fn) {
      handlers.canplay = fn
    },
    onPlay(fn) {
      handlers.play = fn
    },
    onPause(fn) {
      handlers.pause = fn
    },
    onStop(fn) {
      handlers.stop = fn
    },
    onEnded(fn) {
      handlers.ended = fn
    },
    onTimeUpdate(fn) {
      handlers.timeupdate = fn
    },
    onError(fn) {
      handlers.error = fn
    },
    play() {
      this.paused = false
      if (handlers.play) handlers.play()
    },
    pause() {
      this.paused = true
      if (handlers.pause) handlers.pause()
    },
    stop() {
      this.paused = true
      this.currentTime = 0
      if (handlers.stop) handlers.stop()
    },
    seek(seconds) {
      this.currentTime = seconds
    }
  }
}

const audio = makeAudio()

const homePayload = {
  banners: [{ id: 1, title: 'banner', imageUrl: '/images/banner/b1.png', linkType: 1, linkId: 1 }],
  recommendPlaylists: [
    {
      id: 1,
      name: '歌单',
      cover: '/images/playlist/p1.png',
      creatorName: '云音乐',
      creatorAvatar: null,
      playCount: 12345
    }
  ],
  recommendSongs: [
    { id: 1, name: '夏日', singerName: '张三', cover: null, audioUrl: '/audio/track-1.wav', duration: 38 }
  ],
  newSongs: [],
  hotSingers: [{ id: 1, name: '张三', avatar: '/images/avatar/u1.png', songCount: 3, followCount: 10 }]
}

const songDetail = {
  id: 1,
  name: '夏日',
  singerId: 1,
  singerName: '张三',
  albumId: 1,
  albumName: '第一张',
  cover: '/images/album/a1.png',
  audioUrl: '/audio/track-1.wav',
  lyric: '[00:01.00]第一句\n[00:05.50]第二句\n[00:10.00]第三句',
  duration: 38,
  playCount: 1,
  likeCount: 2,
  commentCount: 3,
  liked: false
}

const routes = {
  'GET /api/home': { code: 200, message: 'ok', data: homePayload },
  'POST /api/auth/login': {
    code: 200,
    message: 'ok',
    data: { token: 'token-1', user: { id: 2, username: 'test', nickname: '测试', role: 0 } }
  },
  'GET /api/song/1': { code: 200, message: 'ok', data: songDetail },
  'POST /api/song/1/play': { code: 200, message: 'ok', data: null },
  'POST /api/song/2/play': { code: 200, message: 'ok', data: null },
  'POST /api/history': { code: 200, message: 'ok', data: null },
  'GET /api/bad': { code: 400, message: '参数错误', data: null },
  'GET /api/private': { code: 401, message: '登录状态已失效', data: null }
}

globalThis.wx = {
  getStorageSync(key) {
    return storage.has(key) ? storage.get(key) : ''
  },
  setStorageSync(key, value) {
    storage.set(key, value)
  },
  removeStorageSync(key) {
    storage.delete(key)
  },
  request(options) {
    const url = new URL(options.url)
    const key = options.method + ' ' + url.pathname
    calls.push({ key, url: options.url, data: options.data })
    const body = routes[key]
    setTimeout(() => {
      if (!body) {
        options.success({ statusCode: 404, data: { code: 404, message: '接口不存在', data: null } })
        return
      }
      options.success({ statusCode: 200, data: body })
    }, 0)
  },
  createInnerAudioContext() {
    return audio
  },
  showToast(options) {
    toasts.push(options)
  }
}

const config = require(path.join(MP, 'config', 'index.js'))
const requestUtil = require(path.join(MP, 'utils', 'request.js'))
const api = require(path.join(MP, 'utils', 'api.js'))
const auth = require(path.join(MP, 'utils', 'auth.js'))
const bus = require(path.join(MP, 'utils', 'bus.js'))
const format = require(path.join(MP, 'utils', 'format.js'))
const userStore = require(path.join(MP, 'store', 'user.js'))
const player = require(path.join(MP, 'store', 'player.js'))

let passed = 0
const failures = []

function check(name, condition, detail) {
  if (condition) {
    passed += 1
    console.log('  ok  ' + name)
  } else {
    failures.push(name + (detail ? ' -> ' + detail : ''))
    console.log('FAIL  ' + name + (detail ? ' -> ' + detail : ''))
  }
}

function resetStorage() {
  storage.clear()
  toasts.length = 0
  calls.length = 0
}

async function run() {
  console.log('\n[1] 配置与请求封装')
  resetStorage()
  check('默认服务器地址', config.getApiBase() === 'http://localhost:8080', config.getApiBase())
  check('保存地址后自动去掉末尾斜杠', config.setApiBase('  http://192.168.1.10:8080/  ') === 'http://192.168.1.10:8080')
  check('自动补 http://', config.normalizeBase('127.0.0.1:8080') === 'http://127.0.0.1:8080')
  config.resetApiBase()
  check('恢复默认地址', config.getApiBase() === 'http://localhost:8080')

  const home = await api.getHome()
  check('解包统一响应 data', !!home && home.recommendPlaylists.length === 1)
  check(
    '相对图片补全为绝对地址',
    home.banners[0].imageUrl === 'http://localhost:8080/images/banner/b1.png',
    home.banners[0].imageUrl
  )
  check(
    '空封面使用本地兜底图',
    home.recommendSongs[0].cover === '/assets/images/default-cover.png',
    home.recommendSongs[0].cover
  )
  check(
    '空头像使用本地兜底图',
    home.recommendPlaylists[0].creatorAvatar === '/assets/images/default-avatar.png',
    home.recommendPlaylists[0].creatorAvatar
  )
  check(
    '音频地址补全',
    home.recommendSongs[0].audioUrl === 'http://localhost:8080/audio/track-1.wav',
    home.recommendSongs[0].audioUrl
  )
  check('buildQuery 忽略空值', requestUtil.buildQuery({ a: 1, b: '', c: null, d: 'x y' }) === '?a=1&d=x%20y')
  check(
    'toRelative 还原相对路径',
    requestUtil.toRelative('http://localhost:8080/images/album/a1.png') === '/images/album/a1.png' &&
      requestUtil.toRelative('/images/album/a1.png') === '/images/album/a1.png' &&
      requestUtil.toRelative('https://cdn.example.com/a.png') === 'https://cdn.example.com/a.png' &&
      requestUtil.toRelative('/assets/images/default-cover.png') === ''
  )

  const song = await api.getSong(1)
  check('歌词字段保持不变', song.lyric.indexOf('[00:01.00]') === 0)
  check('专辑封面补全', song.cover === 'http://localhost:8080/images/album/a1.png')

  let badError = null
  try {
    await requestUtil.request({ url: '/bad' })
  } catch (e) {
    badError = e
  }
  check('业务错误 400 被 reject', badError && badError.code === 400, badError && badError.code)
  check('业务错误自动 toast', toasts.length === 1 && toasts[0].title === '参数错误')

  console.log('\n[2] 登录态')
  resetStorage()
  userStore.init()
  check('初始未登录', userStore.getSnapshot().isLogin === false)
  const loginData = await userStore.login({ username: 'test', password: '123456' })
  check('登录返回 token', loginData.token === 'token-1')
  check('登录态写入缓存', auth.getToken() === 'token-1' && auth.isLogin())
  check('用户信息写入缓存', auth.getUser().nickname === '测试')
  check('普通用户不是管理员', userStore.isAdmin() === false)

  console.log('\n[3] 播放器')
  player.init()
  check('初始无歌曲', player.getSnapshot().hasSong === false)
  player.playList(
    [
      { id: 1, name: '夏日', singerName: '张三', cover: '/images/a1.png', audioUrl: '/audio/track-1.wav', duration: 38, liked: false },
      { id: 2, name: '夜曲', singerName: '李四', cover: '/images/a2.png', audioUrl: '/audio/track-2.wav', duration: 40, liked: false }
    ],
    0
  )
  let snap = player.getSnapshot()
  check('播放第一首', snap.song.id === 1 && snap.index === 0)
  check('音频 src 为绝对地址', audio.src === 'http://localhost:8080/audio/track-1.wav', audio.src)
  check('状态为播放中', snap.playing === true && audio.paused === false)
  check(
    '上报播放量',
    calls.some((item) => item.key === 'POST /api/song/1/play')
  )
  check(
    '登录后记录播放历史',
    calls.some((item) => item.key === 'POST /api/history')
  )

  audio.currentTime = 20
  if (audio.handlers.timeupdate) audio.handlers.timeupdate()
  check('进度同步', player.getSnapshot().currentTime === 20)

  player.seek(12)
  check('拖动进度', audio.currentTime === 12 && player.getSnapshot().currentTime === 12)

  player.next()
  snap = player.getSnapshot()
  check('下一首', snap.song.id === 2 && audio.src.indexOf('track-2.wav') !== -1, snap.song.id)

  audio.currentTime = 9
  if (audio.handlers.timeupdate) audio.handlers.timeupdate()
  player.prev()
  check('播放超过 5 秒时上一首回到开头', player.getSnapshot().song.id === 2 && audio.currentTime === 0)

  player.prev()
  check('再点上一首切到前一首', player.getSnapshot().song.id === 1)

  player.setMode('single')
  check('切换单曲循环', player.getSnapshot().mode === 'single')
  check('播放模式持久化', wx.getStorageSync('music_player_mode') === 'single')

  audio.currentTime = 15
  if (audio.handlers.ended) audio.handlers.ended()
  check('单曲循环重播当前歌曲', player.getSnapshot().song.id === 1 && audio.currentTime === 0)
  player.setMode('order')
  if (audio.handlers.ended) audio.handlers.ended()
  check('列表循环自动下一首', player.getSnapshot().song.id === 2)
  player.setMode('random')
  check('随机模式生效', player.getSnapshot().mode === 'random')
  player.setMode('order')

  player.toggle()
  check('暂停', player.getSnapshot().playing === false)
  player.toggle()
  check('继续播放', player.getSnapshot().playing === true)

  player.setSongLiked(2, true)
  check('同步喜欢状态', player.getSnapshot().song.liked === true)

  player.playOne({ id: 3, name: '单曲', singerName: '王五', cover: '/images/a3.png', audioUrl: '/audio/track-3.wav', duration: 30 }, null)
  snap = player.getSnapshot()
  check('单曲播放队列只有一首', snap.queueLength === 1 && snap.song.id === 3)

  player.playList(
    [
      { id: 3, name: '单曲', singerName: '王五', cover: '/images/a3.png', audioUrl: '/audio/track-3.wav', duration: 30 },
      { id: 4, name: '另一首', singerName: '赵六', cover: '/images/a4.png', audioUrl: '/audio/track-4.wav', duration: 30 }
    ],
    0
  )
  player.removeFromQueue(3)
  check('从队列移除当前歌曲后继续播放', player.getSnapshot().song.id === 4)

  console.log('\n[4] 格式化与歌词')
  check('时长格式化', format.formatDuration(65) === '01:05')
  check('播放量格式化', format.formatCount(12345) === '1.2万' && format.formatCount(120) === '120')
  check('日期格式化', format.formatDate('2026-11-06 10:00:00') === '2026-11-06')
  const lyrics = format.parseLyric(songDetail.lyric)
  check('LRC 解析行数', lyrics.length === 3)
  check('LRC 时间换算', lyrics[1].time === 5.5 && lyrics[1].text === '第二句')

  const wxsCode = fs.readFileSync(path.join(MP, 'utils', 'format.wxs'), 'utf8')
  const wxsModule = { exports: {} }
  new Function('module', 'exports', wxsCode)(wxsModule, wxsModule.exports)
  const wxs = wxsModule.exports
  check('WXS 时长', wxs.duration(65) === '01:05')
  check('WXS 播放量', wxs.count(12345) === '1.2万' && wxs.count(9999) === '9999' && wxs.count(10000) === '1.0万')
  check('WXS 序号补零', wxs.index(0) === '01' && wxs.index(9) === '10')
  check('WXS 日期', wxs.date('2026-11-06 10:00:00') === '2026-11-06')

  console.log('\n[5] 401 处理')
  resetStorage()
  userStore.init()
  await userStore.login({ username: 'test', password: '123456' })
  let unauthorized = 0
  const off = bus.on('unauthorized', () => {
    unauthorized += 1
  })
  check('登录后 token 存在', auth.getToken() === 'token-1')
  let unauthorizedError = null
  try {
    await requestUtil.request({ url: '/private' })
  } catch (e) {
    unauthorizedError = e
  }
  off()
  check('401 被 reject', unauthorizedError && unauthorizedError.code === 401)
  check('401 清除 token', auth.getToken() === '')
  check('401 广播事件', unauthorized === 1)
  check('内存登录态同步清空', userStore.getSnapshot().isLogin === false)

  console.log('\n[6] 页面调用与模块导出')
  const apiExports = Object.keys(api)
  const playerExports = Object.keys(player)
  const userExports = Object.keys(userStore)
  const missing = []
  const files = []
  for (const dir of ['pages', 'components']) {
    ;(function walk(target) {
      for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
        const full = path.join(target, entry.name)
        if (entry.isDirectory()) walk(full)
        else if (entry.name.endsWith('.js')) files.push(full)
      }
    })(path.join(MP, dir))
  }

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8')
    for (const match of content.matchAll(/\bapi\.([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (!apiExports.includes(match[1])) missing.push(path.relative(MP, file) + ' -> api.' + match[1])
    }
    for (const match of content.matchAll(/\bplayer\.([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (!playerExports.includes(match[1])) missing.push(path.relative(MP, file) + ' -> player.' + match[1])
    }
    for (const match of content.matchAll(/\buserStore\.([A-Za-z_$][\w$]*)\s*\(/g)) {
      if (!userExports.includes(match[1])) missing.push(path.relative(MP, file) + ' -> userStore.' + match[1])
    }
  }
  check('页面调用的方法均已导出', missing.length === 0, missing.join('; '))

  console.log('\n[7] 页面 / 组件模块加载')
  const pageModules = []
  const componentModules = []
  globalThis.Page = (options) => pageModules.push(options)
  globalThis.Component = (options) => componentModules.push(options)

  const pageFiles = []
  ;(function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'index.js') pageFiles.push(full)
    }
  })(path.join(MP, 'pages'))

  let loadError = null
  for (const file of pageFiles) {
    try {
      require(file)
    } catch (error) {
      loadError = path.relative(MP, file) + ': ' + error.message
      break
    }
  }
  const componentFiles = fs
    .readdirSync(path.join(MP, 'components'))
    .map((name) => path.join(MP, 'components', name, 'index.js'))
    .filter((file) => fs.existsSync(file))
  if (!loadError) {
    for (const file of componentFiles) {
      try {
        require(file)
      } catch (error) {
        loadError = path.relative(MP, file) + ': ' + error.message
        break
      }
    }
  }
  check('页面与组件模块可正常加载', loadError === null, loadError)
  check('16 个页面均已调用 Page()', pageModules.length === 16, '实际 ' + pageModules.length)
  check('6 个组件均已调用 Component()', componentModules.length === 6, '实际 ' + componentModules.length)
  check(
    '页面都声明了 data',
    pageModules.every((options) => options.data && typeof options.data === 'object')
  )
  check(
    '页面都定义了 onLoad',
    pageModules.every((options) => typeof options.onLoad === 'function')
  )

  console.log('\n========================')
  console.log('通过 ' + passed + ' 项，失败 ' + failures.length + ' 项')
  if (failures.length) {
    failures.forEach((item) => console.log(' - ' + item))
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error('测试运行异常:', error)
  process.exitCode = 1
})
