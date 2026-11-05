<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { followSinger, getSinger } from '../api'
import SongTable from '../components/SongTable.vue'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { formatCount, formatDate } from '../utils/format'

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()
const userStore = useUserStore()

const loading = ref(true)
const detail = ref({ singer: null, songs: [], albums: [] })

const singer = computed(() => detail.value.singer)
const songs = computed(() => detail.value.songs || [])
const albums = computed(() => detail.value.albums || [])

function load() {
  loading.value = true
  getSinger(route.params.id)
    .then((data) => {
      detail.value = data
    })
    .finally(() => {
      loading.value = false
    })
}

function playAll() {
  if (!songs.value.length) {
    ElMessage.warning('这位歌手还没有歌曲')
    return
  }
  player.playList(songs.value, 0)
}

function toggleFollow() {
  if (!userStore.isLogin) {
    ElMessage.warning('登录后才能关注歌手')
    userStore.openLogin()
    return
  }
  followSinger(singer.value.id).then((followed) => {
    singer.value.followed = followed
    singer.value.followCount += followed ? 1 : -1
    ElMessage.success(followed ? '已关注' : '已取消关注')
  })
}

watch(
  () => route.params.id,
  () => {
    if (route.name === 'singer') load()
  }
)

onMounted(load)
</script>

<template>
  <div class="page singer-detail" v-loading="loading">
    <template v-if="singer">
      <div class="hero">
        <div class="hero-bg" :style="{ backgroundImage: `url(${singer.cover || singer.avatar})` }"></div>
        <div class="hero-body">
          <img :src="singer.avatar" :alt="singer.name" class="hero-cover singer-avatar" />
          <div class="hero-info">
            <div class="hero-type">
              <el-icon><Microphone /></el-icon> 歌手
            </div>
            <h1 class="hero-title">{{ singer.name }}</h1>
            <div class="hero-meta num">
              <span>{{ singer.region || '未知地区' }}</span>
              <span v-if="singer.birthday">{{ formatDate(singer.birthday) }}</span>
              <span>{{ singer.songCount }} 首歌曲</span>
              <span>{{ singer.albumCount }} 张专辑</span>
            </div>
            <p class="hero-intro">{{ singer.intro || '这位歌手还没有填写简介' }}</p>
            <div class="hero-actions">
              <el-button round :type="singer.followed ? 'default' : 'primary'" @click="toggleFollow">
                <el-icon class="mr6"><component :is="singer.followed ? 'Check' : 'Plus'" /></el-icon>
                {{ singer.followed ? '已关注' : '关注' }} {{ formatCount(singer.followCount) }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="card panel">
        <div class="panel-head">
          <h2 class="panel-title">热门歌曲</h2>
          <el-button type="primary" size="small" round @click="playAll">播放全部</el-button>
        </div>
        <SongTable :songs="songs" :active-id="player.current?.id" />
      </div>

      <section v-if="albums.length" class="section">
        <h2 class="section-title">专辑</h2>
        <div class="album-grid">
          <div v-for="album in albums" :key="album.id" class="album-card" @click="router.push(`/album/${album.id}`)">
            <img :src="album.cover" :alt="album.name" class="album-cover" />
            <div class="album-name text-ellipsis">{{ album.name }}</div>
            <div class="album-meta text-light">{{ album.songCount }} 首 · {{ formatDate(album.publishDate) }}</div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.singer-avatar {
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.25);
}

.mr6 {
  margin-right: 4px;
}

.panel {
  padding: 16px 20px 24px;
  margin-bottom: 32px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
}

.panel-title {
  margin: 0;
  font-size: 18px;
}

.album-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
}

.album-card {
  cursor: pointer;
}

.album-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.album-card:hover .album-cover {
  transform: translateY(-4px);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.14);
}

.album-name {
  margin-top: 8px;
  font-size: 13px;
}

.album-meta {
  margin-top: 2px;
  font-size: 11px;
}

@media (max-width: 768px) {
  .album-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
