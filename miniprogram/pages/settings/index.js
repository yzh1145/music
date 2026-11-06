/**
 * 设置：后端服务器地址、缓存清理、关于
 *
 * 小程序没有 Vite 代理，后端地址必须可配置：
 * 开发者工具用 localhost，真机调试改成电脑局域网 IP。
 */
const config = require('../../config/index')
const api = require('../../utils/api')

Page({
  data: {
    apiBase: '',
    defaultBase: config.DEFAULT_API_BASE,
    testing: false,
    version: '1.0.0'
  },

  onLoad() {
    this.setData({ apiBase: config.getApiBase() })
  },

  onInput(event) {
    this.setData({ apiBase: event.detail.value })
  },

  saveAndTest() {
    const value = (this.data.apiBase || '').trim()
    if (!value) {
      wx.showToast({ title: '请输入服务器地址', icon: 'none' })
      return
    }
    if (!/^https?:\/\//i.test(value) && value.indexOf('://') !== -1) {
      wx.showToast({ title: '地址需要以 http:// 或 https:// 开头', icon: 'none' })
      return
    }

    const base = config.setApiBase(value)
    this.setData({ apiBase: base, testing: true })
    api
      .getHome()
      .then((data) => {
        const playlists = (data && data.recommendPlaylists) || []
        this.setData({ testing: false })
        wx.showModal({
          title: '连接成功',
          content: '服务器 ' + base + ' 可用，已加载 ' + playlists.length + ' 个推荐歌单。',
          showCancel: false,
          confirmColor: '#ec4141'
        })
      })
      .catch(() => {
        this.setData({ testing: false })
      })
  },

  resetBase() {
    const base = config.resetApiBase()
    this.setData({ apiBase: base })
    wx.showToast({ title: '已恢复默认地址', icon: 'success' })
  },

  clearSearchHistory() {
    wx.removeStorageSync('music_search_history')
    wx.showToast({ title: '已清除搜索历史', icon: 'success' })
  },

  copyBase() {
    wx.setClipboardData({ data: this.data.apiBase })
  }
})
