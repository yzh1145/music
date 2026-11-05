<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  addSongToPlaylist,
  getMyPlaylists,
  getSong,
  likeSong,
  playSong as reportPlay
} from '../api'
import AppIcon from '../components/AppIcon.vue'
import CommentList from '../components/CommentList.vue'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { formatCount, formatDuration, parseLyric } from '../utils/format'

const route = useRoute()
const router = useRouter()
const player = usePlayerStore()
const userStore = useUserStore()

const song = ref(null)
const lyrics = ref([])
const loading = ref(true)
const lyricBox = ref(null)
const myPlaylists = ref([])

const isCurrent = computed(() => player.current?.id === song.value?.id)
const isPlaying = computed(() => isCurrent.value && player.playing)

const currentTime = computed(() => (isCurrent.value ? player.currentTime : 0))
const duration = computed(() => (isCurrent.value ? player.duration : song.value?.duration || 0))

const activeIndex = computed(() => {
  if (!lyrics.value.length) return -1
  const time = currentTime.value
  let index = -1
  for (let i = 0; i < lyrics.value.length; i += 1) {
    if (lyrics.value[i].time <= time + 0.2) index = i
    else break
  }
  return index
})

const progress = computed({
  get: () => currentTime.value,
  set: (value) => {
    if (isCurrent.value) player.seek(value)
  }
})

function load() {
  loading.value = true
  getSong(route.params.id)
    .then((data) => {
      song.value = data
      lyrics.value = parseLyric(data.lyric)
    })
    .finally(() => {
      loading.value = false
    })
}

function play() {
  if (isCurrent.value) {
    player.toggle()
  } else {
    player.playOne(song.value)
  }
}

function playLyric(line) {
  if (!isCurrent.value) return
  player.seek(line.time)
  if (!player.playing) player.toggle()
}

function toggleLike() {
  if (!userStore.isLogin) {
    ElMessage.warning('登录后才能收藏喜欢的音乐')
    userStore.openLogin()
    return
  }
  likeSong(song.value.id).then((liked) => {
    song.value.liked = liked
    if (player.current?.id === song.value.id) player.current.liked = liked
    ElMessage.success(liked ? '已添加到我喜欢的音乐' : '已取消喜欢')
  })
}

function loadPlaylists() {
  if (!userStore.isLogin) return
  getMyPlaylists().then((data) => {
    myPlaylists.value = data || []
  })
}

function addToPlaylist(playlistId) {
  addSongToPlaylist(playlistId, song.value.id)
    .then(() => ElMessage.success('已添加到歌单'))
    .catch(() => {})
}

watch(activeIndex, async (index) => {
  if (index < 0 || !lyricBox.value) return
  await nextTick()
  const box = lyricBox.value
  const active = box.querySelector('.lyric-line.active')
  if (active) {
    // 只滚动歌词容器本身；scrollIntoView 会连带滚动整个页面
    box.scrollTo({
      top: active.offsetTop - box.clientHeight / 2 + active.clientHeight / 2,
      behavior: 'smooth'
    })
  }
})

watch(
  () => route.params.id,
  () => {
    if (route.name === 'song') load()
  }
)

onMounted(() => {
  load()
  loadPlaylists()
})
</script>

