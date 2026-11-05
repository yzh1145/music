<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { search as searchApi } from '../api'
import PlaylistCard from '../components/PlaylistCard.vue'
import SongTable from '../components/SongTable.vue'
import { formatCount } from '../utils/format'

const route = useRoute()
const router = useRouter()

const keyword = ref(route.query.keyword || '')
// 已提交搜索的关键词：输入框里打字时不切换页面状态，按回车后才更新
const searched = ref('')
const activeTab = ref('all')
const loading = ref(false)
const result = ref({
  songs: [],
  playlists: [],
  singers: [],
  albums: [],
  songTotal: 0,
  playlistTotal: 0,
  singerTotal: 0,
  albumTotal: 0
})
const history = ref(JSON.parse(localStorage.getItem('music_search_history') || '[]'))

const hasResult = computed(
  () => result.value.songTotal + result.value.playlistTotal + result.value.singerTotal + result.value.albumTotal > 0
)

function saveHistory(value) {
  const list = [value, ...history.value.filter((item) => item !== value)].slice(0, 10)
  history.value = list
  localStorage.setItem('music_search_history', JSON.stringify(list))
}

function doSearch(value) {
  const words = (value || '').trim()
  if (!words) return
  keyword.value = words
  searched.value = words
  saveHistory(words)
  loading.value = true
  searchApi(words, 30)
    .then((data) => {
      result.value = data
    })
    .finally(() => {
      loading.value = false
    })
}

function chooseHistory(value) {
  router.push({ name: 'search', query: { keyword: value } })
}

function clearHistory() {
  history.value = []
  localStorage.removeItem('music_search_history')
}

function runSearch() {
  if (!keyword.value.trim()) return
  router.push({ name: 'search', query: { keyword: keyword.value.trim() } })
}

watch(
  () => route.query.keyword,
  (value) => {
    if (route.name !== 'search') return
    const words = value || ''
    keyword.value = words
    if (words) doSearch(words)
    else searched.value = ''
  }
)

onMounted(() => {
  if (keyword.value) doSearch(keyword.value)
})
</script>

