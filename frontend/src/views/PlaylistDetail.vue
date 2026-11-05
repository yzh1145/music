<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  addSongToPlaylist,
  collectPlaylist,
  deletePlaylist,
  getPlaylist,
  getSongPage,
  playSong as reportPlay,
  removeSongFromPlaylist,
  updatePlaylist
} from '../api'
import SongTable from '../components/SongTable.vue'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { formatCount, formatDate } from '../utils/format'

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()
const userStore = useUserStore()

const loading = ref(true)
const detail = ref({ playlist: null, songs: [] })
const addVisible = ref(false)
const editVisible = ref(false)
const addLoading = ref(false)
const keyword = ref('')
const candidates = ref([])
const editForm = ref({ name: '', intro: '' })

const playlist = computed(() => detail.value.playlist)
const songs = computed(() => detail.value.songs || [])
const editable = computed(() => {
  if (!playlist.value || !userStore.isLogin) return false
  return userStore.isAdmin || playlist.value.userId === userStore.user?.id
})

function load() {
  loading.value = true
  getPlaylist(route.params.id)
    .then((data) => {
      detail.value = data
    })
    .finally(() => {
      loading.value = false
    })
}

function playAll() {
  if (!songs.value.length) {
    ElMessage.warning('这个歌单还没有歌曲')
    return
  }
  player.playList(songs.value, 0)
  reportPlay(route.params.id).catch(() => {})
}

function toggleCollect() {
  if (!userStore.isLogin) {
    ElMessage.warning('登录后才能收藏歌单')
    userStore.openLogin()
    return
  }
  collectPlaylist(playlist.value.id).then((collected) => {
    playlist.value.collected = collected
    playlist.value.collectCount += collected ? 1 : -1
    ElMessage.success(collected ? '收藏成功' : '已取消收藏')
  })
}

function searchSongs() {
  addLoading.value = true
  getSongPage({ keyword: keyword.value.trim(), page: 1, size: 20 })
    .then((data) => {
      candidates.value = data.list || []
    })
    .finally(() => {
      addLoading.value = false
    })
}

function addSong(song) {
  if (songs.value.some((item) => item.id === song.id)) {
    ElMessage.warning('这首歌已经在歌单里了')
    return
  }
  addSongToPlaylist(playlist.value.id, song.id).then(() => {
    ElMessage.success('已添加到歌单')
    load()
  })
}

function removeSong(song) {
  ElMessageBox.confirm(`确定从歌单中移除《${song.name}》吗？`, '提示', { type: 'warning' })
    .then(() => {
      removeSongFromPlaylist(playlist.value.id, song.id).then(() => {
        ElMessage.success('已移除')
        load()
      })
    })
    .catch(() => {})
}

function openEdit() {
  editForm.value = { name: playlist.value.name, intro: playlist.value.intro || '' }
  editVisible.value = true
}

function saveEdit() {
  if (!editForm.value.name.trim()) {
    ElMessage.warning('歌单名称不能为空')
    return
  }
  updatePlaylist(playlist.value.id, editForm.value).then(() => {
    ElMessage.success('保存成功')
    editVisible.value = false
    load()
  })
}

function removePlaylist() {
  ElMessageBox.confirm('删除后歌单不可恢复，确定删除吗？', '提示', { type: 'warning' })
    .then(() => {
      deletePlaylist(playlist.value.id).then(() => {
        ElMessage.success('已删除歌单')
        router.replace('/my')
      })
    })
    .catch(() => {})
}

function openAdd() {
  addVisible.value = true
  keyword.value = ''
  searchSongs()
}

watch(
  () => route.params.id,
  () => {
    if (route.name === 'playlist') load()
  }
)

onMounted(load)
</script>

