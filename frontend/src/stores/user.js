import { defineStore } from 'pinia'
import {
  login as loginApi,
  register as registerApi,
  getProfile
} from '../api'

/**
 * 用户状态：token 与用户信息持久化在 localStorage，刷新后仍保持登录。
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('music_token') || '',
    user: JSON.parse(localStorage.getItem('music_user') || 'null'),
    loginVisible: false,
    loginMode: 'login' // login | register
  }),
  getters: {
    isLogin: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 1,
    nickname: (state) => state.user?.nickname || '',
    avatar: (state) => state.user?.avatar || '/images/avatar/u3.png'
  },
  actions: {
    persist() {
      if (this.token) {
        localStorage.setItem('music_token', this.token)
      } else {
        localStorage.removeItem('music_token')
      }
      if (this.user) {
        localStorage.setItem('music_user', JSON.stringify(this.user))
      } else {
        localStorage.removeItem('music_user')
      }
    },
    async login(form) {
      const data = await loginApi(form)
      this.token = data.token
      this.user = data.user
      this.persist()
      this.loginVisible = false
      return data
    },
    async register(form) {
      const data = await registerApi(form)
      this.token = data.token
      this.user = data.user
      this.persist()
      this.loginVisible = false
      return data
    },
    async fetchProfile() {
      this.user = await getProfile()
      this.persist()
    },
    logout() {
      this.token = ''
      this.user = null
      this.persist()
    },
    openLogin(mode = 'login') {
      this.loginMode = mode
      this.loginVisible = true
    },
    closeLogin() {
      this.loginVisible = false
    }
  }
})
