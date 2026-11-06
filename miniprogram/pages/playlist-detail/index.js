/**
 * 歌单详情
 * 对应 Web 端 views/PlaylistDetail.vue：
 * 播放全部、收藏、加歌 / 移除歌曲、编辑 / 删除（创建者或管理员）
 */
const api = require('../../utils/api')
const userStore = require('../../store/user')
const pagePlayer = require('../../utils/page-player')
const { toRelative } = require('../../utils/request')

Page({
  data: {
    id: 0,
    loading: true,
    playlist: null,
    songs: [],
    editable: false,
    playerSongId: 0,
    playerPlaying: false,

    addVisible: false,
    addKeyword: '',
    addLoading: false,
    candidates: [],

    editVisible: false,
    editName: '',
    editIntro: ''
  },

  onLoad(options) {
    this.setData({ id: Number(options.id) || 0 })
    this.load()
  },

  onShow() {
    pagePlayer.attach(this)
    this.syncEditable()
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
      .getPlaylist(this.data.id)
      .then((data) => {
        const playlist = (data && data.playlist) || null
        this.setData({
          playlist,
          songs: (data && data.songs) || [],
          loading: false
        })
        this.syncEditable(playlist)
        if (playlist) {
          wx.setNavigationBarTitle({ title: playlist.name || '歌单详情' })
        }
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  syncEditable(playlist) {
    const target = playlist || this.data.playlist
    if (!target) {
      this.setData({ editable: false })
      return
    }
    const snapshot = userStore.getSnapshot()
    const editable =
      snapshot.isLogin &&
      (snapshot.isAdmin || (snapshot.user && snapshot.user.id === target.userId))
    this.setData({ editable: !!editable })
  },

  onPlaySong(event) {
    pagePlayer.playFromList(this.data.songs, event.detail.index)
  },

  playAll() {
    if (!this.data.songs.length) {
      wx.showToast({ title: '这个歌单还没有歌曲', icon: 'none' })
      return
    }
    pagePlayer.playAll(this.data.songs)
    api.playPlaylist(this.data.id).catch(() => {})
  },

  toggleCollect() {
    if (!userStore.isLogin()) {
      wx.showToast({ title: '登录后才能收藏歌单', icon: 'none' })
      wx.navigateTo({ url: '/pages/login/index' })
      return
    }
    api
      .collectPlaylist(this.data.id)
      .then((collected) => {
        const playlist = Object.assign({}, this.data.playlist, {
          collected: !!collected,
          collectCount: Math.max(
            0,
            Number(this.data.playlist.collectCount || 0) + (collected ? 1 : -1)
          )
        })
        this.setData({ playlist })
        wx.showToast({ title: collected ? '收藏成功' : '已取消收藏', icon: 'none' })
      })
      .catch(() => {})
  },

  /* ==================== 添加歌曲 ==================== */
  openAdd() {
    this.setData({ addVisible: true, addKeyword: '', candidates: [] })
    this.searchCandidates()
  },

  closeAdd() {
    this.setData({ addVisible: false })
  },

  onAddInput(event) {
    this.setData({ addKeyword: event.detail.value })
  },

  searchCandidates() {
    this.setData({ addLoading: true })
    api
      .getSongPage({ keyword: (this.data.addKeyword || '').trim(), page: 1, size: 20 })
      .then((data) => {
        this.setData({ candidates: (data && data.list) || [], addLoading: false })
      })
      .catch(() => {
        this.setData({ addLoading: false })
      })
  },

  addCandidate(event) {
    const songId = Number(event.currentTarget.dataset.id)
    if (!songId) return
    if (this.data.songs.some((item) => item.id === songId)) {
      wx.showToast({ title: '这首歌已经在歌单里了', icon: 'none' })
      return
    }
    api
      .addSongToPlaylist(this.data.id, songId)
      .then(() => {
        wx.showToast({ title: '已添加到歌单', icon: 'success' })
        this.setData({ addVisible: false })
        this.load()
      })
      .catch(() => {})
  },

  /* ==================== 编辑 / 删除 ==================== */
  openEdit() {
    const playlist = this.data.playlist || {}
    this.setData({
      editVisible: true,
      editName: playlist.name || '',
      editIntro: playlist.intro || ''
    })
  },

  closeEdit() {
    this.setData({ editVisible: false })
  },

  onEditName(event) {
    this.setData({ editName: event.detail.value })
  },

  onEditIntro(event) {
    this.setData({ editIntro: event.detail.value })
  },

  saveEdit() {
    const name = (this.data.editName || '').trim()
    if (!name) {
      wx.showToast({ title: '歌单名称不能为空', icon: 'none' })
      return
    }
    api
      .updatePlaylist(this.data.id, {
        name,
        intro: this.data.editIntro || '',
        // 后端 update 会整行覆盖 cover / category，这里原样带回避免丢失
        cover: toRelative(this.data.playlist.cover),
        category: this.data.playlist.category || ''
      })
      .then(() => {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ editVisible: false })
        this.load()
      })
      .catch(() => {})
  },

  removePlaylist() {
    wx.showModal({
      title: '提示',
      content: '删除后歌单不可恢复，确定删除吗？',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        api
          .deletePlaylist(this.data.id)
          .then(() => {
            wx.showToast({ title: '已删除歌单', icon: 'success' })
            setTimeout(() => {
              const pages = getCurrentPages()
              if (pages.length > 1) wx.navigateBack()
              else wx.switchTab({ url: '/pages/playlist-square/index' })
            }, 500)
          })
          .catch(() => {})
      }
    })
  },

  removeSong(event) {
    const song = event.detail.song
    if (!song) return
    wx.showModal({
      title: '提示',
      content: '确定从歌单中移除《' + song.name + '》吗？',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        api
          .removeSongFromPlaylist(this.data.id, song.id)
          .then(() => {
            wx.showToast({ title: '已移除', icon: 'success' })
            this.load()
          })
          .catch(() => {})
      }
    })
  },

  onShareAppMessage() {
    const playlist = this.data.playlist
    return {
      title: playlist ? '歌单 · ' + playlist.name : '云音乐歌单',
      path: '/pages/playlist-detail/index?id=' + this.data.id
    }
  },

  /** 阻止弹层内部点击冒泡到遮罩 */
  noop() {}
})
