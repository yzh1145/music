/**
 * 服务端地址配置
 *
 * 小程序没有 Vite 代理，必须直连后端：
 * - 开发者工具：默认 http://localhost:8080 即可（需在「详情 → 本地设置」勾选不校验合法域名）
 * - 真机调试：把地址改成电脑的局域网 IP，例如 http://192.168.1.10:8080
 * - 正式发布：必须是已在小程序后台配置的 https 域名
 *
 * 地址保存在本地缓存，可在「我的 → 设置」里随时修改。
 */
const STORAGE_KEY = 'music_api_base'
const DEFAULT_API_BASE = 'http://localhost:8080'

function normalizeBase(value) {
  let base = String(value === undefined || value === null ? '' : value).trim()
  if (!base) return DEFAULT_API_BASE
  if (!/^https?:\/\//i.test(base)) {
    base = 'http://' + base
  }
  return base.replace(/\/+$/, '')
}

function getApiBase() {
  let saved = ''
  try {
    saved = wx.getStorageSync(STORAGE_KEY) || ''
  } catch (e) {
    saved = ''
  }
  return normalizeBase(saved)
}

function setApiBase(value) {
  const base = normalizeBase(value)
  wx.setStorageSync(STORAGE_KEY, base)
  return base
}

function resetApiBase() {
  wx.removeStorageSync(STORAGE_KEY)
  return DEFAULT_API_BASE
}

module.exports = {
  STORAGE_KEY,
  DEFAULT_API_BASE,
  normalizeBase,
  getApiBase,
  setApiBase,
  resetApiBase
}
