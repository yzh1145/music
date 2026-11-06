/**
 * wx.request 统一封装
 *
 * 后端统一返回 { code, message, data }：
 * - code === 200：解包 data，并把封面 / 头像 / 音频等相对地址补全为绝对地址
 * - code === 401：清除本地登录态，抛给全局处理（提示并跳转登录）
 * - 其它：弹出 message 并 reject
 *
 * 这样页面里拿到的就是可直接渲染的数据，WXML 中不需要再拼服务器地址。
 */
const { getApiBase } = require('../config/index')
const auth = require('./auth')
const bus = require('./bus')

// 需要补全为绝对地址的字段
const MEDIA_KEYS = ['cover', 'avatar', 'imageUrl', 'audioUrl', 'creatorAvatar']

// 后端没有图片时使用的本地兜底图
const MEDIA_FALLBACKS = {
  cover: '/assets/images/default-cover.png',
  avatar: '/assets/images/default-avatar.png',
  creatorAvatar: '/assets/images/default-avatar.png',
  imageUrl: '/assets/images/default-banner.png'
}

const LOCAL_PREFIXES = ['/assets/', 'wxfile://', 'data:', 'http://', 'https://']

function resolveMedia(url) {
  const value = String(url === undefined || url === null ? '' : url)
  if (!value) return ''
  for (let i = 0; i < LOCAL_PREFIXES.length; i += 1) {
    if (value.indexOf(LOCAL_PREFIXES[i]) === 0) return value
  }
  return getApiBase() + (value.charAt(0) === '/' ? value : '/' + value)
}

/**
 * 反向处理：把本机后端地址还原成相对路径，写回数据库时不会绑定某台机器。
 * 例如 http://192.168.1.10:8080/images/album/a1.png -> /images/album/a1.png
 */
function toRelative(url) {
  const value = String(url === undefined || url === null ? '' : url).trim()
  if (!value) return ''
  // 内置兜底图只在小程序里显示，不能写回后端
  if (value.indexOf('/assets/images/default-') === 0) return ''
  const base = getApiBase()
  if (value.indexOf(base + '/') === 0) return value.slice(base.length)
  return value
}

function normalizeMedia(key, value) {
  if (key === 'audioUrl') {
    return value ? resolveMedia(value) : ''
  }
  if (!value) {
    return MEDIA_FALLBACKS[key] || value
  }
  return resolveMedia(value)
}

/** 递归补全对象 / 数组中的媒体地址 */
function normalize(value, depth) {
  const level = depth || 0
  if (level > 8 || value === null || value === undefined) return value
  if (Array.isArray(value)) {
    return value.map((item) => normalize(item, level + 1))
  }
  if (typeof value === 'object') {
    const result = {}
    Object.keys(value).forEach((key) => {
      const raw = value[key]
      const isMedia = MEDIA_KEYS.indexOf(key) !== -1
      if (isMedia && (raw === null || raw === undefined || typeof raw === 'string')) {
        result[key] = normalizeMedia(key, raw)
      } else {
        result[key] = normalize(raw, level + 1)
      }
    })
    return result
  }
  return value
}

function buildQuery(params) {
  if (!params) return ''
  const parts = []
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value === undefined || value === null || value === '') return
    parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
  })
  return parts.length ? '?' + parts.join('&') : ''
}

function toast(message) {
  wx.showToast({
    title: message || '请求失败',
    icon: 'none',
    duration: 2000
  })
}

function makeError(body, fallback) {
  const message = (body && body.message) || fallback || '请求失败'
  const error = new Error(message)
  error.code = body ? body.code : 0
  error.data = body ? body.data : null
  return error
}

/**
 * @param {Object} options
 * @param {string} options.url      接口路径（不含 /api 前缀），例如 /home、/song/page
 * @param {string} [options.method]
 * @param {Object} [options.data]   请求体
 * @param {Object} [options.params] 查询参数
 * @param {boolean} [options.silent] 不自动弹错误提示
 */
function request(options) {
  const config = options || {}
  const method = (config.method || 'GET').toUpperCase()
  const path = config.url.charAt(0) === '/' ? config.url : '/' + config.url
  const url = getApiBase() + '/api' + path + buildQuery(config.params)

  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' }
    const token = auth.getToken()
    if (token) header.Authorization = 'Bearer ' + token

    wx.request({
      url,
      method,
      data: config.data === undefined ? undefined : config.data,
      header,
      timeout: config.timeout || 15000,
      success(res) {
        const body = res.data
        if (body && typeof body === 'object' && body.code !== undefined) {
          if (Number(body.code) === 200) {
            resolve(normalize(body.data))
            return
          }
          if (Number(body.code) === 401) {
            auth.clearAuth()
            bus.emit('unauthorized')
            reject(makeError(body, '登录状态已失效'))
            return
          }
          if (!config.silent) toast(body.message)
          reject(makeError(body))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(normalize(body))
          return
        }
        if (!config.silent) toast('服务异常（' + res.statusCode + '）')
        reject(makeError(null, '服务异常（' + res.statusCode + '）'))
      },
      fail(error) {
        if (!config.silent) {
          toast('网络异常，请检查服务器地址')
        }
        const message = error && error.errMsg ? error.errMsg : '网络异常'
        reject(makeError(null, message))
      }
    })
  })
}

module.exports = {
  request,
  resolveMedia,
  toRelative,
  normalize,
  buildQuery,
  MEDIA_KEYS,
  MEDIA_FALLBACKS
}
