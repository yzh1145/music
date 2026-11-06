/**
 * 歌曲集合页：我喜欢的音乐 / 播放历史
 * 对应 Web 端 MyMusic.vue 的「我喜欢的音乐」与「播放历史」两个面板。
 */
const api = require('../../utils/api')
const pagePlayer = require('../../utils/page-player')
const format = require('../../utils/format')
const userStore = require('../../store/user')

Page({
  data: {
    type: 'like',
    title: '我喜欢的音乐',
    isHistory: false,
    songs: [],
    loading: true,
    playerSongId: 0,
    playerPlaying: false
  },

  onLoad(options) {
    const type = options.type === 'history' ? 'history' : 'like'
    const title = type === 'history' ? '播放历史' : '我喜欢的音乐'
    this.setData({ type, title, isHistory: type === 'history' })
    wx.setNavigationBarTitle({ title })
  },

  onShow() {
    pagePlayer.attach(this)
    if (!userStore.isLogin()) {
      wx.showToast({ title: '登录后才能查看', icon: 'none' })
      wx.redirectTo({
        url:
          '/pages/login/index?redirect=' +
          encodeURIComponent('/pages/my-songs/index?type=' + this.data.type)
      })
      return
    }
    this.load()
  },

  onHide() {
    pagePlayer.detach(this)
  },

  onUnload() {
    pagePlayer.detach(this)
  },

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh())
  },

  load() {
    this.setData({ loading: true })
    const request = this.data.isHistory ? api.getHistory(100) : api.getLikeSongs()
    return request
      .then((list) => {
        const songs = (list || []).map((song) => {
          if (!this.data.isHistory) return song
          return Object.assign({}, song, {
            playTimeText: format.formatDateTime(song.playTime)
          })
        })
        this.setData({ songs, loading: false })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  onPlaySong(event) {
    pagePlayer.playFromList(this.data.songs, event.detail.index)
  },

  playAll() {
    pagePlayer.playAll(this.data.songs)
  },

  clearHistory() {
    wx.showModal({
      title: '提示',
      content: '确定清空全部播放历史吗？',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        api
          .clearHistory()
          .then(() => {
            this.setData({ songs: [] })
            wx.showToast({ title: '已清空播放历史', icon: 'success' })
          })
          .catch(() => {})
      }
    })
  }
})
