/**
 * 关注的歌手
 * 长按可取消关注（复用 /api/singer/{id}/follow 的切换语义）。
 */
const api = require('../../utils/api')
const userStore = require('../../store/user')
const pagePlayer = require('../../utils/page-player')

Page({
  data: {
    singers: [],
    loading: true,
    playerSongId: 0
  },

  onLoad() {
    if (!userStore.isLogin()) {
      wx.showToast({ title: '登录后才能查看', icon: 'none' })
      wx.redirectTo({
        url: '/pages/login/index?redirect=' + encodeURIComponent('/pages/my-singers/index')
      })
    }
  },

  onShow() {
    pagePlayer.attach(this)
    if (userStore.isLogin()) this.load()
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
      .getFollowSingers()
      .then((list) => {
        this.setData({ singers: list || [], loading: false })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  onTouchStart() {
    this.__longPressed = false
  },

  openSinger(event) {
    if (this.__longPressed) {
      this.__longPressed = false
      return
    }
    wx.navigateTo({ url: '/pages/singer-detail/index?id=' + event.currentTarget.dataset.id })
  },

  onLongPress(event) {
    this.__longPressed = true
    const id = Number(event.currentTarget.dataset.id)
    const name = event.currentTarget.dataset.name || ''
    wx.showModal({
      title: '提示',
      content: '确定取消关注「' + name + '」吗？',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        api
          .followSinger(id)
          .then(() => {
            wx.showToast({ title: '已取消关注', icon: 'none' })
            this.load()
          })
          .catch(() => {})
      }
    })
  }
})
