/**
 * 页面与播放器之间的轻量桥接
 *
 * 小程序页面没有 Pinia，这里把「订阅播放器状态 → 更新当前歌曲高亮」这段
 * 重复逻辑收拢，页面只需要在 onShow / onHide 里调用 attach / detach。
 */
const player = require('../store/player')

function attach(page) {
  if (!page || page.__playerAttached) return
  page.__playerAttached = true
  page.__playerHandler = function (snapshot) {
    page.setData({
      playerSongId: snapshot.song ? snapshot.song.id : 0,
      playerPlaying: snapshot.playing
    })
  }
  player.subscribe(page.__playerHandler)
  page.__playerHandler(player.getSnapshot())
}

function detach(page) {
  if (!page || !page.__playerAttached) return
  page.__playerAttached = false
  player.unsubscribe(page.__playerHandler)
  page.__playerHandler = null
}

/**
 * 列表里点歌的统一行为：点当前歌曲切换播放/暂停，其它歌曲则把整个列表设为播放队列。
 * @param {Array} songs
 * @param {number} index
 */
function playFromList(songs, index) {
  if (!songs || !songs.length) return
  const song = songs[index]
  if (!song) return
  const snapshot = player.getSnapshot()
  if (snapshot.song && snapshot.song.id === song.id) {
    player.toggle()
    return
  }
  player.playList(songs, index)
}

/** 「播放全部」：始终从第一首重新开始，不做暂停/继续切换 */
function playAll(songs) {
  if (!songs || !songs.length) return
  player.playList(songs, 0)
}

module.exports = { attach, detach, playFromList, playAll }
