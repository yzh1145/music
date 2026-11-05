import { defineStore } from 'pinia'
import { playSong, recordHistory } from '../api'

/**
 * 全局播放器：一个 Audio 实例 + 播放队列 + 播放模式。
 * 播放条与歌曲详情页共享这里的状态，实现跨页面连续播放。
 */
export const usePlayerStore = defineStore('player', {
  state: () => ({
    queue: [],
    index: -1,
    playing: false,
    mode: 'order', // order 列表循环 | single 单曲循环 | random 随机
    volume: Number(localStorage.getItem('music_volume') || 0.8),
    currentTime: 0,
    duration: 0,
    audio: null,
    detailVisible: false
  }),
  getters: {
    current: (state) => state.queue[state.index] || null,
    hasSong: (state) => state.queue.length > 0 && state.index >= 0
  },
  actions: {
    initAudio() {
      if (this.audio) return
      const audio = new Audio()
      audio.preload = 'metadata'
      audio.volume = this.volume
      audio.addEventListener('timeupdate', () => {
        this.currentTime = audio.currentTime
      })
      audio.addEventListener('loadedmetadata', () => {
        this.duration = audio.duration || this.current?.duration || 0
      })
      audio.addEventListener('play', () => {
        this.playing = true
      })
      audio.addEventListener('pause', () => {
        this.playing = false
      })
      audio.addEventListener('ended', () => {
        this.handleEnded()
      })
      this.audio = audio
    },
    /** 播放整个列表 */
    async playList(songs, startIndex = 0) {
      if (!songs || songs.length === 0) return
      this.queue = songs.slice()
      this.index = Math.min(Math.max(startIndex, 0), songs.length - 1)
      await this.playCurrent()
    },
    /** 播放单曲；传入列表时会把列表作为播放队列 */
    async playOne(song, list = null) {
      if (!song) return
      if (list && list.length) {
        this.queue = list.slice()
        this.index = list.findIndex((item) => item.id === song.id)
        if (this.index < 0) {
          this.queue.unshift(song)
          this.index = 0
        }
      } else {
        this.queue = [song]
        this.index = 0
      }
      await this.playCurrent()
    },
    async playCurrent() {
      this.initAudio()
      const song = this.current
      if (!song) return
      this.audio.src = song.audioUrl
      this.currentTime = 0
      this.duration = song.duration || 0
      try {
        await this.audio.play()
      } catch {
        // 浏览器可能因自动播放策略拦截，忽略即可
      }
      // 播放量与播放历史：失败不影响播放
      playSong(song.id).catch(() => {})
      if (localStorage.getItem('music_token')) {
        recordHistory(song.id).catch(() => {})
      }
    },
    toggle() {
      if (!this.hasSong) return
      this.initAudio()
      if (this.audio.paused) {
        this.audio.play().catch(() => {})
      } else {
        this.audio.pause()
      }
    },
    handleEnded() {
      if (this.mode === 'single') {
        this.audio.currentTime = 0
        this.audio.play().catch(() => {})
        return
      }
      this.next()
    },
    next(auto = false) {
      if (!this.hasSong) return
      if (this.mode === 'random' && this.queue.length > 1) {
        let nextIndex = this.index
        while (nextIndex === this.index) {
          nextIndex = Math.floor(Math.random() * this.queue.length)
        }
        this.index = nextIndex
      } else {
        this.index = (this.index + 1) % this.queue.length
        // 列表循环时从最后一首回到第一首；自动播放继续
        if (!auto && this.index === 0 && this.queue.length > 1) {
          // 手动点击“下一首”同样允许回到第一首
        }
      }
      this.playCurrent()
    },
    prev() {
      if (!this.hasSong) return
      if (this.audio && this.audio.currentTime > 5) {
        this.audio.currentTime = 0
        return
      }
      this.index = (this.index - 1 + this.queue.length) % this.queue.length
      this.playCurrent()
    },
    seek(seconds) {
      if (!this.audio) return
      this.audio.currentTime = seconds
      this.currentTime = seconds
    },
    setVolume(value) {
      this.volume = value
      if (this.audio) this.audio.volume = value
      localStorage.setItem('music_volume', String(value))
    },
    setMode(mode) {
      this.mode = mode
    },
    /** 从队列移除某首歌（例如取消喜欢后） */
    removeFromQueue(songId) {
      const index = this.queue.findIndex((item) => item.id === songId)
      if (index < 0) return
      this.queue.splice(index, 1)
      if (this.index > index) this.index -= 1
      if (this.index >= this.queue.length) this.index = this.queue.length - 1
      if (this.queue.length === 0) {
        this.audio?.pause()
        this.index = -1
      }
    },
    openDetail() {
      this.detailVisible = true
    },
    closeDetail() {
      this.detailVisible = false
    }
  }
})