<template>
  <div class="page search-page">
    <div class="search-bar card">
      <el-input v-model="keyword" placeholder="搜索歌曲、歌手、歌单、专辑" size="large" clearable @keyup.enter="runSearch">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button @click="runSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 搜索历史 -->
    <div v-if="!searched" class="card history-card">
      <div class="history-head">
        <h2 class="section-title">搜索历史</h2>
        <el-button v-if="history.length" text size="small" @click="clearHistory">清空</el-button>
      </div>
      <div class="history-tags">
        <el-tag
          v-for="item in history"
          :key="item"
          class="history-tag"
          round
          type="info"
          effect="plain"
          @click="chooseHistory(item)"
        >
          {{ item }}
        </el-tag>
        <span v-if="!history.length" class="text-light">还没有搜索记录，试试搜索「夏」</span>
      </div>
    </div>

    <template v-else>
      <div v-loading="loading" class="result card">
        <el-tabs v-model="activeTab" class="result-tabs">
          <el-tab-pane name="all" label="综合">
            <div v-if="!hasResult" class="empty-wrap">
              <el-empty :description="`没有找到与「${searched}」相关的内容`" />
            </div>
            <template v-else>
              <section v-if="result.songs.length" class="block">
                <h3 class="block-title">单曲</h3>
                <SongTable :songs="result.songs.slice(0, 8)" :show-album="false" :show-cover="true" :show-header="false" />
              </section>

              <section v-if="result.playlists.length" class="block">
                <h3 class="block-title">歌单</h3>
                <div class="playlist-grid">
                  <PlaylistCard
                    v-for="playlist in result.playlists.slice(0, 6)"
                    :key="playlist.id"
                    :playlist="playlist"
                  />
                </div>
              </section>

              <section v-if="result.singers.length" class="block">
                <h3 class="block-title">歌手</h3>
                <div class="singer-row">
                  <div
                    v-for="singer in result.singers.slice(0, 8)"
                    :key="singer.id"
                    class="singer-item"
                    @click="router.push(`/singer/${singer.id}`)"
                  >
                    <img :src="singer.avatar" class="singer-avatar" />
                    <div class="singer-name text-ellipsis">{{ singer.name }}</div>
                  </div>
                </div>
              </section>

              <section v-if="result.albums.length" class="block">
                <h3 class="block-title">专辑</h3>
                <div class="album-row">
                  <div
                    v-for="album in result.albums.slice(0, 6)"
                    :key="album.id"
                    class="album-item"
                    @click="router.push(`/album/${album.id}`)"
                  >
                    <img :src="album.cover" class="album-cover" />
                    <div class="album-name text-ellipsis">{{ album.name }}</div>
                    <div class="text-light text-ellipsis">{{ album.singerName }}</div>
                  </div>
                </div>
              </section>
            </template>
          </el-tab-pane>

          <el-tab-pane name="song" :label="`单曲 ${result.songTotal}`">
            <SongTable v-if="result.songs.length" :songs="result.songs" :active-id="null" />
            <el-empty v-else description="没有找到歌曲" />
          </el-tab-pane>

          <el-tab-pane name="playlist" :label="`歌单 ${result.playlistTotal}`">
            <div v-if="result.playlists.length" class="playlist-grid">
              <PlaylistCard v-for="playlist in result.playlists" :key="playlist.id" :playlist="playlist" />
            </div>
            <el-empty v-else description="没有找到歌单" />
          </el-tab-pane>

          <el-tab-pane name="singer" :label="`歌手 ${result.singerTotal}`">
            <div v-if="result.singers.length" class="singer-row">
              <div
                v-for="singer in result.singers"
                :key="singer.id"
                class="singer-item"
                @click="router.push(`/singer/${singer.id}`)"
              >
                <img :src="singer.avatar" class="singer-avatar" />
                <div class="singer-name text-ellipsis">{{ singer.name }}</div>
                <div class="text-light singer-sub">{{ singer.songCount }} 首歌曲</div>
              </div>
            </div>
            <el-empty v-else description="没有找到歌手" />
          </el-tab-pane>

          <el-tab-pane name="album" :label="`专辑 ${result.albumTotal}`">
            <div v-if="result.albums.length" class="album-row">
              <div
                v-for="album in result.albums"
                :key="album.id"
                class="album-item"
                @click="router.push(`/album/${album.id}`)"
              >
                <img :src="album.cover" class="album-cover" />
                <div class="album-name text-ellipsis">{{ album.name }}</div>
                <div class="text-light text-ellipsis">{{ album.singerName }} · {{ formatCount(album.songCount) }} 首</div>
              </div>
            </div>
            <el-empty v-else description="没有找到专辑" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-bar {
  padding: 16px;
  margin-bottom: 18px;
}

.history-card {
  padding: 20px;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 6px;
}

.history-tag {
  cursor: pointer;
}

.history-tag:hover {
  color: var(--music-red-light);
  border-color: var(--el-color-primary-light-5);
}

.result {
  padding: 8px 20px 20px;
}

.result-tabs :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

.result-tabs :deep(.el-tabs__item:hover) {
  color: var(--music-red-light);
}

.block {
  margin-bottom: 28px;
}

.block-title {
  margin: 0 0 12px;
  font-size: 16px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
}

.singer-row,
.album-row {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 16px;
}

.singer-item,
.album-item {
  text-align: center;
  cursor: pointer;
}

.singer-avatar {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
}

.album-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  object-fit: cover;
}

.singer-name,
.album-name {
  margin-top: 8px;
  font-size: 13px;
}

.album-name {
  text-align: left;
}

.album-item > .text-light {
  text-align: left;
  font-size: 11px;
}

.singer-sub {
  font-size: 11px;
}

.singer-item:hover .singer-name,
.album-item:hover .album-name {
  color: var(--music-red-light);
}

.empty-wrap {
  padding: 40px 0;
}

@media (max-width: 900px) {
  .playlist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .singer-row,
  .album-row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
