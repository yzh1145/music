/**
 * 发现音乐（首页）
 * 对应 Web 端 views/Home.vue：轮播图、推荐歌单、推荐单曲、新歌速递、热门歌手
 */
const api = require('../../utils/api')
const pagePlayer = require('../../utils/page-player')

Page({
  data: {
    loading: true,
    banners: [],
    recommendPlaylists: [],
    recommendSongs: [],
    newSongs: [],
    hotSingers: [],
    skeletons: [1, 2, 3],
    playerSongId: 0,
    playerPlaying: false
  },

  onLoad() {
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

  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh())
  },

  load() {
    this.setData({ loading: true })
    return api
      .getHome()
      .then((data) => {
        const home = data || {}
        this.setData({
          loading: false,
          banners: home.banners || [],
          recommendPlaylists: home.recommendPlaylists || [],
          recommendSongs: home.recommendSongs || [],
          newSongs: home.newSongs || [],
          hotSingers: home.hotSingers || []
        })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  goSearch() {
    wx.switchTab({ url: '/pages/search/index' })
  },

  goPlaylistSquare() {
    wx.switchTab({ url: '/pages/playlist-square/index' })
  },

  onBannerTap(event) {
    const banner = this.data.banners[Number(event.currentTarget.dataset.index)]
    if (!banner) return
    // 与 Web 端一致：1 歌单、2 歌手、3 歌曲
    if (Number(banner.linkType) === 1) {
      wx.navigateTo({ url: '/pages/playlist-detail/index?id=' + banner.linkId })
    } else if (Number(banner.linkType) === 2) {
      wx.navigateTo({ url: '/pages/singer-detail/index?id=' + banner.linkId })
    } else if (Number(banner.linkType) === 3) {
      wx.navigateTo({ url: '/pages/song-detail/index?id=' + banner.linkId })
    }
  },

  onPlaySong(event) {
    const listType = event.detail.listKey
    const songs = listType === 'new' ? this.data.newSongs : this.data.recommendSongs
    pagePlayer.playFromList(songs, event.detail.index)
  },

  openSinger(event) {
    const id = Number(event.currentTarget.dataset.id)
    if (!id) return
    wx.navigateTo({ url: '/pages/singer-detail/index?id=' + id })
  },

  onShareAppMessage() {
    return {
      title: '云音乐 · 发现好音乐',
      path: '/pages/index/index'
    }
  }
})
