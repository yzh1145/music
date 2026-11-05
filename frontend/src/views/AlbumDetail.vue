<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getAlbum } from '../api'
import SongTable from '../components/SongTable.vue'
import { usePlayerStore } from '../stores/player'
import { formatDate } from '../utils/format'

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()

const loading = ref(true)
const detail = ref({ album: null, songs: [] })

const album = computed(() => detail.value.album)
const songs = computed(() => detail.value.songs || [])

function load() {
  loading.value = true
  getAlbum(route.params.id)
    .then((data) => {
      detail.value = data
    })
    .finally(() => {
      loading.value = false
    })
}

function playAll() {
  if (!songs.value.length) {
    ElMessage.warning('这张专辑还没有歌曲')
    return
  }
  player.playList(songs.value, 0)
}

watch(
  () => route.params.id,
  () => {
    if (route.name === 'album') load()
  }
)

onMounted(load)
</script>

<template>
  <div class="page album-detail" v-loading="loading">
    <template v-if="album">
      <div class="hero">
        <div class="hero-bg" :style="{ backgroundImage: `url(${album.cover})` }"></div>
        <div class="hero-body">
          <img :src="album.cover" :alt="album.name" class="hero-cover" />
          <div class="hero-info">
            <div class="hero-type">
              <el-icon><Notebook /></el-icon> 专辑
            </div>
            <h1 class="hero-title">{{ album.name }}</h1>
            <div class="hero-meta">
              <span>歌手：<span class="hero-link" @click="router.push(`/singer/${album.singerId}`)">{{ album.singerName }}</span></span>
              <span class="num">发行时间：{{ formatDate(album.publishDate) }}</span>
              <span v-if="album.company">发行公司：{{ album.company }}</span>
            </div>
            <p class="hero-intro">{{ album.intro || '暂无专辑简介' }}</p>
            <div class="hero-actions">
              <el-button type="primary" round @click="playAll">
                <el-icon class="mr6"><VideoPlay /></el-icon>播放全部（{{ songs.length }}）
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="card panel">
        <h2 class="panel-title">歌曲列表</h2>
        <SongTable :songs="songs" :active-id="player.current?.id" :show-album="false" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.mr6 {
  margin-right: 4px;
}

.panel {
  padding: 16px 20px 24px;
}

.panel-title {
  margin: 0 0 12px;
  font-size: 18px;
}
</style>
