/**
 * 我的歌单：创建的歌单 / 收藏的歌单
 * 创建者可长按删除；收藏的歌单可长按取消收藏。
 */
const api = require('../../utils/api')
const userStore = require('../../store/user')
const pagePlayer = require('../../utils/page-player')

Page({
  data: {
    type: 'create',
    title: '创建的歌单',
    playlists: [],
    loading: true,
    categories: [],
    categoryNames: [],
    createVisible: false,
    formName: '',
    formIntro: '',
    categoryIndex: 0,
    playerSongId: 0,
    playerPlaying: false
  },

  onLoad(options) {
    const type = options.type === 'collect' ? 'collect' : 'create'
    const title = type === 'collect' ? '收藏的歌单' : '创建的歌单'
    this.setData({ type, title })
    wx.setNavigationBarTitle({ title })
  },

  onShow() {
    pagePlayer.attach(this)
    if (!userStore.isLogin()) {
      wx.showToast({ title: '登录后才能查看', icon: 'none' })
      wx.redirectTo({
        url:
          '/pages/login/index?redirect=' +
          encodeURIComponent('/pages/my-playlists/index?type=' + this.data.type)
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
    const request =
      this.data.type === 'collect' ? api.getCollectedPlaylists() : api.getMyPlaylists()
    return request
      .then((list) => {
        this.setData({ playlists: list || [], loading: false })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  /* ==================== 新建 ==================== */
  openCreate() {
    this.setData({ createVisible: true, formName: '', formIntro: '', categoryIndex: 0 })
    if (!this.data.categories.length) {
      api
        .getCategories()
        .then((list) => {
          const categories = list || []
          this.setData({
            categories,
            categoryNames: categories.map((item) => item.name)
          })
        })
        .catch(() => {})
    }
  },

  closeCreate() {
    this.setData({ createVisible: false })
  },

  onNameInput(event) {
    this.setData({ formName: event.detail.value })
  },

  onIntroInput(event) {
    this.setData({ formIntro: event.detail.value })
  },

  onCategoryChange(event) {
    this.setData({ categoryIndex: Number(event.detail.value) || 0 })
  },

  submitCreate() {
    const name = (this.data.formName || '').trim()
    if (!name) {
      wx.showToast({ title: '请输入歌单名称', icon: 'none' })
      return
    }
    const category = this.data.categoryNames[this.data.categoryIndex] || '流行'
    api
      .createPlaylist({ name, intro: this.data.formIntro || '', category })
      .then(() => {
        wx.showToast({ title: '歌单创建成功', icon: 'success' })
        this.setData({ createVisible: false })
        this.load()
      })
      .catch(() => {})
  },

  /* ==================== 长按操作 ==================== */
  onLongPress(event) {
    const playlist = event.detail.playlist
    if (!playlist) return
    if (this.data.type === 'create') {
      wx.showModal({
        title: '提示',
        content: '确定删除歌单《' + playlist.name + '》吗？',
        confirmColor: '#ec4141',
        success: (res) => {
          if (!res.confirm) return
          api
            .deletePlaylist(playlist.id)
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' })
              this.load()
            })
            .catch(() => {})
        }
      })
      return
    }

    api
      .collectPlaylist(playlist.id)
      .then((collected) => {
        wx.showToast({ title: collected ? '已收藏' : '已取消收藏', icon: 'none' })
        this.load()
      })
      .catch(() => {})
  },

  noop() {},

  onShareAppMessage() {
    return { title: '云音乐 · ' + this.data.title, path: '/pages/index/index' }
  }
})
