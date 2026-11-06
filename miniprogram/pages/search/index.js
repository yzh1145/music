/**
 * 搜索页：综合 / 单曲 / 歌单 / 歌手 / 专辑
 * 对应 Web 端 views/Search.vue，搜索历史保存在本地缓存。
 */
const api = require('../../utils/api')
const pagePlayer = require('../../utils/page-player')

const HISTORY_KEY = 'music_search_history'
const HOT_KEYWORDS = ['夏', '夜', 'City Pop', '摇滚', '民谣']

Page({
  data: {
    keyword: '',
    searched: '',
    activeTab: 'all',
    loading: false,
    hotKeywords: HOT_KEYWORDS,
    history: [],
    result: {
      songs: [],
      playlists: [],
      singers: [],
      albums: [],
      songTotal: 0,
      playlistTotal: 0,
      singerTotal: 0,
      albumTotal: 0
    },
    hasResult: false,
    songsPreview: [],
    playlistsPreview: [],
    singersPreview: [],
    albumsPreview: [],
    playerSongId: 0,
    playerPlaying: false
  },

  onLoad() {
    this.setData({ history: this.readHistory() })
  },

  onShow() {
    pagePlayer.attach(this)
    this.setData({ history: this.readHistory() })
  },

  onHide() {
    pagePlayer.detach(this)
  },

  onUnload() {
    pagePlayer.detach(this)
  },

  readHistory() {
    try {
      const list = wx.getStorageSync(HISTORY_KEY)
      return Array.isArray(list) ? list : []
    } catch (e) {
      return []
    }
  },

  saveHistory(keyword) {
    const list = [keyword].concat(this.data.history.filter((item) => item !== keyword)).slice(0, 10)
    this.setData({ history: list })
    try {
      wx.setStorageSync(HISTORY_KEY, list)
    } catch (e) {
      // 忽略缓存写入失败
    }
  },

  clearHistory() {
    this.setData({ history: [] })
    wx.removeStorageSync(HISTORY_KEY)
  },

  onInput(event) {
    this.setData({ keyword: event.detail.value })
  },

  onConfirm() {
    this.doSearch(this.data.keyword)
  },

  onClear() {
    this.setData({ keyword: '' })
  },

  onHistoryTap(event) {
    const keyword = event.currentTarget.dataset.keyword
    this.setData({ keyword })
    this.doSearch(keyword)
  },

  doSearch(value) {
    const keyword = String(value || '').trim()
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }
    this.saveHistory(keyword)
    this.setData({ searched: keyword, keyword, loading: true, activeTab: 'all' })

    // 连续搜索时只接受最后一次请求的结果
    const seq = (this.__searchSeq || 0) + 1
    this.__searchSeq = seq

    api
      .search(keyword, 30)
      .then((data) => {
        if (seq !== this.__searchSeq) return
        const result = data || {}
        const total =
          Number(result.songTotal || 0) +
          Number(result.playlistTotal || 0) +
          Number(result.singerTotal || 0) +
          Number(result.albumTotal || 0)
        const songs = result.songs || []
        const playlists = result.playlists || []
        const singers = result.singers || []
        const albums = result.albums || []
        this.setData({
          result: {
            songs,
            playlists,
            singers,
            albums,
            songTotal: result.songTotal || 0,
            playlistTotal: result.playlistTotal || 0,
            singerTotal: result.singerTotal || 0,
            albumTotal: result.albumTotal || 0
          },
          songsPreview: songs.slice(0, 6),
          playlistsPreview: playlists.slice(0, 4),
          singersPreview: singers.slice(0, 8),
          albumsPreview: albums.slice(0, 6),
          hasResult: total > 0,
          loading: false
        })
      })
      .catch(() => {
        if (seq === this.__searchSeq) this.setData({ loading: false })
      })
  },

  switchTab(event) {
    this.setData({ activeTab: event.currentTarget.dataset.tab })
  },

  onPlaySong(event) {
    pagePlayer.playFromList(this.data.result.songs, event.detail.index)
  },

  openSinger(event) {
    wx.navigateTo({ url: '/pages/singer-detail/index?id=' + event.currentTarget.dataset.id })
  },

  openAlbum(event) {
    wx.navigateTo({ url: '/pages/album-detail/index?id=' + event.currentTarget.dataset.id })
  },

  onShareAppMessage() {
    return {
      title: '云音乐 · 搜索「' + this.data.searched + '」',
      path: '/pages/index/index'
    }
  }
})
