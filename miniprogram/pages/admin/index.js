/**
 * 后台管理（小程序精简版）
 *
 * 与 Web 端 views/Admin.vue 使用同一套 /api/admin 接口，移动端保留最常用的能力：
 * - 数据看板
 * - 用户管理：切换角色 / 启用禁用
 * - 歌曲管理：搜索、上下架、删除、新增与编辑
 * 歌手 / 专辑 / 歌单 / 轮播图的完整维护仍建议在 Web 后台完成。
 */
const api = require('../../utils/api')
const userStore = require('../../store/user')

const PAGE_SIZE = 10

Page({
  data: {
    activeTab: 'stats',
    loadingStats: true,
    stats: null,
    statItems: [],
    users: [],
    userTotal: 0,
    userPage: 1,
    userKeyword: '',
    loadingUsers: false,
    songs: [],
    songTotal: 0,
    songPage: 1,
    songKeyword: '',
    loadingSongs: false
  },

  onLoad() {
    if (!userStore.isAdmin()) {
      wx.showToast({ title: '仅管理员可访问', icon: 'none' })
      setTimeout(() => this.goBackSafe(), 600)
      return
    }
    this.loadStats().then(() => {
      this.__ready = true
    })
  },

  goBackSafe() {
    if (getCurrentPages().length > 1) wx.navigateBack()
    else wx.switchTab({ url: '/pages/my/index' })
  },

  onShow() {
    if (!this.__ready || !userStore.isAdmin()) return
    if (this.data.activeTab === 'users') this.loadUsers(true)
    if (this.data.activeTab === 'songs') this.loadSongs(true)
    this.loadStats()
  },

  onPullDownRefresh() {
    const tasks = [this.loadStats()]
    if (this.data.activeTab === 'users') tasks.push(this.loadUsers(true))
    if (this.data.activeTab === 'songs') tasks.push(this.loadSongs(true))
    Promise.all(tasks).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (
      this.data.activeTab === 'users' &&
      !this.data.loadingUsers &&
      this.data.users.length < this.data.userTotal
    ) {
      this.loadUsers(false)
    }
    if (
      this.data.activeTab === 'songs' &&
      !this.data.loadingSongs &&
      this.data.songs.length < this.data.songTotal
    ) {
      this.loadSongs(false)
    }
  },

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab
    if (!tab || tab === this.data.activeTab) return
    this.setData({ activeTab: tab })
    if (tab === 'users' && !this.data.users.length) this.loadUsers(true)
    if (tab === 'songs' && !this.data.songs.length) this.loadSongs(true)
  },

  /* ==================== 看板 ==================== */
  loadStats() {
    this.setData({ loadingStats: true })
    return api
      .adminStats()
      .then((stats) => {
        const statItems = [
          { label: '用户总数', value: stats.userCount || 0 },
          { label: '今日新增', value: stats.todayUserCount || 0 },
          { label: '歌曲', value: stats.songCount || 0 },
          { label: '歌手', value: stats.singerCount || 0 },
          { label: '专辑', value: stats.albumCount || 0 },
          { label: '歌单', value: stats.playlistCount || 0 },
          { label: '评论', value: stats.commentCount || 0 },
          { label: '总播放量', value: stats.playCount || 0 }
        ]
        this.setData({ stats, statItems, loadingStats: false })
      })
      .catch(() => {
        this.setData({ loadingStats: false })
      })
  },

  /* ==================== 用户 ==================== */
  onUserKeyword(event) {
    this.setData({ userKeyword: event.detail.value })
  },

  searchUsers() {
    this.loadUsers(true)
  },

  loadUsers(reset) {
    const page = reset ? 1 : this.data.userPage + 1
    this.setData({ loadingUsers: true })
    return api
      .adminUsers({ keyword: this.data.userKeyword || '', page, size: PAGE_SIZE })
      .then((data) => {
        const list = (data && data.list) || []
        const users = reset ? list : this.data.users.concat(list)
        this.setData({
          users,
          userTotal: (data && data.total) || 0,
          userPage: page,
          loadingUsers: false
        })
      })
      .catch(() => {
        this.setData({ loadingUsers: false })
      })
  },

  toggleUserRole(event) {
    const user = this.data.users[Number(event.currentTarget.dataset.index)]
    if (!user) return
    const role = Number(user.role) === 1 ? 0 : 1
    wx.showModal({
      title: '修改角色',
      content: '确定将「' + (user.nickname || user.username) + '」' + (role === 1 ? '设为管理员' : '设为普通用户') + '吗？',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        api
          .adminUpdateUser(user.id, role, Number(user.status) === 1 ? 1 : 0)
          .then(() => {
            wx.showToast({ title: '已更新角色', icon: 'success' })
            this.loadUsers(true)
          })
          .catch(() => {})
      }
    })
  },

  toggleUserStatus(event) {
    const user = this.data.users[Number(event.currentTarget.dataset.index)]
    if (!user) return
    const status = Number(user.status) === 1 ? 0 : 1
    wx.showModal({
      title: '修改状态',
      content: '确定' + (status === 1 ? '启用' : '禁用') + '「' + (user.nickname || user.username) + '」吗？',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        api
          .adminUpdateUser(user.id, Number(user.role) === 1 ? 1 : 0, status)
          .then(() => {
            wx.showToast({ title: status === 1 ? '已启用' : '已禁用', icon: 'success' })
            this.loadUsers(true)
          })
          .catch(() => {})
      }
    })
  },

  /* ==================== 歌曲 ==================== */
  onSongKeyword(event) {
    this.setData({ songKeyword: event.detail.value })
  },

  searchSongs() {
    this.loadSongs(true)
  },

  loadSongs(reset) {
    const page = reset ? 1 : this.data.songPage + 1
    this.setData({ loadingSongs: true })
    return api
      .adminSongs({ keyword: this.data.songKeyword || '', page, size: PAGE_SIZE })
      .then((data) => {
        const list = (data && data.list) || []
        const songs = reset ? list : this.data.songs.concat(list)
        this.setData({
          songs,
          songTotal: (data && data.total) || 0,
          songPage: page,
          loadingSongs: false
        })
      })
      .catch(() => {
        this.setData({ loadingSongs: false })
      })
  },

  addSong() {
    wx.navigateTo({ url: '/pages/admin-song-edit/index' })
  },

  editSong(event) {
    const id = event.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/admin-song-edit/index?id=' + id })
  },

  deleteSong(event) {
    const index = Number(event.currentTarget.dataset.index)
    const song = this.data.songs[index]
    if (!song) return
    wx.showModal({
      title: '删除歌曲',
      content: '确定删除《' + song.name + '》吗？歌单与喜欢记录中的关联也会一并移除。',
      confirmColor: '#ec4141',
      success: (res) => {
        if (!res.confirm) return
        api
          .adminDeleteSong(song.id)
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            this.loadSongs(true)
            this.loadStats()
          })
          .catch(() => {})
      }
    })
  },

  noop() {}
})
