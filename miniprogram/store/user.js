/**
 * 用户状态（登录态 + 用户资料）
 *
 * 与 Web 端的 Pinia user store 对应：
 * - token / user 持久化在本地缓存，冷启动后仍保持登录
 * - 登录、注册、刷新资料、退出登录
 * - 订阅模式：页面 onShow 读取最新状态即可，无需全局状态库
 */
const api = require('../utils/api')
const auth = require('../utils/auth')
const bus = require('../utils/bus')

const listeners = []
const state = {
  token: '',
  user: null
}

function snapshot() {
  const user = state.user
  return {
    token: state.token,
    user,
    isLogin: !!state.token,
    isAdmin: !!user && Number(user.role) === 1,
    nickname: (user && user.nickname) || '',
    avatar: (user && user.avatar) || '/assets/images/default-avatar.png'
  }
}

function notify() {
  const snap = snapshot()
  listeners.slice().forEach((handler) => {
    try {
      handler(snap)
    } catch (e) {
      console.error('[user] listener error', e)
    }
  })
}

function subscribe(handler) {
  if (typeof handler !== 'function') return function noop() {}
  listeners.push(handler)
  handler(snapshot())
  return function unsubscribe() {
    const index = listeners.indexOf(handler)
    if (index !== -1) listeners.splice(index, 1)
  }
}

function init() {
  state.token = auth.getToken()
  state.user = auth.getUser()
  // 网络层检测到 401 时会清空缓存并广播，这里同步内存状态
  bus.on('unauthorized', () => {
    state.token = ''
    state.user = null
    notify()
  })
}

function getSnapshot() {
  return snapshot()
}

function getUser() {
  return state.user
}

function isLogin() {
  return !!state.token
}

function isAdmin() {
  return !!(state.user && Number(state.user.role) === 1)
}

function setSession(token, user) {
  state.token = token || ''
  state.user = user || null
  auth.saveAuth(state.token, state.user)
  notify()
}

function login(form) {
  return api.login(form).then((data) => {
    setSession(data.token, data.user)
    return data
  })
}

function register(form) {
  return api.register(form).then((data) => {
    setSession(data.token, data.user)
    return data
  })
}

function fetchProfile() {
  if (!state.token) return Promise.reject(new Error('未登录'))
  return api.getProfile().then((user) => {
    state.user = user
    auth.saveUser(user)
    notify()
    return user
  })
}

/** 只清理本地状态（登录失效时调用） */
function clear() {
  state.token = ''
  state.user = null
  auth.clearAuth()
  notify()
}

function logout() {
  clear()
}

module.exports = {
  init,
  subscribe,
  getSnapshot,
  getUser,
  isLogin,
  isAdmin,
  login,
  register,
  fetchProfile,
  clear,
  logout
}
