/**
 * 歌曲播放页
 * 对应 Web 端 views/SongDetail.vue：黑胶唱片、LRC 歌词滚动、点赞、
 * 添加到歌单、播放队列，以及听友评论。
 */
const api = require('../../utils/api')
const player = require('../../store/player')
const userStore = require('../../store/user')
const format = require('../../utils/format')

const LYRIC_LINE_HEIGHT = 84
const LYRIC_VIEW_HEIGHT = 560

const MODE_TEXT = {
  order: '列表循环',
  single: '单曲循环',
  random: '随机播放'
}

Page({
  data: {
    id: 0,
    loading: true,
    song: null,
    lyrics: [],
    activeLyricIndex: -1,
    scrollTop: 0,
    isCurrent: false,
    playing: false,
    liked: false,
    currentTime: 0,
    duration: 0,
    progressValue: 0,
    currentText: '00:00',
    durationText: '00:00',
    modeText: '列表循环',
    pickerVisible: false,
    queueVisible: false,
    queue: [],
    currentIndex: -1
  },

  onLoad(options) {
    this.seeking = false
    // scroll-top 的单位是 px，而样式里的行高是 rpx，这里换算一次
    try {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this.rpxRatio = (info.windowWidth || 375) / 750
    } catch (e) {
      this.rpxRatio = 0.5
    }
    this.setData({ id: Number(options.id) || 0 })
    this.load()
  },

  onShow() {
    if (this.__handler) return
    this.__handler = (snapshot) => this.applyPlayer(snapshot)
    player.subscribe(this.__handler)
  },

  onHide() {
    if (this.__handler) player.unsubscribe(this.__handler)
    this.__handler = null
  },

  onUnload() {
    if (this.__handler) player.unsubscribe(this.__handler)
    this.__handler = null
  },

  load() {
    if (!this.data.id) return
    this.setData({ loading: true })
    api
      .getSong(this.data.id)
      .then((song) => {
        const lyrics = format.parseLyric(song.lyric)
        this.setData(
          {
            song,
            lyrics,
            liked: !!song.liked,
            loading: false
          },
          () => {
            this.applyPlayer(player.getSnapshot())
            this.updateLyric()
          }
        )
        wx.setNavigationBarTitle({ title: song.name || '正在播放' })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  applyPlayer(snapshot) {
    const song = this.data.song
    if (!song) return
    const isCurrent = !!(snapshot.song && snapshot.song.id === song.id)
    const duration = isCurrent ? snapshot.duration : Number(song.duration) || 0
    const currentTime = isCurrent ? snapshot.currentTime : 0

    const patch = {
      isCurrent,
      playing: isCurrent && snapshot.playing,
      duration,
      currentTime,
      currentText: format.formatDuration(currentTime),
      durationText: format.formatDuration(duration),
      modeText: MODE_TEXT[snapshot.mode] || '列表循环'
    }
    if (!this.seeking) patch.progressValue = currentTime
    if (isCurrent) patch.liked = !!snapshot.song.liked

    this.setData(patch, () => {
      if (isCurrent) this.updateLyric()
    })
  },

  updateLyric() {
    const lyrics = this.data.lyrics
    if (!lyrics.length) {
      if (this.data.activeLyricIndex !== -1) {
        this.setData({ activeLyricIndex: -1, scrollTop: 0 })
      }
      return
    }
    const time = this.data.currentTime + 0.2
    let index = -1
    for (let i = 0; i < lyrics.length; i += 1) {
      if (lyrics[i].time <= time) index = i
      else break
    }
    if (index === this.data.activeLyricIndex) return

    const offset = Math.max(
      0,
      index * LYRIC_LINE_HEIGHT - (LYRIC_VIEW_HEIGHT / 2 - LYRIC_LINE_HEIGHT / 2)
    )
    this.setData({
      activeLyricIndex: index,
      scrollTop: Math.round(offset * (this.rpxRatio || 0.5))
    })
  },

  onPlay() {
    if (!this.data.song) return
    if (this.data.isCurrent) {
      player.toggle()
      return
    }
    player.playOne(this.data.song)
  },

  onPrev() {
    player.prev()
  },

  onNext() {
    player.next()
  },

  onMode() {
    player.cycleMode()
    const mode = player.getSnapshot().mode
    wx.showToast({ title: MODE_TEXT[mode] || '列表循环', icon: 'none' })
  },

  onSeeking() {
    this.seeking = true
  },

  onSeekEnd(event) {
    this.seeking = false
    const value = Number(event.detail.value) || 0
    if (this.data.isCurrent) player.seek(value)
    this.setData({ progressValue: value, currentTime: value, currentText: format.formatDuration(value) })
  },

  onLyricTap(event) {
    if (!this.data.isCurrent) return
    const index = Number(event.currentTarget.dataset.index)
    const line = this.data.lyrics[index]
    if (!line) return
    player.seek(line.time)
    if (!player.getSnapshot().playing) player.toggle()
  },

  toggleLike() {
    if (!userStore.isLogin()) {
      wx.showToast({ title: '登录后才能收藏喜欢的音乐', icon: 'none' })
      wx.navigateTo({ url: '/pages/login/index' })
      return
    }
    const song = this.data.song
    if (!song) return
    api
      .likeSong(song.id)
      .then((liked) => {
        this.setData({ liked: !!liked })
        player.setSongLiked(song.id, liked)
        wx.showToast({ title: liked ? '已添加到我喜欢的音乐' : '已取消喜欢', icon: 'none' })
      })
      .catch(() => {})
  },

  openPicker() {
    if (!userStore.isLogin()) {
      wx.showToast({ title: '登录后才能添加歌曲到歌单', icon: 'none' })
      wx.navigateTo({ url: '/pages/login/index' })
      return
    }
    this.setData({ pickerVisible: true })
  },

  closePicker() {
    this.setData({ pickerVisible: false })
  },

  openQueue() {
    this.setData({
      queueVisible: true,
      queue: player.getQueue(),
      currentIndex: player.getSnapshot().index
    })
  },

  closeQueue() {
    this.setData({ queueVisible: false })
  },

  onQueueItem(event) {
    const index = Number(event.currentTarget.dataset.index)
    const queue = this.data.queue
    if (!queue.length) return
    this.setData({ queueVisible: false })
    player.playList(queue, index)
  },

  openSinger() {
    const song = this.data.song
    if (song && song.singerId) {
      wx.navigateTo({ url: '/pages/singer-detail/index?id=' + song.singerId })
    }
  },

  openAlbum() {
    const song = this.data.song
    if (song && song.albumId) {
      wx.navigateTo({ url: '/pages/album-detail/index?id=' + song.albumId })
    }
  },

  noop() {},

  onShareAppMessage() {
    const song = this.data.song
    return {
      title: song ? '我正在听《' + song.name + '》' : '云音乐',
      path: '/pages/song-detail/index?id=' + this.data.id
    }
  }
})
