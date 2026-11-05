<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { likeSong } from '../api'
import { formatDuration } from '../utils/format'
import AppIcon from './AppIcon.vue'

const player = usePlayerStore()
const userStore = useUserStore()
const router = useRouter()

const liking = ref(false)
const queueVisible = ref(false)

const progress = computed({
  get: () => player.currentTime || 0,
  set: (value) => player.seek(value)
})

const modeTitle = computed(() => {
  return { order: '列表循环', single: '单曲循环', random: '随机播放' }[player.mode]
})

const modeIcon = computed(() => {
  return { order: 'repeat', single: 'repeat-one', random: 'shuffle' }[player.mode]
})

const volumeIcon = computed(() => {
  if (player.volume === 0) return 'mute'
  return player.volume < 0.5 ? 'volume-low' : 'volume'
})

function toggleLike() {
  if (!userStore.isLogin) {
    ElMessage.warning('登录后才能收藏喜欢的音乐')
    userStore.openLogin()
    return
  }
  if (!player.current) return
  liking.value = true
  likeSong(player.current.id)
    .then((liked) => {
      player.current.liked = liked
      ElMessage.success(liked ? '已添加到我喜欢的音乐' : '已取消喜欢')
    })
    .finally(() => {
      liking.value = false
    })
}

function cycleMode() {
  const modes = ['order', 'single', 'random']
  const index = modes.indexOf(player.mode)
  player.setMode(modes[(index + 1) % modes.length])
}

function playFromQueue(song) {
  player.playOne(song)
  queueVisible.value = false
}

function openSongDetail() {
  if (player.current) router.push(`/song/${player.current.id}`)
}

onMounted(() => {
  player.initAudio()
})

watch(
  () => player.volume,
  (value) => {
    if (player.audio) player.audio.volume = value
  }
)
</script>

<template>
  <div class="player-bar">
    <div class="player-inner">
      <!-- 左侧：当前歌曲 -->
      <div class="player-left">
        <template v-if="player.current">
          <div class="player-cover" @click="openSongDetail">
            <img :src="player.current.cover" :alt="player.current.name" :class="{ rotating: player.playing }" />
            <div class="player-cover-ring"></div>
          </div>
          <div class="player-meta">
            <div class="player-name-row">
              <span class="player-name text-ellipsis" @click="openSongDetail">{{ player.current.name }}</span>
              <el-tooltip :content="player.current.liked ? '取消喜欢' : '喜欢'" placement="top">
                <button
                  class="like-btn"
                  :class="{ liked: player.current.liked }"
                  :disabled="liking"
                  @click="toggleLike"
                >
                  <AppIcon :name="player.current.liked ? 'heart-fill' : 'heart'" :size="16" />
                </button>
              </el-tooltip>
            </div>
            <div class="player-singer text-ellipsis" @click="router.push(`/singer/${player.current.singerId}`)">
              {{ player.current.singerName }}
            </div>
          </div>
        </template>
        <template v-else>
          <div class="player-cover placeholder"><el-icon :size="20"><Headset /></el-icon></div>
          <div class="player-meta">
            <div class="player-name text-light">还没有播放中的歌曲</div>
            <div class="player-singer text-light">去首页挑一首喜欢的吧</div>
          </div>
        </template>
      </div>

      <!-- 中间：控制区 -->
      <div class="player-center">
        <div class="player-controls">
          <el-tooltip :content="modeTitle" placement="top">
            <el-button text circle class="ctrl-btn" @click="cycleMode">
              <AppIcon :name="modeIcon" :size="18" />
            </el-button>
          </el-tooltip>
          <el-button text circle class="ctrl-btn" :disabled="!player.hasSong" @click="player.prev()">
            <AppIcon name="prev" :size="18" />
          </el-button>
          <el-button class="play-btn" type="primary" circle :disabled="!player.hasSong" @click="player.toggle()">
            <AppIcon :name="player.playing ? 'pause' : 'play'" :size="18" :class="{ 'play-offset': !player.playing }" />
          </el-button>
          <el-button text circle class="ctrl-btn" :disabled="!player.hasSong" @click="player.next()">
            <AppIcon name="next" :size="18" />
          </el-button>
          <!-- 不再用 el-tooltip 包 el-popover：两层弹出层嵌套会触发 Vue 指令警告 -->
          <el-popover v-model:visible="queueVisible" placement="top" :width="320" trigger="click">
              <template #reference>
                <el-button text circle class="ctrl-btn" title="播放队列" aria-label="播放队列">
                  <AppIcon name="queue" :size="18" />
                </el-button>
              </template>
              <div class="queue">
                <div class="queue-header">当前播放 <span class="text-light">({{ player.queue.length }})</span></div>
                <el-scrollbar max-height="280px">
                  <div
                    v-for="(song, index) in player.queue"
                    :key="song.id + '-' + index"
                    class="queue-item"
                    :class="{ active: index === player.index }"
                    @click="playFromQueue(song)"
                  >
                    <span class="queue-index num">{{ index + 1 }}</span>
                    <img :src="song.cover" class="queue-cover" />
                    <span class="queue-name text-ellipsis">{{ song.name }}</span>
                    <span class="queue-singer text-ellipsis">{{ song.singerName }}</span>
                  </div>
                  <el-empty v-if="!player.queue.length" description="队列为空" :image-size="60" />
                </el-scrollbar>
              </div>
            </el-popover>
        </div>

        <div class="player-progress">
          <span class="time num">{{ formatDuration(player.currentTime) }}</span>
          <el-slider
            v-model="progress"
            :max="player.duration || 0"
            :show-tooltip="false"
            :disabled="!player.hasSong"
            size="small"
            class="progress-slider"
          />
          <span class="time num">{{ formatDuration(player.duration) }}</span>
        </div>
      </div>

      <!-- 右侧：音量 -->
      <div class="player-right">
        <AppIcon :name="volumeIcon" :size="18" class="volume-icon" />
        <el-slider
          :model-value="player.volume"
          :max="1"
          :step="0.01"
          :show-tooltip="false"
          size="small"
          class="volume-slider"
          @input="player.setVolume"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  height: var(--player-height);
  /* 半透明毛玻璃：滚动时能隐约看到下面的内容，歌曲页的深色背景也能透出来 */
  background: var(--music-player-bg);
  backdrop-filter: blur(20px) saturate(1.6);
  -webkit-backdrop-filter: blur(20px) saturate(1.6);
  border-top: 1px solid var(--music-border);
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
}

