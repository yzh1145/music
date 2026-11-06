/**
 * 个人资料：修改资料 + 修改密码 + 退出登录
 * 对应 Web 端 views/MyMusic.vue 的「个人资料」面板。
 */
const api = require('../../utils/api')
const userStore = require('../../store/user')
const { resolveMedia, toRelative } = require('../../utils/request')

const GENDERS = ['保密', '男', '女']

Page({
  data: {
    loading: true,
    saving: false,
    savingPassword: false,
    genders: GENDERS,
    form: {
      avatar: '',
      nickname: '',
      gender: 0,
      birthday: '',
      phone: '',
      email: '',
      signature: ''
    },
    avatarPreview: '/assets/images/default-avatar.png',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    today: ''
  },

  onLoad() {
    const now = new Date()
    const month = now.getMonth() + 1
    const day = now.getDate()
    this.setData({
      today: now.getFullYear() + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day
    })
  },

  onShow() {
    if (!userStore.isLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.redirectTo({
        url: '/pages/login/index?redirect=' + encodeURIComponent('/pages/profile/index')
      })
      return
    }
    this.load()
  },

  load() {
    this.setData({ loading: true })
    api
      .getProfile()
      .then((user) => {
        this.setData({
          loading: false,
          form: {
            avatar: toRelative(user.avatar),
            nickname: user.nickname || '',
            gender: Number(user.gender) || 0,
            birthday: user.birthday || '',
            phone: user.phone || '',
            email: user.email || '',
            signature: user.signature || ''
          },
          avatarPreview: resolveMedia(user.avatar) || '/assets/images/default-avatar.png'
        })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  onAvatarInput(event) {
    const avatar = event.detail.value
    this.setData({
      'form.avatar': avatar,
      avatarPreview: resolveMedia(avatar) || '/assets/images/default-avatar.png'
    })
  },

  onNicknameInput(event) {
    this.setData({ 'form.nickname': event.detail.value })
  },

  onGenderChange(event) {
    this.setData({ 'form.gender': Number(event.detail.value) })
  },

  onBirthdayChange(event) {
    this.setData({ 'form.birthday': event.detail.value })
  },

  clearBirthday() {
    this.setData({ 'form.birthday': '' })
  },

  onPhoneInput(event) {
    this.setData({ 'form.phone': event.detail.value })
  },

  onEmailInput(event) {
    this.setData({ 'form.email': event.detail.value })
  },

  onSignatureInput(event) {
    this.setData({ 'form.signature': event.detail.value })
  },

  saveProfile() {
    const form = this.data.form
    if (!(form.nickname || '').trim()) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    api
      .updateProfile({
        nickname: form.nickname.trim(),
        avatar: toRelative(form.avatar),
        gender: Number(form.gender) || 0,
        birthday: form.birthday || null,
        signature: form.signature || '',
        phone: form.phone || '',
        email: form.email || ''
      })
      .then(() => {
        wx.showToast({ title: '资料已更新', icon: 'success' })
        return userStore.fetchProfile()
      })
      .then(() => {
        this.setData({ saving: false })
      })
      .catch(() => {
        this.setData({ saving: false })
      })
  },

  onOldPasswordInput(event) {
    this.setData({ oldPassword: event.detail.value })
  },

  onNewPasswordInput(event) {
    this.setData({ newPassword: event.detail.value })
  },

  onConfirmPasswordInput(event) {
    this.setData({ confirmPassword: event.detail.value })
  },

  savePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data
    if (!oldPassword || !newPassword) {
      wx.showToast({ title: '请填写完整的密码信息', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
      return
    }
    this.setData({ savingPassword: true })
    api
      .changePassword({ oldPassword, newPassword })
      .then(() => {
        this.setData({ savingPassword: false, oldPassword: '', newPassword: '', confirmPassword: '' })
        wx.showModal({
          title: '密码已修改',
          content: '请使用新密码重新登录',
          showCancel: false,
          confirmColor: '#ec4141',
          success: () => {
            userStore.logout()
            wx.redirectTo({ url: '/pages/login/index' })
          }
        })
      })
      .catch(() => {
        this.setData({ savingPassword: false })
      })
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        userStore.logout()
        wx.switchTab({ url: '/pages/my/index' })
      }
    })
  },

  noop() {}
})
