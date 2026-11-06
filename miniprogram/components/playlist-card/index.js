/**
 * 歌单卡片：封面 + 播放量 + 名称 + 创建者
 * 用在首页、歌单广场、搜索页、我的歌单。
 */
Component({
  options: {
    addGlobalClass: true
  },

  properties: {
    playlist: { type: Object, value: {} },
    showCreator: { type: Boolean, value: true }
  },

  methods: {
    onTap() {
      // 长按弹出操作后，部分机型仍会补发一次 tap，这里吞掉这次点击
      if (this.__longPressed) {
        this.__longPressed = false
        return
      }
      const playlist = this.data.playlist || {}
      if (!playlist.id) return
      wx.navigateTo({ url: '/pages/playlist-detail/index?id=' + playlist.id })
    },

    onTouchStart() {
      this.__longPressed = false
    },

    onLongPress() {
      this.__longPressed = true
      this.triggerEvent('longpress', { playlist: this.data.playlist })
    }
  }
})