.player-inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 20px;
}

.player-left {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 300px;
  flex-shrink: 0;
}

.player-cover {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  background: var(--music-hover);
}

.player-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 暂停时停在当前角度，继续播放时接着转 */
  animation: cover-rotate 20s linear infinite;
  animation-play-state: paused;
}

.player-cover img.rotating {
  animation-play-state: running;
}

@keyframes cover-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.player-cover-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 8px solid rgba(255, 255, 255, 0.35);
  pointer-events: none;
}

.player-cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--music-text-3);
}

.player-meta {
  min-width: 0;
  flex: 1;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.player-name {
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.like-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--music-text-3);
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
}

.like-btn:hover {
  color: var(--music-red-light);
}

.like-btn:active {
  transform: scale(0.85);
}

.like-btn.liked {
  color: var(--music-red-light);
}

.like-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

.player-name:hover {
  color: var(--music-red-light);
}

.player-singer {
  margin-top: 3px;
  font-size: 12px;
  color: var(--music-text-light);
  cursor: pointer;
}

.player-singer:hover {
  color: var(--music-red-light);
}

.player-center {
  flex: 1;
  min-width: 0;
}

.player-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.ctrl-btn:not(.is-disabled) {
  color: var(--music-text-2);
}

.ctrl-btn:not(.is-disabled):hover {
  color: var(--music-red-light);
}

.play-btn {
  width: 38px;
  height: 38px;
}

/* 三角形视觉重心偏左，右移一点看起来才居中 */
.play-offset {
  margin-left: 2px;
}

.player-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
}

.player-progress .time {
  width: 38px;
  font-size: 11px;
  color: var(--music-text-3);
  text-align: center;
}

.progress-slider {
  flex: 1;
}

.progress-slider :deep(.el-slider__runway) {
  height: 3px;
  background: var(--music-hover);
}

.progress-slider :deep(.el-slider__bar) {
  height: 3px;
  background: var(--music-red-light);
}

.progress-slider :deep(.el-slider__button) {
  width: 10px;
  height: 10px;
  border-color: var(--music-red-light);
}

.player-right {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 150px;
  flex-shrink: 0;
}

.volume-icon {
  color: var(--music-text-3);
}

.volume-slider {
  width: 100px;
}

.volume-slider :deep(.el-slider__runway) {
  height: 3px;
}

.volume-slider :deep(.el-slider__bar) {
  height: 3px;
  background: var(--music-text-3);
}

.volume-slider :deep(.el-slider__runway) {
  background: var(--music-hover);
}

.volume-slider :deep(.el-slider__button) {
  width: 10px;
  height: 10px;
  border-color: var(--music-text-3);
}

.queue-header {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--music-border);
  font-weight: 600;
  font-size: 13px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.queue-item:hover {
  background: var(--music-hover);
}

.queue-item.active {
  color: var(--music-red-light);
  font-weight: 600;
}

.queue-index {
  width: 16px;
  color: var(--music-text-3);
  text-align: center;
}

.queue-cover {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
}

.queue-name {
  flex: 1;
  min-width: 0;
}

.queue-singer {
  width: 70px;
  color: var(--music-text-3);
}

@media (max-width: 768px) {
  .player-right {
    display: none;
  }

  .player-left {
    width: auto;
    max-width: 40%;
  }

  .player-inner {
    gap: 10px;
    padding: 0 12px;
  }
}
</style>
