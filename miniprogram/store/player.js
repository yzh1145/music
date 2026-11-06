/**
 * 全局播放器
 *
 * 与 Web 端 Pinia player store 对应：一个 InnerAudioContext 实例 + 播放队列 + 播放模式。
 * 播放条、歌曲页、列表页共享同一份状态，实现跨页面连续播放。
 *
 * 说明：
 * - app.json 声明了 requiredBackgroundModes: ["audio"]，配合 InnerAudioContext
 *   可以在小程序切后台后继续播放（iOS 需要在真机上验证）
 * - 通知分两类：'state'（换歌 / 播放暂停）与 'time'（进度，做了 300ms 节流），
 *   避免进度回调每秒多次 setData
 */
const api = require('../utils/api')
const auth = require('../utils/auth')
const { resolveMedia } = require('../utils/request')

const MODE_KEY = 'music_player_mode'
const MODES = ['order', 'single', 'random']

const state = {
  queue: [],
  index: -1,
  playing: false,
  mode: 'order',
  currentTime: 0,
  duration: 0
}

const listeners = []
let audio = null
let loadedSongId = 0
let lastTimeNotify = 0

function current() {
  return state.index >= 0 ? state.queue[state.index] : null
}

function snapshot() {
  const song = current()
  return {
    queueLength: state.queue.length,
    index: state.index,
    song: song
      ? {
          id: song.id,
          name: song.name,
          singerId: song.singerId,
          singerName: song.singerName,
          albumId: song.albumId,
          albumName: song.albumName,
          cover: song.cover,
          audioUrl: song.audioUrl,
          duration: song.duration,
          liked: !!song.liked
        }
      : null,
    playing: state.playing,
    mode: state.mode,
    currentTime: state.currentTime,
    duration: state.duration,
    hasSong: !!song
  }
}

function notify(type) {
  const snap = snapshot()
  listeners.slice().forEach((handler) => {
    try {
      handler(snap, type || 'state')
    } catch (e) {
      console.error('[player] listener error', e)
    }
  })
}

function notifyTime() {
  const now = Date.now()
  if (now - lastTimeNotify < 300) return
  lastTimeNotify = now
  notify('time')
}

function subscribe(handler) {
  if (typeof handler !== 'function') return function noop() {}
  listeners.push(handler)
  handler(snapshot(), 'state')
  return function unsubscribe() {
    const index = listeners.indexOf(handler)
    if (index !== -1) listeners.splice(index, 1)
  }
}

function unsubscribe(handler) {
  const index = listeners.indexOf(handler)
  if (index !== -1) listeners.splice(index, 1)
}

function init() {
  let mode = 'order'
  try {
    const saved = wx.getStorageSync(MODE_KEY)
    if (MODES.indexOf(saved) !== -1) mode = saved
  } catch (e) {
    mode = 'order'
  }
  state.mode = mode
}

function ensureAudio() {
  if (audio) return audio
  audio = wx.createInnerAudioContext({ useWebAudioImplement: false })
  audio.obeyMuteSwitch = false

  audio.onCanplay(() => {
    const total = Number(audio.duration)
    if (total > 0) {
      state.duration = total
      notify('time')
    }
  })

  audio.onPlay(() => {
    state.playing = true
    notify('state')
  })

  audio.onPause(() => {
    state.playing = false
    notify('state')
  })

  audio.onStop(() => {
    state.playing = false
    state.currentTime = 0
    notify('state')
  })

  audio.onEnded(() => {
    handleEnded()
  })

  audio.onTimeUpdate(() => {
    state.currentTime = Number(audio.currentTime) || 0
    const total = Number(audio.duration)
    if (total > 0 && !state.duration) state.duration = total
    notifyTime()
  })

  audio.onError((error) => {
    state.playing = false
    notify('state')
    console.error('[player] audio error', error)
    wx.showToast({ title: '音频加载失败，请检查地址', icon: 'none' })
  })

  return audio
}

function reportPlay(song) {
  if (!song || !song.id) return
  api.playSong(song.id).catch(() => {})
  if (auth.isLogin()) {
    api.recordHistory(song.id).catch(() => {})
  }
}