<template>
  <div class="song-detail" v-loading="loading">
    <div v-if="song" class="bg" :style="{ backgroundImage: `url(${song.cover})` }"></div>
    <div v-if="song" class="bg-fade"></div>

    <div v-if="song" class="detail-body">
      <div class="disc-area">
        <div class="disc-wrap">
          <div class="disc" :class="{ playing: isPlaying }">
            <img :src="song.cover" :alt="song.name" />
          </div>
          <!-- 高光不随唱片旋转，单独一层 -->
          <div class="disc-shine"></div>
          <!-- 唱针：转轴在唱片右上方，播放时落到唱片外圈，暂停时抬起 -->
          <svg class="needle" :class="{ playing: isPlaying }" viewBox="0 0 120 130" aria-hidden="true">
            <path d="M20 20 L40 74 L88 104" fill="none" stroke="#cfcfcf" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M20 20 L40 74 L88 104" fill="none" stroke="#f4f4f4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <rect x="84" y="102" width="24" height="14" rx="3" fill="#e2e2e2" stroke="#a8a8a8" stroke-width="1.5" transform="rotate(32 96 109)" />
            <circle cx="20" cy="20" r="16" fill="#ececec" stroke="#b5b5b5" stroke-width="2" />
            <circle cx="20" cy="20" r="6" fill="#9a9a9a" />
          </svg>
        </div>

        <div class="disc-controls">
          <el-button text circle class="ctrl" @click="player.prev()">
            <AppIcon name="prev" :size="22" />
          </el-button>
          <el-button class="play-btn" circle @click="play">
            <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="24" :class="{ 'play-offset': !isPlaying }" />
          </el-button>
          <el-button text circle class="ctrl" @click="player.next()">
            <AppIcon name="next" :size="22" />
          </el-button>
        </div>

        <div class="progress num">
          <span class="time">{{ formatDuration(currentTime) }}</span>
          <el-slider v-model="progress" :max="duration || 0" :show-tooltip="false" size="small" />
          <span class="time">{{ formatDuration(duration) }}</span>
        </div>
      </div>

      <div class="info-area">
        <div class="song-head">
          <div class="song-title-row">
            <h1 class="song-title">{{ song.name }}</h1>
            <el-tooltip :content="song.liked ? '取消喜欢' : '喜欢'" placement="top">
              <el-button text circle class="like-btn" :class="{ liked: song.liked }" @click="toggleLike">
                <AppIcon :name="song.liked ? 'heart-fill' : 'heart'" :size="22" />
              </el-button>
            </el-tooltip>
          </div>
          <div class="song-meta">
            <span>专辑：<span class="link" @click="router.push(`/album/${song.albumId}`)">{{ song.albumName }}</span></span>
            <span>歌手：<span class="link" @click="router.push(`/singer/${song.singerId}`)">{{ song.singerName }}</span></span>
            <span>分类：{{ song.categoryName }}</span>
          </div>
          <div class="song-stats num">
            <span><el-icon><Headset /></el-icon> {{ formatCount(song.playCount) }}</span>
            <span><AppIcon name="heart" :size="13" /> {{ formatCount(song.likeCount) }}</span>
            <span><el-icon><ChatDotRound /></el-icon> {{ formatCount(song.commentCount) }}</span>
          </div>

          <div class="song-actions">
            <el-button type="primary" round @click="play">
              <el-icon class="mr6"><VideoPlay /></el-icon>{{ isPlaying ? '暂停' : '播放' }}
            </el-button>
            <el-dropdown trigger="click" @command="addToPlaylist">
              <el-button round>
                <el-icon class="mr6"><Plus /></el-icon>添加到歌单
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="item in myPlaylists" :key="item.id" :command="item.id">
                    {{ item.name }}
                  </el-dropdown-item>
                  <el-dropdown-item v-if="!myPlaylists.length" disabled>还没有创建歌单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <div ref="lyricBox" class="lyric-box">
          <div
            v-for="(line, index) in lyrics"
            :key="index"
            class="lyric-line"
            :class="{ active: index === activeIndex }"
            @click="playLyric(line)"
          >
            {{ line.text }}
          </div>
          <div v-if="!lyrics.length" class="lyric-empty">纯音乐，请欣赏</div>
        </div>
      </div>
    </div>

    <div v-if="song" class="page comment-section">
      <div class="card comment-card">
        <h2 class="section-title">听友评论</h2>
        <CommentList :song-id="song.id" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.song-detail {
  position: relative;
  min-height: calc(100vh - 60px);
  padding-bottom: calc(var(--player-height) + 40px);
  overflow: hidden;
}

/* 模糊背景只覆盖上半部分，并渐变过渡到页面底色，评论区不再压在大片深色上 */
.bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 760px;
  background-size: cover;
  background-position: center;
  filter: blur(60px) brightness(0.45);
  transform: scale(1.2);
}

.bg-fade {
  position: absolute;
  top: 460px;
  left: 0;
  right: 0;
  height: 320px;
  background: linear-gradient(180deg, transparent, var(--music-bg) 90%);
  pointer-events: none;
}

.detail-body {
  position: relative;
  display: flex;
  gap: 40px;
  max-width: 1120px;
  margin: 0 auto;
  padding: 48px 20px 32px;
  color: #fff;
}

.disc-area {
  position: relative;
  width: 380px;
  flex-shrink: 0;
  text-align: center;
}

.disc-wrap {
  position: relative;
  width: 320px;
  height: 320px;
  margin: 40px auto 0;
}

/* 黑胶：细密纹路 + 外圈反光边 */
.disc {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background:
    repeating-radial-gradient(circle at center, rgba(255, 255, 255, 0.035) 0 1px, transparent 1px 3px),
    radial-gradient(circle at center, #222 0%, #0b0b0b 60%, #1b1b1b 100%);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.5),
    0 0 0 6px rgba(255, 255, 255, 0.06),
    inset 0 0 0 2px rgba(255, 255, 255, 0.05);
  padding: 62px;
  animation: rotate 22s linear infinite;
  animation-play-state: paused;
}

.disc.playing {
  animation-play-state: running;
}

/* 封面外的一圈标签纸边 */
.disc img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 0 4px #111, 0 0 0 5px rgba(255, 255, 255, 0.08);
}

