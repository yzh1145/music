/**
 * 专辑详情
 * 对应 Web 端 views/AlbumDetail.vue
 */
const api = require('../../utils/api')
const pagePlayer = require('../../utils/page-player')

Page({
  data: {
    id: 0,
    loading: true,
    album: null,
    songs: [],
    playerSongId: 0,
    playerPlaying: false
  },

  onLoad(options) {
    this.setData({ id: Number(options.id) || 0 })
    this.load()
  },

  onShow() {
    pagePlayer.attach(this)
  },

  onHide() {
    pagePlayer.detach(this)
  },

  onUnload() {
    pagePlayer.detach(this)
  },

  load() {
    if (!this.data.id) return
    this.setData({ loading: true })
    api
      .getAlbum(this.data.id)
      .then((data) => {
        const album = (data && data.album) || null
        this.setData({
          album,
          songs: (data && data.songs) || [],
          loading: false
        })
        if (album) wx.setNavigationBarTitle({ title: album.name || '专辑' })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  onPlaySong(event) {
    pagePlayer.playFromList(this.data.songs, event.detail.index)
  },

  playAll() {
    if (!this.data.songs.length) {
      wx.showToast({ title: '这张专辑还没有歌曲', icon: 'none' })
      return
    }
    pagePlayer.playAll(this.data.songs)
  },

  openSinger() {
    const album = this.data.album
    if (album && album.singerId) {
      wx.navigateTo({ url: '/pages/singer-detail/index?id=' + album.singerId })
    }
  },

  onShareAppMessage() {
    const album = this.data.album
    return {
      title: album ? '专辑 · ' + album.name : '云音乐专辑',
      path: '/pages/album-detail/index?id=' + this.data.id
    }
  }
})
