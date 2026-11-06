/**
 * 登录凭证存取（本地缓存）
 *
 * 与 Web 端的 localStorage 对应：token + 用户信息。
 * 单独抽成模块，网络层只依赖它，不依赖 user store，避免循环引用。
 */
const TOKEN_KEY = 'music_token'
const USER_KEY = 'music_user'

function getToken() {
  try {
    return wx.getStorageSync(TOKEN_KEY) || ''
  } catch (e) {
    return ''
  }
}

function getUser() {
  try {
    const raw = wx.getStorageSync(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

function saveAuth(token, user) {
  if (token) wx.setStorageSync(TOKEN_KEY, token)
  if (user) wx.setStorageSync(USER_KEY, JSON.stringify(user))
}

function saveUser(user) {
  if (user) wx.setStorageSync(USER_KEY, JSON.stringify(user))
}

function clearAuth() {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
}

function isLogin() {
  return !!getToken()
}

function isAdmin() {
  const user = getUser()
  return !!user && Number(user.role) === 1
}

module.exports = {
  TOKEN_KEY,
  USER_KEY,
  getToken,
  getUser,
  saveAuth,
  saveUser,
  clearAuth,
  isLogin,
  isAdmin
}