/* 斜向高光：固定不动，唱片转起来才有光泽感 */
.disc-shine {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(
    from 30deg,
    transparent 0deg,
    rgba(255, 255, 255, 0.07) 30deg,
    transparent 70deg,
    transparent 180deg,
    rgba(255, 255, 255, 0.05) 210deg,
    transparent 250deg
  );
  pointer-events: none;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 转轴圆心在 SVG 的 (20,20)，绕它旋转；暂停时向右上抬起离开唱片 */
.needle {
  position: absolute;
  top: -36px;
  right: -16px;
  width: 120px;
  height: 130px;
  transform-origin: 20px 20px;
  transform: rotate(-28deg);
  transition: transform 0.5s ease;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4));
  z-index: 2;
}

.needle.playing {
  transform: rotate(0deg);
}

.disc-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 26px;
}

.ctrl {
  --el-button-text-color: rgba(255, 255, 255, 0.85);
  --el-button-hover-text-color: #fff;
  --el-fill-color-light: rgba(255, 255, 255, 0.12);
  --el-fill-color: rgba(255, 255, 255, 0.18);
}

.like-btn {
  --el-button-text-color: rgba(255, 255, 255, 0.75);
  --el-button-hover-text-color: #fff;
  --el-fill-color-light: rgba(255, 255, 255, 0.12);
  --el-fill-color: rgba(255, 255, 255, 0.18);
}

.like-btn.liked {
  --el-button-text-color: var(--music-red-light);
  --el-button-hover-text-color: var(--music-red-light);
}

.play-btn {
  width: 54px;
  height: 54px;
  border: none;
  background: #fff;
  color: var(--music-red);
}

.play-btn:hover {
  background: #fff;
  color: var(--music-red);
  transform: scale(1.04);
}

.play-offset {
  margin-left: 3px;
}

.progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.progress .time {
  width: 34px;
  flex-shrink: 0;
}

.progress :deep(.el-slider) {
  flex: 1;
}

.progress :deep(.el-slider__runway) {
  height: 3px;
}

.progress :deep(.el-slider__bar) {
  height: 3px;
}

.progress :deep(.el-slider__button-wrapper) {
  top: -16px;
}

.progress :deep(.el-slider__button) {
  width: 10px;
  height: 10px;
}

.progress :deep(.el-slider__runway) {
  background: rgba(255, 255, 255, 0.25);
}

.progress :deep(.el-slider__bar) {
  background: #fff;
}

.progress :deep(.el-slider__button) {
  border-color: #fff;
  background: #fff;
}

.info-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.song-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.song-title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
}

.song-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 14px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.72);
}

.link {
  color: #fff;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
}

.link:hover {
  color: #ffd7d7;
}

.song-stats {
  display: flex;
  gap: 18px;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
}

.song-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.song-actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.mr6 {
  margin-right: 4px;
}

.lyric-box {
  flex: 1;
  max-height: 320px;
  margin-top: 24px;
  overflow-y: auto;
  padding-right: 8px;
  mask-image: linear-gradient(180deg, transparent, #000 12%, #000 82%, transparent);
  scrollbar-width: none;
}

.lyric-box::-webkit-scrollbar {
  display: none;
}

/* 歌词左对齐，与上方标题信息对齐；当前行只做缩放与变色，不改字号，避免整列跳动 */
.lyric-line {
  padding: 7px 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
  line-height: 1.5;
  cursor: pointer;
  transform-origin: left center;
  transition: color 0.3s ease, transform 0.3s ease;
}

.lyric-line:hover {
  color: rgba(255, 255, 255, 0.85);
}

.lyric-line.active {
  color: #fff;
  font-weight: 600;
  transform: scale(1.12);
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
}

.lyric-empty {
  padding: 40px 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.comment-section {
  position: relative;
  padding-top: 8px;
}

.comment-card {
  padding: 24px;
}

@media (max-width: 900px) {
  .detail-body {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .disc-area {
    width: 100%;
  }

  .disc-wrap {
    width: 240px;
    height: 240px;
  }

  .disc {
    padding: 46px;
  }

  .needle {
    display: none;
  }

  .song-title-row,
  .song-meta,
  .song-stats,
  .song-actions {
    justify-content: center;
  }

  .lyric-box {
    max-height: 240px;
  }

  .lyric-line {
    transform-origin: center;
  }
}
</style>
