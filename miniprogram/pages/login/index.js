/**
 * 登录 / 注册
 * 后端为账号密码 + JWT，与 Web 端 LoginDialog.vue 使用同一套接口。
 */
const userStore = require('../../store/user')

const TAB_PAGES = [
  '/pages/index/index',
  '/pages/playlist-square/index',
  '/pages/search/index',
  '/pages/my/index'
]

Page({
  data: {
    mode: 'login',
    username: '',
    password: '',
    confirm: '',
    nickname: '',
    loading: false,
    redirect: ''
  },

  onLoad(options) {
    const mode = options.mode === 'register' ? 'register' : 'login'
    let redirect = ''
    if (options.redirect) {
      try {
        redirect = decodeURIComponent(options.redirect)
      } catch (e) {
        redirect = options.redirect
      }
    }
    this.setData({ mode, redirect })
    wx.setNavigationBarTitle({ title: mode === 'register' ? '注册云音乐' : '登录云音乐' })
  },

  switchMode(event) {
    const mode = event.currentTarget.dataset.mode || (this.data.mode === 'login' ? 'register' : 'login')
    this.setData({ mode, password: '', confirm: '' })
    wx.setNavigationBarTitle({ title: mode === 'register' ? '注册云音乐' : '登录云音乐' })
  },

  onUsernameInput(event) {
    this.setData({ username: event.detail.value })
  },

  onPasswordInput(event) {
    this.setData({ password: event.detail.value })
  },

  onConfirmInput(event) {
    this.setData({ confirm: event.detail.value })
  },

  onNicknameInput(event) {
    this.setData({ nickname: event.detail.value })
  },

  fillDemo(event) {
    this.setData({
      mode: 'login',
      username: event.currentTarget.dataset.username,
      password: event.currentTarget.dataset.password
    })
    wx.setNavigationBarTitle({ title: '登录云音乐' })
  },

  submit() {
    if (this.data.loading) return
    const username = (this.data.username || '').trim()
    const password = this.data.password || ''

    if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
      wx.showToast({ title: '用户名为 3-20 位字母、数字或下划线', icon: 'none' })
      return
    }
    if (password.length < 6 || password.length > 20) {
      wx.showToast({ title: '密码长度为 6-20 位', icon: 'none' })
      return
    }
    if (this.data.mode === 'register' && password !== this.data.confirm) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    const action =
      this.data.mode === 'register'
        ? userStore.register({
            username,
            password,
            nickname: (this.data.nickname || '').trim() || username
          })
        : userStore.login({ username, password })

    action
      .then(() => {
        this.setData({ loading: false })
        wx.showToast({
          title: this.data.mode === 'register' ? '注册成功' : '登录成功',
          icon: 'success'
        })
        setTimeout(() => this.afterLogin(), 500)
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  afterLogin() {
    const redirect = this.data.redirect
    if (redirect && redirect.indexOf('/pages/') === 0) {
      const path = redirect.split('?')[0]
      if (TAB_PAGES.indexOf(path) !== -1) {
        wx.switchTab({ url: path })
      } else {
        wx.redirectTo({ url: redirect })
      }
      return
    }
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/index/index' })
  },

  goBack() {
    if (getCurrentPages().length > 1) wx.navigateBack()
    else wx.switchTab({ url: '/pages/index/index' })
  }
})