<template>
  <div class="page playlist-detail" v-loading="loading">
    <template v-if="playlist">
      <div class="hero">
        <div class="hero-bg" :style="{ backgroundImage: `url(${playlist.cover})` }"></div>
        <div class="hero-body">
        <img :src="playlist.cover" :alt="playlist.name" class="hero-cover" />
        <div class="hero-info">
          <div class="hero-type">
            <el-icon><Notebook /></el-icon>
            歌单
            <span v-if="playlist.isRecommend === 1" class="tag">推荐</span>
          </div>
          <h1 class="hero-title">{{ playlist.name }}</h1>
          <div class="hero-meta">
            <span class="creator">
              <el-avatar :size="22" :src="playlist.creatorAvatar">{{ playlist.creatorName?.[0] }}</el-avatar>
              <span>{{ playlist.creatorName }}</span>
            </span>
            <span>{{ formatDate(playlist.createTime) }} 创建</span>
          </div>
          <div class="hero-meta stats num">
            <span class="category">{{ playlist.category }}</span>
            <span>播放 {{ formatCount(playlist.playCount) }}</span>
            <span>收藏 {{ formatCount(playlist.collectCount) }}</span>
            <span>歌曲 {{ songs.length }} 首</span>
          </div>
          <p v-if="playlist.intro" class="hero-intro">{{ playlist.intro }}</p>
          <div class="hero-actions">
            <el-button type="primary" round @click="playAll">
              <el-icon class="mr6"><VideoPlay /></el-icon>播放全部
            </el-button>
            <el-button round @click="toggleCollect">
              <el-icon class="mr6"><component :is="playlist.collected ? 'StarFilled' : 'Star'" /></el-icon>
              {{ playlist.collected ? '已收藏' : '收藏' }}
            </el-button>
            <template v-if="editable">
              <el-button round @click="openAdd">
                <el-icon class="mr6"><Plus /></el-icon>添加歌曲
              </el-button>
              <el-button round @click="openEdit">
                <el-icon class="mr6"><Edit /></el-icon>编辑
              </el-button>
              <el-button round @click="removePlaylist">删除</el-button>
            </template>
          </div>
        </div>
        </div>
      </div>

      <div class="song-panel card">
        <div class="panel-head">
          <h2 class="panel-title">歌曲列表</h2>
          <span class="text-light">{{ songs.length }} 首</span>
        </div>
        <SongTable :songs="songs" show-cover show-actions :active-id="player.current?.id">
          <template #actions="{ song }">
            <span v-if="editable" class="remove" @click="removeSong(song)">移除</span>
            <span v-else class="play-count">
              <el-icon><Headset /></el-icon>{{ formatCount(song.playCount) }}
            </span>
          </template>
        </SongTable>
      </div>
    </template>

    <!-- 添加歌曲弹窗 -->
    <el-dialog v-model="addVisible" title="添加歌曲到歌单" width="560px">
      <el-input
        v-model="keyword"
        placeholder="搜索歌曲名称或歌手"
        clearable
        @keyup.enter="searchSongs"
        @clear="searchSongs"
      >
        <template #append>
          <el-button :icon="'Search'" @click="searchSongs" />
        </template>
      </el-input>
      <div v-loading="addLoading" class="candidates">
        <div v-for="song in candidates" :key="song.id" class="candidate">
          <img :src="song.cover" class="candidate-cover" />
          <div class="candidate-info">
            <div class="text-ellipsis">{{ song.name }}</div>
            <div class="text-light text-ellipsis">{{ song.singerName }}</div>
          </div>
          <el-button size="small" type="primary" plain @click="addSong(song)">添加</el-button>
        </div>
        <el-empty v-if="!addLoading && !candidates.length" description="没有找到歌曲" :image-size="60" />
      </div>
    </el-dialog>

    <!-- 编辑歌单弹窗 -->
    <el-dialog v-model="editVisible" title="编辑歌单" width="440px">
      <el-form label-position="top">
        <el-form-item label="歌单名称">
          <el-input v-model="editForm.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="歌单简介">
          <el-input v-model="editForm.intro" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.tag {
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--music-red-light);
  color: #fff;
  font-size: 10px;
}

.creator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 13px;
}

.stats {
  margin-top: 10px;
}

.category {
  padding: 1px 10px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  color: #fff;
}

.mr6 {
  margin-right: 4px;
}

.song-panel {
  padding: 16px 20px 24px;
}

.panel-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 12px;
}

.panel-title {
  margin: 0;
  font-size: 18px;
}

.remove {
  color: var(--music-text-3);
  cursor: pointer;
}

.remove:hover {
  color: var(--music-red-light);
}

.play-count {
  display: flex;
  align-items: center;
  gap: 3px;
}

.candidates {
  max-height: 360px;
  overflow-y: auto;
  margin-top: 14px;
}

.candidate {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
}

.candidate:hover {
  background: var(--music-hover);
}

.candidate-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.candidate-info {
  flex: 1;
  min-width: 0;
  font-size: 13px;
}
</style>
