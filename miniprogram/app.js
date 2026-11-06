/**
 * 云音乐 · 微信小程序端入口
 *
 * 与 Web 端一致，所有业务数据都来自 Spring Boot 后端的 /api 接口；
 * 小程序没有 Pinia，这里用 store 模块（发布订阅）+ 全局初始化来维护登录态与播放器。
 */
const userStore = require('./store/user')
const player = require('./store/player')
const bus = require('./utils/bus')

// 需要登录才能正常浏览的页面：登录失效时直接引导回登录页
const AUTH_PAGES = [
  'pages/my/index',
  'pages/profile/index',
  'pages/my-songs/index',
  'pages/my-playlists/index',
  'pages/my-singers/index',
  'pages/admin/index',
  'pages/admin-song-edit/index'
]

let redirecting = false

function currentRoute() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  return page ? page.route : ''
}

function handleUnauthorized() {
  // 未登录游客访问公开接口不会触发；这里只处理「本地 token 已过期」的场景
  userStore.clear()
  if (redirecting) return
  const route = currentRoute()
  wx.showToast({ title: '登录已失效，请重新登录', icon: 'none' })
  if (AUTH_PAGES.indexOf(route) === -1) return
  redirecting = true
  setTimeout(() => {
    redirecting = false
    wx.navigateTo({ url: '/pages/login/index' })
  }, 600)
}

App({
  globalData: {
    launchTime: 0,
    version: '1.0.0'
  },

  onLaunch() {
    this.globalData.launchTime = Date.now()
    userStore.init()
    player.init()
    bus.on('unauthorized', handleUnauthorized)
  },

  onShow() {
    // 从后台切回前台：刷新一次用户资料，避免多端登录后信息陈旧
    if (userStore.isLogin()) {
      userStore.fetchProfile().catch(() => {})
    }
  }
})
