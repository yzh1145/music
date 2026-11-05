<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getPlaylist, playPlaylist } from '../api'
import { usePlayerStore } from '../stores/player'
import { formatCount } from '../utils/format'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  playlist: { type: Object, required: true },
  showCreator: { type: Boolean, default: true }
})

const router = useRouter()
const player = usePlayerStore()
const starting = ref(false)

function open() {
  router.push(`/playlist/${props.playlist.id}`)
}

/** 悬停播放按钮：直接拉取歌单歌曲并播放，不跳转页面 */
function playAll() {
  if (!props.playlist.songCount) {
    ElMessage.warning('这个歌单还没有歌曲')
    return
  }
  if (starting.value) return
  starting.value = true
  getPlaylist(props.playlist.id)
    .then((data) => {
      if (!data.songs?.length) {
        ElMessage.warning('这个歌单还没有歌曲')
        return
      }
      player.playList(data.songs, 0)
      playPlaylist(props.playlist.id).catch(() => {})
    })
    .finally(() => {
      starting.value = false
    })
}

defineExpose({ open })
</script>

<template>
  <div class="playlist-card" @click="open">
    <div class="card-cover">
      <img :src="playlist.cover" :alt="playlist.name" loading="lazy" />
      <div class="card-count num">
        <el-icon><Headset /></el-icon>
        <span>{{ formatCount(playlist.playCount) }}</span>
      </div>
      <div class="cover-mask">
        <span class="play-icon" title="播放全部" @click.stop="playAll">
          <AppIcon name="play" :size="20" class="play-offset" />
        </span>
      </div>
    </div>
    <div class="card-name text-ellipsis" :title="playlist.name">{{ playlist.name }}</div>
    <div v-if="showCreator" class="card-creator text-ellipsis">
      by {{ playlist.creatorName }} · {{ playlist.songCount || 0 }} 首
    </div>
  </div>
</template>

<style scoped>
.playlist-card {
  cursor: pointer;
  width: 100%;
}

.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  overflow: hidden;
  background: var(--music-hover);
}

.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.playlist-card:hover .card-cover img {
  transform: scale(1.04);
}

.card-count {
  position: absolute;
  top: 6px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 3px;
  color: #fff;
  font-size: 11px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
}

.card-name {
  margin-top: 8px;
  font-size: 13px;
  line-height: 20px;
  color: var(--music-text);
}

.playlist-card:hover .card-name {
  color: var(--music-red-light);
}

.card-creator {
  margin-top: 2px;
  color: var(--music-text-3);
  font-size: 11px;
}

.cover-mask {
  border-radius: 10px;
}

.play-offset {
  margin-left: 2px;
}
</style>
