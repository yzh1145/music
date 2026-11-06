/**
 * 歌手详情
 * 对应 Web 端 views/SingerDetail.vue：关注、热门歌曲、专辑列表
 */
const api = require('../../utils/api')
const userStore = require('../../store/user')
const pagePlayer = require('../../utils/page-player')

Page({
  data: {
    id: 0,
    loading: true,
    singer: null,
    songs: [],
    albums: [],
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
      .getSinger(this.data.id)
      .then((data) => {
        const singer = (data && data.singer) || null
        this.setData({
          singer,
          songs: (data && data.songs) || [],
          albums: (data && data.albums) || [],
          loading: false
        })
        if (singer) wx.setNavigationBarTitle({ title: singer.name || '歌手' })
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
      wx.showToast({ title: '这位歌手还没有歌曲', icon: 'none' })
      return
    }
    pagePlayer.playAll(this.data.songs)
  },

  toggleFollow() {
    if (!userStore.isLogin()) {
      wx.showToast({ title: '登录后才能关注歌手', icon: 'none' })
      wx.navigateTo({ url: '/pages/login/index' })
      return
    }
    api
      .followSinger(this.data.id)
      .then((followed) => {
        const singer = Object.assign({}, this.data.singer, {
          followed: !!followed,
          followCount: Math.max(
            0,
            Number(this.data.singer.followCount || 0) + (followed ? 1 : -1)
          )
        })
        this.setData({ singer })
        wx.showToast({ title: followed ? '已关注' : '已取消关注', icon: 'none' })
      })
      .catch(() => {})
  },

  openAlbum(event) {
    wx.navigateTo({ url: '/pages/album-detail/index?id=' + event.currentTarget.dataset.id })
  },

  onShareAppMessage() {
    const singer = this.data.singer
    return {
      title: singer ? '歌手 · ' + singer.name : '云音乐歌手',
      path: '/pages/singer-detail/index?id=' + this.data.id
    }
  }
})
