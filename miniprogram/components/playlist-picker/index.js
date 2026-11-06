/**
 * 「添加到歌单」选择器
 * 打开时拉取我创建的歌单，支持就地新建歌单。
 */
const api = require('../../utils/api')

Component({
  options: {
    addGlobalClass: true
  },

  properties: {
    show: { type: Boolean, value: false },
    songId: { type: Number, value: 0 }
  },

  data: {
    playlists: [],
    loading: false
  },

  observers: {
    show(value) {
      if (value) this.load()
    }
  },

  methods: {
    load() {
      this.setData({ loading: true })
      api
        .getMyPlaylists()
        .then((list) => {
          this.setData({ playlists: list || [], loading: false })
        })
        .catch(() => {
          this.setData({ playlists: [], loading: false })
        })
    },

    close() {
      this.triggerEvent('close')
    },

    onPick(event) {
      const playlistId = Number(event.currentTarget.dataset.id)
      const songId = Number(this.data.songId)
      if (!playlistId || !songId) return
      api
        .addSongToPlaylist(playlistId, songId)
        .then(() => {
          wx.showToast({ title: '已添加到歌单', icon: 'success' })
          this.triggerEvent('added')
          this.close()
        })
        .catch(() => {})
    },

    onCreate() {
      wx.showModal({
        title: '新建歌单',
        editable: true,
        placeholderText: '给歌单起个名字',
        confirmColor: '#ec4141',
        success: (res) => {
          if (!res.confirm) return
          const name = (res.content || '').trim()
          if (!name) {
            wx.showToast({ title: '歌单名称不能为空', icon: 'none' })
            return
          }
          api
            .createPlaylist({ name, intro: '', category: '流行' })
            .then(() => {
              wx.showToast({ title: '歌单创建成功', icon: 'success' })
              this.load()
            })
            .catch(() => {})
        }
      })
    },

    onNoop() {}
  }
})
