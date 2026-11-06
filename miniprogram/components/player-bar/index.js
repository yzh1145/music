/**
 * 全局播放条
 *
 * 每个页面底部引入一次即可：组件自己订阅播放器状态，
 * 显示当前歌曲、进度、播放/暂停、下一首、播放模式与队列。
 */
const player = require('../../store/player')
const userStore = require('../../store/user')
const api = require('../../utils/api')
const format = require('../../utils/format')

const MODE_TEXT = {
  order: '列表',
  single: '单曲',
  random: '随机'
}

function modeName(mode) {
  return { order: '列表循环', single: '单曲循环', random: '随机播放' }[mode] || '列表循环'
}

Component({
  options: {
    addGlobalClass: true
  },

  data: {
    hasSong: false,
    song: null,
    songKey: '',
    playing: false,
    mode: 'order',
    modeText: '列表',
    currentText: '00:00',
    durationText: '00:00',
    progress: 0,
    queueVisible: false,
    queue: [],
    currentIndex: -1
  },

  lifetimes: {
    attached() {
      this.startSync()
    },

    detached() {
      this.stopSync()
    }
  },

  pageLifetimes: {
    // 页面隐藏（切 tab / 进详情页）时停止同步，避免后台页面持续 setData
    show() {
      this.startSync()
    },

    hide() {
      this.stopSync()
      // 页面被切走时收起队列浮层，避免回到页面后残留
      if (this.data.queueVisible) this.setData({ queueVisible: false })
    }
  },

  methods: {
    startSync() {
      if (this.__handler) return
      this.__handler = (snapshot) => this.applySnapshot(snapshot)
      player.subscribe(this.__handler)
    },

    stopSync() {
      if (!this.__handler) return
      player.unsubscribe(this.__handler)
      this.__handler = null
    },

    applySnapshot(snapshot) {
      const songKey = snapshot.song ? snapshot.song.id + ':' + (snapshot.song.liked ? 1 : 0) : ''
      const progress = snapshot.duration
        ? Math.min(100, (snapshot.currentTime / snapshot.duration) * 100)
        : 0
      const patch = {
        hasSong: snapshot.hasSong,
        playing: snapshot.playing,
        mode: snapshot.mode,
        modeText: MODE_TEXT[snapshot.mode] || '列表',
        currentText: format.formatDuration(snapshot.currentTime),
        durationText: format.formatDuration(snapshot.duration),
        progress,
        currentIndex: snapshot.index
      }
      if (songKey !== this.data.songKey) {
        patch.songKey = songKey
        patch.song = snapshot.song
      }
      this.setData(patch)
    },

    // 整条点击：进入当前歌曲的播放页
    onOpen() {
      const song = this.data.song
      if (!song) return
      wx.navigateTo({ url: '/pages/song-detail/index?id=' + song.id })
    },

    onToggle() {
      player.toggle()
    },

    onNext() {
      player.next()
    },

    onMode() {
      player.cycleMode()
      wx.showToast({
        title: modeName(player.getSnapshot().mode),
        icon: 'none',
        duration: 1200
      })
    },

    onLike() {
      const song = this.data.song
      if (!song) return
      if (!userStore.isLogin()) {
        wx.showToast({ title: '登录后才能收藏喜欢的音乐', icon: 'none' })
        wx.navigateTo({ url: '/pages/login/index' })
        return
      }
      api
        .likeSong(song.id)
        .then((liked) => {
          player.setSongLiked(song.id, liked)
          wx.showToast({ title: liked ? '已添加到我喜欢的音乐' : '已取消喜欢', icon: 'none' })
        })
        .catch(() => {})
    },

    onQueue() {
      this.setData({
        queueVisible: true,
        queue: player.getQueue(),
        currentIndex: player.getSnapshot().index
      })
    },

    closeQueue() {
      this.setData({ queueVisible: false })
    },

    onQueueItem(event) {
      const index = Number(event.currentTarget.dataset.index)
      const queue = this.data.queue
      if (!queue.length) return
      this.setData({ queueVisible: false })
      player.playList(queue, index)
    },

    onNoop() {}
  }
})
