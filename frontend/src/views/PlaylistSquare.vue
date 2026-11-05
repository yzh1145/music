<script setup>
import { onMounted, ref, watch } from 'vue'
import { getCategories, getPlaylistPage } from '../api'
import PlaylistCard from '../components/PlaylistCard.vue'

const categories = ref([{ id: 0, name: '全部' }])
const activeCategory = ref('全部')
const playlists = ref([])
const total = ref(0)
const page = ref(1)
const size = 18
const loading = ref(false)

function load() {
  loading.value = true
  const params = { page: page.value, size }
  if (activeCategory.value !== '全部') params.category = activeCategory.value
  getPlaylistPage(params)
    .then((data) => {
      playlists.value = data.list || []
      total.value = data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function changeCategory(name) {
  activeCategory.value = name
  page.value = 1
  load()
}

watch(page, load)

onMounted(() => {
  getCategories().then((data) => {
    categories.value = [{ id: 0, name: '全部' }, ...(data || [])]
  })
  load()
})
</script>

<template>
  <div class="page playlist-square" v-loading="loading">
    <div class="square-head">
      <h1 class="square-title">歌单广场</h1>
      <span class="text-light">共 {{ total }} 个歌单</span>
    </div>

    <div class="category-bar">
      <span
        v-for="category in categories"
        :key="category.id"
        class="category-item"
        :class="{ active: activeCategory === category.name }"
        @click="changeCategory(category.name)"
      >
        {{ category.name }}
      </span>
    </div>

    <div v-if="playlists.length" class="playlist-grid">
      <PlaylistCard v-for="item in playlists" :key="item.id" :playlist="item" />
    </div>
    <el-empty v-else description="这个分类下还没有歌单" />

    <div v-if="total > size" class="pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="prev, pager, next"
        background
        hide-on-single-page
      />
    </div>
  </div>
</template>

<style scoped>
.square-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 18px;
}

.square-title {
  margin: 0;
  font-size: 26px;
}

.category-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 22px;
}

.category-item {
  padding: 5px 14px;
  border-radius: 15px;
  background: var(--music-card);
  color: var(--music-text-2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-item:hover {
  color: var(--music-red-light);
}

.category-item.active {
  background: var(--music-red-light);
  color: #fff;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 18px 18px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 26px;
}

@media (max-width: 900px) {
  .playlist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
