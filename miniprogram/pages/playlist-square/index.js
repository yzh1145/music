/**
 * 歌单广场：分类筛选 + 分页加载
 * 对应 Web 端 views/PlaylistSquare.vue
 */
const api = require('../../utils/api')
const pagePlayer = require('../../utils/page-player')

const PAGE_SIZE = 18

Page({
  data: {
    categories: [{ id: 0, name: '全部' }],
    activeCategory: '全部',
    playlists: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: false,
    playerSongId: 0,
    playerPlaying: false
  },

  onLoad() {
    this.loadCategories()
    this.load(true)
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
    this.load(true).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.load(false)
    }
  },

  loadCategories() {
    api
      .getCategories()
      .then((list) => {
        this.setData({ categories: [{ id: 0, name: '全部' }].concat(list || []) })
      })
      .catch(() => {})
  },

  load(reset) {
    const page = reset ? 1 : this.data.page + 1
    const params = { page, size: PAGE_SIZE }
    if (this.data.activeCategory !== '全部') {
      params.category = this.data.activeCategory
    }

    // 防止切换分类后旧请求晚到，覆盖新分类的结果
    const seq = (this.__loadSeq || 0) + 1
    this.__loadSeq = seq

    this.setData({ loading: true })
    return api
      .getPlaylistPage(params)
      .then((data) => {
        if (seq !== this.__loadSeq) return
        const list = (data && data.list) || []
        const total = (data && data.total) || 0
        const playlists = reset ? list : this.data.playlists.concat(list)
        this.setData({
          playlists,
          total,
          page,
          loading: false,
          hasMore: playlists.length < total
        })
      })
      .catch(() => {
        if (seq === this.__loadSeq) this.setData({ loading: false })
      })
  },

  changeCategory(event) {
    const name = event.currentTarget.dataset.name
    if (!name || name === this.data.activeCategory) return
    this.setData({ activeCategory: name, playlists: [], page: 1 })
    this.load(true)
  },

  onShareAppMessage() {
    return {
      title: '云音乐 · 歌单广场',
      path: '/pages/playlist-square/index'
    }
  }
})
