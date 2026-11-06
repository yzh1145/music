/**
 * 极简事件总线：解耦 store 与网络层，避免循环依赖。
 * request 层检测到 401 时 emit('unauthorized')，app.js 与 user store 订阅处理。
 */
const handlers = {}

function on(event, handler) {
  if (!handlers[event]) handlers[event] = []
  handlers[event].push(handler)
  return function off() {
    const list = handlers[event]
    if (!list) return
    const index = list.indexOf(handler)
    if (index !== -1) list.splice(index, 1)
  }
}

function emit(event, payload) {
  const list = handlers[event]
  if (!list || !list.length) return
  list.slice().forEach((handler) => {
    try {
      handler(payload)
    } catch (e) {
      // 单个订阅者出错不影响其它订阅者
      console.error('[bus] handler error:', event, e)
    }
  })
}

module.exports = { on, emit }
