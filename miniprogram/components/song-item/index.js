/**
 * 歌曲行：列表里的单首歌
 * 点击整行触发 play 事件（由页面决定播放队列），点击歌手名直接进歌手页。
 */
Component({
  options: {
    addGlobalClass: true
  },

  properties: {
    song: { type: Object, value: {} },
    index: { type: Number, value: 0 },
    /** 是否是当前播放歌曲（页面根据播放器状态传入） */
    active: { type: Boolean, value: false },
    playing: { type: Boolean, value: false },
    showCover: { type: Boolean, value: true },
    showIndex: { type: Boolean, value: true },
    showDuration: { type: Boolean, value: true },
    showAlbum: { type: Boolean, value: true },
    showRemove: { type: Boolean, value: false },
    /** 附加说明，例如播放历史里的播放时间 */
    subText: { type: String, value: '' },
    /** 页面用于区分列表来源的标记，会在 play 事件里原样带回 */
    listKey: { type: String, value: '' }
  },

  methods: {
    onTap() {
      this.triggerEvent('play', {
        song: this.data.song,
        index: this.data.index,
        listKey: this.data.listKey
      })
    },

    onSinger(event) {
      const song = this.data.song || {}
      if (!song.singerId) return
      wx.navigateTo({ url: '/pages/singer-detail/index?id=' + song.singerId })
    },

    onRemove() {
      this.triggerEvent('remove', {
        song: this.data.song,
        index: this.data.index
      })
    }
  }
})
