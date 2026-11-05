<script setup>
import { onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addComment, deleteComment, getComments, likeComment } from '../api'
import { useUserStore } from '../stores/user'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  songId: { type: [Number, String], required: true }
})

const userStore = useUserStore()

const comments = ref([])
const total = ref(0)
const page = ref(1)
const size = 10
const loading = ref(false)
const submitting = ref(false)
const content = ref('')
const replyTarget = ref(null)
const replyContent = ref('')

function load() {
  loading.value = true
  getComments({ songId: props.songId, page: page.value, size })
    .then((data) => {
      comments.value = data.list || []
      total.value = data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function requireLogin() {
  if (!userStore.isLogin) {
    ElMessage.warning('登录后才能发表评论')
    userStore.openLogin()
    return false
  }
  return true
}

function submit() {
  if (!requireLogin()) return
  const value = content.value.trim()
  if (!value) {
    ElMessage.warning('说点什么吧')
    return
  }
  if (value.length > 500) {
    ElMessage.warning('评论最多 500 个字')
    return
  }
  submitting.value = true
  addComment({ songId: Number(props.songId), content: value, parentId: 0 })
    .then(() => {
      ElMessage.success('评论成功')
      content.value = ''
      page.value = 1
      load()
    })
    .finally(() => {
      submitting.value = false
    })
}

function startReply(comment) {
  if (!requireLogin()) return
  replyTarget.value = comment.id
  replyContent.value = ''
}

function cancelReply() {
  replyTarget.value = null
  replyContent.value = ''
}

function submitReply(parent) {
  const value = replyContent.value.trim()
  if (!value) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  addComment({ songId: Number(props.songId), content: value, parentId: parent.id })
    .then(() => {
      ElMessage.success('回复成功')
      cancelReply()
      load()
    })
}

function toggleLike(comment) {
  if (!requireLogin()) return
  likeComment(comment.id).then((liked) => {
    comment.liked = liked
    comment.likeCount += liked ? 1 : -1
  })
}

function remove(comment) {
  ElMessageBox.confirm('确定要删除这条评论吗？', '提示', { type: 'warning' })
    .then(() => {
      deleteComment(comment.id).then(() => {
        ElMessage.success('已删除')
        load()
      })
    })
    .catch(() => {})
}

function canDelete(comment) {
  return userStore.isLogin && (userStore.user?.id === comment.userId || userStore.isAdmin)
}

watch(
  () => props.songId,
  () => {
    page.value = 1
    content.value = ''
    cancelReply()
    load()
  }
)

onMounted(load)
</script>

<template>
  <div class="comment-list" v-loading="loading">
    <div class="comment-editor">
      <el-avatar :size="40" :src="userStore.isLogin ? userStore.avatar : '/images/avatar/u3.png'" />
      <div class="editor-main">
        <el-input
          v-model="content"
          type="textarea"
          :rows="3"
          maxlength="500"
          show-word-limit
          resize="none"
          placeholder="听歌的时候，在想些什么？"
        />
        <div class="editor-footer">
          <span class="text-light">评论 {{ total }} 条</span>
          <el-button type="primary" size="small" :loading="submitting" @click="submit">发表评论</el-button>
        </div>
      </div>
    </div>

    <div class="comment-items">
      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <el-avatar :size="40" :src="comment.avatar" class="comment-avatar" />
        <div class="comment-body">
          <div class="comment-head">
            <span class="nickname">{{ comment.nickname }}</span>
            <span class="time text-light">{{ comment.createTime }}</span>
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-actions">
            <span class="action" :class="{ liked: comment.liked }" @click="toggleLike(comment)">
              <AppIcon :name="comment.liked ? 'thumb-fill' : 'thumb'" :size="14" />
              {{ comment.likeCount || '赞' }}
            </span>
            <span class="action" @click="startReply(comment)">回复</span>
            <span v-if="canDelete(comment)" class="action" @click="remove(comment)">删除</span>
          </div>

          <div v-if="replyTarget === comment.id" class="reply-editor">
            <el-input
              v-model="replyContent"
              type="textarea"
              :rows="2"
              maxlength="500"
              resize="none"
              :placeholder="`回复 @${comment.nickname}`"
            />
            <div class="reply-buttons">
              <el-button text size="small" @click="cancelReply">取消</el-button>
              <el-button type="primary" size="small" @click="submitReply(comment)">回复</el-button>
            </div>
          </div>

          <div v-if="comment.replies && comment.replies.length" class="replies">
            <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
              <el-avatar :size="26" :src="reply.avatar" />
              <div class="reply-body">
                <div class="reply-head">
                  <span class="nickname">{{ reply.nickname }}</span>
                  <span class="time text-light">{{ reply.createTime }}</span>
                </div>
                <div class="reply-content">{{ reply.content }}</div>
                <div class="comment-actions">
                  <span class="action" :class="{ liked: reply.liked }" @click="toggleLike(reply)">
                    <AppIcon :name="reply.liked ? 'thumb-fill' : 'thumb'" :size="14" />
                    {{ reply.likeCount || '赞' }}
                  </span>
                  <span class="action" @click="startReply(comment)">回复</span>
                  <span v-if="canDelete(reply)" class="action" @click="remove(reply)">删除</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && !comments.length" description="还没有评论，快来抢沙发" :image-size="80" />
    </div>

    <div v-if="total > size" class="comment-pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="prev, pager, next"
        background
        hide-on-single-page
        @current-change="load"
      />
    </div>
  </div>
</template>

<style scoped>
.comment-editor {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  background: var(--music-soft);
}

.editor-main {
  flex: 1;
}

.editor-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
}

.comment-items {
  margin-top: 8px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--music-border);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nickname {
  color: var(--music-text-2);
  font-size: 13px;
  font-weight: 500;
}

.time {
  font-size: 11px;
}

.comment-content {
  margin: 6px 0 8px;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 18px;
  color: var(--music-text-3);
  font-size: 12px;
}

.action {
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
}

.action:hover {
  color: var(--music-red-light);
}

.action.liked {
  color: var(--music-red-light);
}

.reply-editor {
  margin-top: 10px;
}

.reply-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 6px;
}

.replies {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--music-soft);
}

.reply-item {
  display: flex;
  gap: 10px;
  padding: 6px 0;
}

.reply-item + .reply-item {
  border-top: 1px dashed var(--music-border);
}

.reply-body {
  flex: 1;
  min-width: 0;
}

.reply-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-content {
  margin: 4px 0 6px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.comment-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
