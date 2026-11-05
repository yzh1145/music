<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getHome } from '../api'
import PlaylistCard from '../components/PlaylistCard.vue'
import SongTable from '../components/SongTable.vue'
import { formatCount } from '../utils/format'

const router = useRouter()

const loading = ref(true)
const home = ref({
  banners: [],
  recommendPlaylists: [],
  newSongs: [],
  hotSingers: [],
  recommendSongs: []
})

// 两栏歌曲显示相同条数，左右底部对齐
const columnSize = computed(() => {
  const a = home.value.recommendSongs.length
  const b = home.value.newSongs.length
  return Math.min(a, b) || Math.max(a, b)
})
const recommendSongs = computed(() => home.value.recommendSongs.slice(0, columnSize.value))
const newSongs = computed(() => home.value.newSongs.slice(0, columnSize.value))

function openBanner(banner) {
  if (banner.linkType === 1) router.push(`/playlist/${banner.linkId}`)
  else if (banner.linkType === 2) router.push(`/singer/${banner.linkId}`)
  else if (banner.linkType === 3) router.push(`/song/${banner.linkId}`)
}

onMounted(() => {
  getHome()
    .then((data) => {
      home.value = data
    })
    .finally(() => {
      loading.value = false
    })
})
</script>

<template>
  <div class="page home">
    <el-skeleton :loading="loading" animated>
      <template #template>
        <el-skeleton-item variant="image" class="skeleton-banner" />
        <el-skeleton-item variant="h3" class="skeleton-title" />
        <div class="playlist-grid">
          <div v-for="n in 6" :key="n">
            <el-skeleton-item variant="image" class="skeleton-cover" />
            <el-skeleton-item variant="text" class="skeleton-line" />
            <el-skeleton-item variant="text" class="skeleton-line short" />
          </div>
        </div>
        <div class="two-columns skeleton-columns">
          <div v-for="n in 2" :key="n" class="card column-card">
            <div v-for="m in 6" :key="m" class="skeleton-row">
              <el-skeleton-item variant="image" class="skeleton-row-cover" />
              <el-skeleton-item variant="text" class="skeleton-row-text" />
            </div>
          </div>
        </div>
      </template>

      <template #default>
    <!-- 轮播图 -->
    <el-carousel v-if="home.banners.length" height="100%" :interval="4500" arrow="hover" class="banner">
      <el-carousel-item v-for="banner in home.banners" :key="banner.id">
        <div class="banner-item" @click="openBanner(banner)">
          <img :src="banner.imageUrl" :alt="banner.title" />
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 推荐歌单 -->
    <section class="section">
      <h2 class="section-title">
        推荐歌单
        <span class="section-more" @click="router.push('/playlists')">更多 ›</span>
      </h2>
      <div class="playlist-grid">
        <PlaylistCard v-for="playlist in home.recommendPlaylists" :key="playlist.id" :playlist="playlist" />
      </div>
    </section>

    <!-- 推荐单曲 + 新歌速递 -->
    <div class="two-columns">
      <section class="section column">
        <h2 class="section-title">推荐单曲</h2>
        <div class="card column-card">
          <SongTable
            :songs="recommendSongs"
            :show-album="false"
            :show-cover="true"
            :show-header="false"
            :show-recommend-tag="false"
          />
        </div>
      </section>

      <section class="section column">
        <h2 class="section-title">新歌速递</h2>
        <div class="card column-card">
          <SongTable :songs="newSongs" :show-album="false" :show-cover="true" :show-header="false" />
        </div>
      </section>
    </div>

    <!-- 热门歌手 -->
    <section class="section">
      <h2 class="section-title">热门歌手</h2>
      <div class="singer-grid">
        <div
          v-for="singer in home.hotSingers"
          :key="singer.id"
          class="singer-item"
          @click="router.push(`/singer/${singer.id}`)"
        >
          <img :src="singer.avatar" :alt="singer.name" class="singer-avatar" />
          <div class="singer-name text-ellipsis">{{ singer.name }}</div>
          <div class="singer-info text-ellipsis">
            {{ singer.songCount }} 首 · {{ formatCount(singer.followCount) }} 关注
          </div>
        </div>
      </div>
    </section>
      </template>
    </el-skeleton>
  </div>
</template>

<style scoped>
/* 与轮播素材 1200×400 保持一致的 3:1 比例，避免上下被裁切 */
.banner {
  aspect-ratio: 3 / 1;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 32px;
}

.banner-item {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.banner-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px;
}

.two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
}

.column {
  min-width: 0;
}

.column-card {
  padding: 8px;
}

.skeleton-banner {
  width: 100%;
  height: auto;
  aspect-ratio: 3 / 1;
  border-radius: 14px;
  margin-bottom: 32px;
}

.skeleton-title {
  width: 160px;
  margin-bottom: 16px;
}

.skeleton-cover {
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
}

.skeleton-line {
  margin-top: 8px;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-columns {
  margin-top: 36px;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 12px;
}

.skeleton-row-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
}

.skeleton-row-text {
  flex: 1;
}

.singer-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 16px;
}

.singer-item {
  text-align: center;
  cursor: pointer;
}

.singer-avatar {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  transition: transform 0.25s ease;
}

.singer-item:hover .singer-avatar {
  transform: scale(1.05);
}

.singer-name {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
}

.singer-item:hover .singer-name {
  color: var(--music-red-light);
}

.singer-info {
  margin-top: 2px;
  color: var(--music-text-3);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
}

@media (max-width: 900px) {
  .playlist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .singer-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .two-columns {
    grid-template-columns: 1fr;
  }
}
</style>
