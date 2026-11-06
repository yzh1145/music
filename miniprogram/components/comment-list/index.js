/**
 * 歌曲评论：一级评论分页 + 二级回复 + 点赞 + 删除
 * 与 Web 端 components/CommentList.vue 行为一致。
 */
const api = require('../../utils/api')
const userStore = require('../../store/user')

Component({
  options: {
    addGlobalClass: true
  },

  properties: {
    songId: { type: Number, value: 0 }
  },

  data: {
    comments: [],
    total: 0,
    page: 1,
    size: 10,
    hasMore: false,
    loading: false,
    content: '',
    submitting: false,
    replyTargetId: 0,
    replyTargetName: '',
    replyContent: '',
    replySubmitting: false,
    myId: 0,
    isAdmin: false,
    myAvatar: '/assets/images/default-avatar.png'
  },

  observers: {
    songId(value) {
      if (!this.__ready || !value) return
      this.load(true)
    }
  },

  lifetimes: {
    attached() {
      this.__ready = true
      this.__offUser = userStore.subscribe((snapshot) => {
        this.setData({
          myId: snapshot.user ? snapshot.user.id : 0,
          isAdmin: snapshot.isAdmin,
          myAvatar: snapshot.avatar
        })
      })
      if (this.data.songId) this.load(true)
    },

    detached() {
      if (this.__offUser) this.__offUser()
      this.__offUser = null
    }
  },

  methods: {
    load(reset) {
      const songId = this.data.songId
      if (!songId) return
      const page = reset ? 1 : this.data.page + 1
      this.setData({ loading: true })

      api
        .getComments({ songId, page, size: this.data.size })
        .then((data) => {
          const list = (data && data.list) || []
          const total = (data && data.total) || 0
          const comments = reset ? list : this.data.comments.concat(list)
          this.setData({
            comments,
            total,
            page,
            loading: false,
            hasMore: comments.length < total
          })
        })
        .catch(() => {
          this.setData({ loading: false })
        })
    },

    requireLogin(message) {
      if (userStore.isLogin()) return true
      wx.showToast({ title: message || '请先登录', icon: 'none' })
      wx.navigateTo({ url: '/pages/login/index' })
      return false
    },

    onContentInput(event) {
      this.setData({ content: event.detail.value })
    },

    submit() {
      if (!this.requireLogin('登录后才能发表评论')) return
      const content = (this.data.content || '').trim()
      if (!content) {
        wx.showToast({ title: '说点什么吧', icon: 'none' })
        return
      }
      this.setData({ submitting: true })
      api
        .addComment({ songId: Number(this.data.songId), content, parentId: 0 })
        .then(() => {
          wx.showToast({ title: '评论成功', icon: 'success' })
          this.setData({ content: '', submitting: false })
          this.load(true)
        })
        .catch(() => {
          this.setData({ submitting: false })
        })
    },

    startReply(event) {
      if (!this.requireLogin('登录后才能回复')) return
      const id = Number(event.currentTarget.dataset.id)
      const name = event.currentTarget.dataset.name || ''
      this.setData({
        replyTargetId: id,
        replyTargetName: name,
        replyContent: ''
      })
    },

    cancelReply() {
      this.setData({ replyTargetId: 0, replyTargetName: '', replyContent: '' })
    },

    onReplyInput(event) {
      this.setData({ replyContent: event.detail.value })
    },

    submitReply() {
      const content = (this.data.replyContent || '').trim()
      if (!content) {
        wx.showToast({ title: '回复内容不能为空', icon: 'none' })
        return
      }
      this.setData({ replySubmitting: true })
      api
        .addComment({
          songId: Number(this.data.songId),
          content,
          parentId: Number(this.data.replyTargetId) || 0
        })
        .then(() => {
          wx.showToast({ title: '回复成功', icon: 'success' })
          this.setData({ replySubmitting: false })
          this.cancelReply()
          this.load(true)
        })
        .catch(() => {
          this.setData({ replySubmitting: false })
        })
    },

    toggleLike(comment) {
      if (!this.requireLogin('登录后才能点赞')) return
      api
        .likeComment(comment.id)
        .then((liked) => {
          const comments = this.data.comments.map((item) => {
            if (item.id === comment.id) {
              return this.withLike(item, liked)
            }
            if (item.replies && item.replies.length) {
              return Object.assign({}, item, {
                replies: item.replies.map((reply) =>
                  reply.id === comment.id ? this.withLike(reply, liked) : reply
                )
              })
            }
            return item
          })
          this.setData({ comments })
        })
        .catch(() => {})
    },

    withLike(comment, liked) {
      const likeCount = Math.max(0, Number(comment.likeCount) + (liked ? 1 : -1))
      return Object.assign({}, comment, { liked, likeCount })
    },

    removeComment(event) {
      const id = Number(event.currentTarget.dataset.id)
      if (!id) return
      wx.showModal({
        title: '提示',
        content: '确定要删除这条评论吗？',
        confirmColor: '#ec4141',
        success: (res) => {
          if (!res.confirm) return
          api
            .deleteComment(id)
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' })
              this.load(true)
            })
            .catch(() => {})
        }
      })
    },

    loadMore() {
      if (this.data.loading || !this.data.hasMore) return
      this.load(false)
    }
  }
})
