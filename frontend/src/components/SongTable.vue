<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '../stores/player'
import { formatDuration, formatCount } from '../utils/format'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  songs: { type: Array, default: () => [] },
  showAlbum: { type: Boolean, default: true },
  showSinger: { type: Boolean, default: true },
  showCover: { type: Boolean, default: false },
  showHeader: { type: Boolean, default: true },
  showActions: { type: Boolean, default: false },
  /** 列表本身就是推荐内容时（如首页推荐单曲）可关闭，避免每行重复的「推荐」标签 */
  showRecommendTag: { type: Boolean, default: true },
  activeId: { type: Number, default: null }
})

const emit = defineEmits(['play', 'action'])

const player = usePlayerStore()
const router = useRouter()

const rows = computed(() => props.songs || [])

function play(song, index) {
  player.playList(rows.value, index)
  emit('play', song, index)
}

function isPlaying(song) {
  return player.current?.id === song.id && player.playing
}

/** 根据显示的列动态计算表格栅格，避免列错位 */
const gridTemplate = computed(() => {
  const columns = ['48px']
  if (props.showCover) columns.push('56px')
  columns.push('minmax(0, 1fr)')
  if (props.showSinger) columns.push('150px')
  if (props.showAlbum) columns.push('180px')
  columns.push('70px')
  if (props.showActions) columns.push('90px')
  return columns.join(' ')
})

/** 窄屏隐藏歌手、专辑列后的栅格 */
const gridTemplateMobile = computed(() => {
  const columns = ['36px']
  if (props.showCover) columns.push('48px')
  columns.push('minmax(0, 1fr)', '52px')
  if (props.showActions) columns.push('64px')
  return columns.join(' ')
})

// 通过 CSS 变量传给样式，媒体查询才能覆盖（行内 grid-template-columns 无法被覆盖）
const gridStyle = computed(() => ({
  '--grid-columns': gridTemplate.value,
  '--grid-columns-mobile': gridTemplateMobile.value
}))
</script>

<template>
  <div class="song-table" :style="gridStyle">
    <div v-if="showHeader && rows.length" class="song-head">
      <span class="col-index">#</span>
      <span v-if="showCover" class="col-cover"></span>
      <span class="col-name">音乐标题</span>
      <span v-if="showSinger" class="col-singer">歌手</span>
      <span v-if="showAlbum" class="col-album">专辑</span>
      <span class="col-duration">时长</span>
      <span v-if="showActions" class="col-actions">操作</span>
    </div>

    <div
      v-for="(song, index) in rows"
      :key="song.id"
      class="song-row"
      :class="{ active: activeId ? song.id === activeId : player.current?.id === song.id }"
      @dblclick="play(song, index)"
    >
      <span class="col-index num">
        <span class="index-text">{{ String(index + 1).padStart(2, '0') }}</span>
        <el-icon class="index-play" :size="14" @click.stop="play(song, index)">
          <component :is="isPlaying(song) ? 'VideoPause' : 'VideoPlay'" />
        </el-icon>
      </span>

      <span v-if="showCover" class="col-cover">
        <img :src="song.cover" class="row-cover" @click.stop="play(song, index)" />
      </span>

      <span class="col-name">
        <span class="song-name text-ellipsis" @click.stop="play(song, index)">{{ song.name }}</span>
        <span v-if="showRecommendTag && song.isRecommend === 1" class="tag">推荐</span>
        <AppIcon v-if="song.liked" name="heart-fill" :size="13" class="liked-icon" title="已喜欢" />
      </span>

      <span v-if="showSinger" class="col-singer text-ellipsis">
        <span class="link" @click.stop="router.push(`/singer/${song.singerId}`)">{{ song.singerName }}</span>
      </span>

      <span v-if="showAlbum" class="col-album text-ellipsis">
        <span v-if="song.albumId" class="link" @click.stop="router.push(`/album/${song.albumId}`)">{{ song.albumName }}</span>
        <span v-else class="text-light">-</span>
      </span>

      <span class="col-duration num">{{ formatDuration(song.duration) }}</span>

      <span v-if="showActions" class="col-actions">
        <slot name="actions" :song="song" :index="index">
          <span class="play-count">
            <el-icon><Headset /></el-icon>{{ formatCount(song.playCount) }}
          </span>
        </slot>
      </span>
    </div>

    <el-empty v-if="!rows.length" description="暂时没有歌曲" :image-size="80" />
  </div>
</template>

<style scoped>
.song-table {
  border-radius: 10px;
  overflow: hidden;
  /* 双击播放时避免选中列表文字 */
  user-select: none;
}

.song-head,
.song-row {
  display: grid;
  grid-template-columns: var(--grid-columns);
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.song-head {
  height: 40px;
  color: var(--music-text-3);
  font-size: 12px;
  border-bottom: 1px solid var(--music-border);
}

.song-row {
  height: 48px;
  border-radius: 8px;
  color: var(--music-text);
  transition: background 0.15s ease;
}

.song-row:hover {
  background: var(--music-hover);
}

.song-row.active {
  color: var(--music-red-light);
}

.song-row.active .song-name {
  font-weight: 600;
}

.col-index {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--music-text-3);
  font-size: 12px;
  cursor: pointer;
}

.col-index .index-play {
  position: absolute;
  opacity: 0;
  color: var(--music-red-light);
}

.song-row:hover .index-text {
  opacity: 0;
}

.song-row:hover .index-play {
  opacity: 1;
}

.col-cover .row-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  cursor: pointer;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.song-name {
  cursor: pointer;
  max-width: 100%;
}

.tag {
  flex-shrink: 0;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--el-color-primary-light-9);
  color: var(--music-red-light);
  font-size: 10px;
  line-height: 1.4;
}

.liked-icon {
  color: var(--music-red-light);
}

.col-singer,
.col-album {
  min-width: 0;
  color: var(--music-text-2);
  font-size: 13px;
}

.link {
  cursor: pointer;
}

.link:hover {
  color: var(--music-red-light);
}

.col-duration {
  color: var(--music-text-3);
  font-size: 12px;
}

.col-actions {
  display: flex;
  justify-content: flex-end;
  color: var(--music-text-3);
  font-size: 12px;
}

.play-count {
  display: flex;
  align-items: center;
  gap: 3px;
}

@media (max-width: 768px) {
  .song-head,
  .song-row {
    grid-template-columns: var(--grid-columns-mobile);
    padding: 0 6px;
  }

  .col-singer,
  .col-album {
    display: none;
  }
}
</style>