function playCurrent() {
  const song = current()
  if (!song) return
  if (!song.audioUrl) {
    wx.showToast({ title: '这首歌暂时没有音频', icon: 'none' })
    return
  }

  const player = ensureAudio()
  state.currentTime = 0
  state.duration = Number(song.duration) || 0
  state.playing = true
  loadedSongId = song.id
  lastTimeNotify = 0

  player.src = resolveMedia(song.audioUrl)
  player.play()
  notify('state')
  reportPlay(song)
}

function playList(songs, startIndex) {
  if (!songs || !songs.length) return
  state.queue = songs.slice()
  const index = Number(startIndex) || 0
  state.index = Math.min(Math.max(index, 0), state.queue.length - 1)
  playCurrent()
}

function playOne(song, list) {
  if (!song) return
  if (list && list.length) {
    state.queue = list.slice()
    state.index = state.queue.findIndex((item) => item.id === song.id)
    if (state.index < 0) {
      state.queue.unshift(song)
      state.index = 0
    }
  } else {
    state.queue = [song]
    state.index = 0
  }
  playCurrent()
}

function toggle() {
  const song = current()
  if (!song) return
  const player = ensureAudio()
  if (state.playing) {
    player.pause()
    state.playing = false
    notify('state')
    return
  }
  if (loadedSongId !== song.id) {
    playCurrent()
    return
  }
  player.play()
  state.playing = true
  notify('state')
}

function next() {
  if (!state.queue.length) return
  if (state.mode === 'random' && state.queue.length > 1) {
    let nextIndex = state.index
    while (nextIndex === state.index) {
      nextIndex = Math.floor(Math.random() * state.queue.length)
    }
    state.index = nextIndex
  } else {
    state.index = (state.index + 1) % state.queue.length
  }
  playCurrent()
}

function prev() {
  if (!current()) return
  if (state.currentTime > 5) {
    seek(0)
    return
  }
  state.index = (state.index - 1 + state.queue.length) % state.queue.length
  playCurrent()
}

function handleEnded() {
  if (state.mode === 'single') {
    const player = ensureAudio()
    player.seek(0)
    player.play()
    return
  }
  next()
}

function seek(seconds) {
  const player = ensureAudio()
  const total = Number(state.duration) || Number(current() && current().duration) || 0
  const target = Math.max(0, Math.min(Number(seconds) || 0, total))
  player.seek(target)
  state.currentTime = target
  notify('time')
}

function setMode(mode) {
  if (MODES.indexOf(mode) === -1) return
  state.mode = mode
  try {
    wx.setStorageSync(MODE_KEY, mode)
  } catch (e) {
    // 忽略缓存写入失败
  }
  notify('state')
}

function cycleMode() {
  const index = MODES.indexOf(state.mode)
  setMode(MODES[(index + 1) % MODES.length])
}

function removeFromQueue(songId) {
  const index = state.queue.findIndex((item) => item.id === songId)
  if (index < 0) return
  const removingCurrent = index === state.index
  state.queue.splice(index, 1)

  if (!state.queue.length) {
    if (audio) audio.stop()
    state.index = -1
    state.playing = false
    state.currentTime = 0
    notify('state')
    return
  }

  if (index < state.index) {
    state.index -= 1
  } else if (removingCurrent) {
    state.index = Math.min(state.index, state.queue.length - 1)
    playCurrent()
    return
  }
  notify('state')
}

function stop() {
  if (audio) audio.stop()
  state.playing = false
  notify('state')
}

/** 同步「喜欢」状态到播放队列，保证播放条与歌曲页上的红心一致 */
function setSongLiked(songId, liked) {
  let changed = false
  state.queue.forEach((item) => {
    if (item.id === songId) {
      item.liked = !!liked
      changed = true
    }
  })
  if (changed) notify('state')
}

function getQueue() {
  return state.queue.slice()
}

function getCurrent() {
  return current()
}

function getSnapshot() {
  return snapshot()
}

module.exports = {
  init,
  subscribe,
  unsubscribe,
  getSnapshot,
  getQueue,
  getCurrent,
  playList,
  playOne,
  playCurrent,
  toggle,
  next,
  prev,
  seek,
  setMode,
  cycleMode,
  removeFromQueue,
  setSongLiked,
  stop
}
