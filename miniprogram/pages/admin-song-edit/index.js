/**
 * 后台 · 新增 / 编辑歌曲
 * 字段与后端 Song 实体、Web 端 Admin.vue 的歌曲表单保持一致。
 */
const api = require('../../utils/api')
const userStore = require('../../store/user')
const { resolveMedia, toRelative } = require('../../utils/request')

Page({
  data: {
    id: 0,
    isEdit: false,
    loading: true,
    saving: false,
    singers: [],
    singerNames: [],
    albums: [],
    albumNames: ['无专辑'],
    categories: [],
    categoryNames: [],
    singerIndex: 0,
    albumIndex: 0,
    categoryIndex: 0,
    coverPreview: '',
    form: {
      name: '',
      cover: '',
      audioUrl: '',
      duration: '',
      lyric: '',
      isRecommend: false,
      status: true
    }
  },

  onLoad(options) {
    if (!userStore.isAdmin()) {
      wx.showToast({ title: '仅管理员可访问', icon: 'none' })
      setTimeout(() => this.goBackSafe(), 600)
      return
    }
    const id = Number(options.id) || 0
    this.setData({ id, isEdit: id > 0 })
    wx.setNavigationBarTitle({ title: id > 0 ? '编辑歌曲' : '新增歌曲' })
    this.loadLookups().then(() => {
      if (id > 0) this.loadSong(id)
      else this.setData({ loading: false })
    })
  },

  goBackSafe() {
    if (getCurrentPages().length > 1) wx.navigateBack()
    else wx.switchTab({ url: '/pages/my/index' })
  },

  loadLookups() {
    return Promise.all([
      api.getSingerPage({ page: 1, size: 100 }).catch(() => ({ list: [] })),
      api.getAlbumPage({ page: 1, size: 100 }).catch(() => ({ list: [] })),
      api.getCategories().catch(() => [])
    ]).then(([singerData, albumData, categories]) => {
      const singers = (singerData && singerData.list) || []
      const albums = (albumData && albumData.list) || []
      const list = categories || []
      this.setData({
        singers,
        singerNames: singers.map((item) => item.name),
        albums,
        albumNames: ['无专辑'].concat(albums.map((item) => item.name)),
        categories: list,
        categoryNames: list.map((item) => item.name)
      })
    })
  },

  loadSong(id) {
    api
      .getSong(id)
      .then((song) => {
        const singerIndex = Math.max(
          0,
          this.data.singers.findIndex((item) => item.id === song.singerId)
        )
        const albumIndex = song.albumId
          ? Math.max(0, this.data.albums.findIndex((item) => item.id === song.albumId) + 1)
          : 0
        const categoryIndex = Math.max(
          0,
          this.data.categories.findIndex((item) => item.id === song.categoryId)
        )
        this.setData({
          loading: false,
          singerIndex,
          albumIndex,
          categoryIndex,
          coverPreview: resolveMedia(song.cover),
          form: {
            name: song.name || '',
            cover: toRelative(song.cover),
            audioUrl: toRelative(song.audioUrl),
            duration: song.duration === null || song.duration === undefined ? '' : String(song.duration),
            lyric: song.lyric || '',
            isRecommend: Number(song.isRecommend) === 1,
            status: Number(song.status) !== 0
          }
        })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  onNameInput(event) {
    this.setData({ 'form.name': event.detail.value })
  },

  onCoverInput(event) {
    const cover = event.detail.value
    this.setData({
      'form.cover': cover,
      coverPreview: resolveMedia(cover)
    })
  },

  onAudioInput(event) {
    this.setData({ 'form.audioUrl': event.detail.value })
  },

  onDurationInput(event) {
    this.setData({ 'form.duration': event.detail.value })
  },

  onLyricInput(event) {
    this.setData({ 'form.lyric': event.detail.value })
  },

  onSingerChange(event) {
    this.setData({ singerIndex: Number(event.detail.value) || 0 })
  },

  onAlbumChange(event) {
    this.setData({ albumIndex: Number(event.detail.value) || 0 })
  },

  onCategoryChange(event) {
    this.setData({ categoryIndex: Number(event.detail.value) || 0 })
  },

  onRecommendChange(event) {
    this.setData({ 'form.isRecommend': event.detail.value })
  },

  onStatusChange(event) {
    this.setData({ 'form.status': event.detail.value })
  },

  save() {
    const form = this.data.form
    const name = (form.name || '').trim()
    if (!name) {
      wx.showToast({ title: '歌曲名不能为空', icon: 'none' })
      return
    }
    const singer = this.data.singers[this.data.singerIndex]
    if (!singer) {
      wx.showToast({ title: '请选择歌手', icon: 'none' })
      return
    }
    const album = this.data.albumIndex > 0 ? this.data.albums[this.data.albumIndex - 1] : null
    const category = this.data.categories[this.data.categoryIndex]

    const payload = {
      name,
      singerId: singer.id,
      albumId: album ? album.id : null,
      categoryId: category ? category.id : null,
      cover: toRelative(form.cover),
      audioUrl: toRelative(form.audioUrl),
      duration: Number(form.duration) || 0,
      lyric: form.lyric || '',
      isRecommend: form.isRecommend ? 1 : 0,
      status: form.status ? 1 : 0
    }
    if (this.data.id) payload.id = this.data.id

    this.setData({ saving: true })
    api
      .adminSaveSong(payload)
      .then(() => {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 600)
      })
      .catch(() => {
        this.setData({ saving: false })
      })
  }
})
