/**
 * 我的音乐
 * 对应 Web 端 views/MyMusic.vue：用户资料、喜欢 / 歌单 / 关注 / 历史入口。
 * 小程序端把各个板块拆成了独立子页，首页只保留入口与统计。
 */
const userStore = require('../../store/user')
const api = require('../../utils/api')
const pagePlayer = require('../../utils/page-player')

const BASE_MENUS = [
  { key: 'like', label: '我喜欢的音乐', icon: '♥', color: '#ec4141', url: '/pages/my-songs/index?type=like' },
  { key: 'create', label: '创建的歌单', icon: '▤', color: '#f0883e', url: '/pages/my-playlists/index?type=create' },
  { key: 'collect', label: '收藏的歌单', icon: '★', color: '#3f8cff', url: '/pages/my-playlists/index?type=collect' },
  { key: 'follow', label: '关注的歌手', icon: '♪', color: '#9b59b6', url: '/pages/my-singers/index' },
  { key: 'history', label: '播放历史', icon: '⟲', color: '#16a085', url: '/pages/my-songs/index?type=history' },
  { key: 'profile', label: '个人资料', icon: '◍', color: '#5b8def', url: '/pages/profile/index' },
  { key: 'settings', label: '设置', icon: '⚙', color: '#7f8c8d', url: '/pages/settings/index' }
]

Page({
  data: {
    isLogin: false,
    isAdmin: false,
    user: null,
    avatar: '/assets/images/default-avatar.png',
    nickname: '',
    signature: '',
    likeCount: 0,
    playlistCount: 0,
    followCount: 0,
    menus: BASE_MENUS,
    version: '1.0.0',
    playerSongId: 0,
    playerPlaying: false
  },

  onLoad() {
    this.__offUser = userStore.subscribe((snapshot) => {
      this.setData({
        isLogin: snapshot.isLogin,
        isAdmin: snapshot.isAdmin,
        user: snapshot.user,
        avatar: snapshot.avatar,
        nickname: snapshot.nickname,
        signature: (snapshot.user && snapshot.user.signature) || '',
        menus: this.buildMenus(snapshot.isAdmin)
      })
    })
  },

  onUnload() {
    if (this.__offUser) this.__offUser()
    this.__offUser = null
    pagePlayer.detach(this)
  },

  onShow() {
    pagePlayer.attach(this)
    const snapshot = userStore.getSnapshot()
    this.setData({
      isLogin: snapshot.isLogin,
      isAdmin: snapshot.isAdmin,
      user: snapshot.user,
      avatar: snapshot.avatar,
      nickname: snapshot.nickname,
      signature: (snapshot.user && snapshot.user.signature) || '',
      menus: this.buildMenus(snapshot.isAdmin)
    })
    if (snapshot.isLogin) this.loadStats()
  },

  onPullDownRefresh() {
    if (this.data.isLogin) {
      userStore.fetchProfile().catch(() => {})
      this.loadStats().then(() => wx.stopPullDownRefresh())
    } else {
      wx.stopPullDownRefresh()
    }
  },

  buildMenus(isAdmin) {
    if (!isAdmin) return BASE_MENUS
    return BASE_MENUS.concat([
      { key: 'admin', label: '后台管理', icon: '⚑', color: '#c0392b', url: '/pages/admin/index' }
    ])
  },

  loadStats() {
    return Promise.all([
      api.getLikeSongs().catch(() => []),
      api.getMyPlaylists().catch(() => []),
      api.getCollectedPlaylists().catch(() => []),
      api.getFollowSingers().catch(() => [])
    ]).then(([likes, mine, collected, follows]) => {
      this.setData({
        likeCount: (likes || []).length,
        playlistCount: (mine || []).length + (collected || []).length,
        followCount: (follows || []).length
      })
    })
  },

  openLogin() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  openRegister() {
    wx.navigateTo({ url: '/pages/login/index?mode=register' })
  },

  onMenuTap(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    const key = event.currentTarget.dataset.key
    if (key !== 'settings' && !userStore.isLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      this.openLogin()
      return
    }
    wx.navigateTo({ url })
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        userStore.logout()
        this.setData({ likeCount: 0, playlistCount: 0, followCount: 0 })
        wx.showToast({ title: '已退出登录', icon: 'success' })
      }
    })
  },

  onShareAppMessage() {
    return {
      title: '云音乐 · 我的音乐',
      path: '/pages/index/index'
    }
  }
})
