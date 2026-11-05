<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  changePassword,
  clearHistory,
  createPlaylist,
  deletePlaylist,
  getCollectPlaylists,
  getFollowSingers,
  getHistory,
  getLikeSongs,
  getMyPlaylists,
  getProfile,
  getCategories,
  updateProfile
} from '../api'
import PlaylistCard from '../components/PlaylistCard.vue'
import SongTable from '../components/SongTable.vue'
import { usePlayerStore } from '../stores/player'
import { useUserStore } from '../stores/user'
import { formatCount } from '../utils/format'

const router = useRouter()
const player = usePlayerStore()
const userStore = useUserStore()

const activeTab = ref('like')
const loading = ref(false)
const likeSongs = ref([])
const createList = ref([])
const collectList = ref([])
const followList = ref([])
const historyList = ref([])
const categories = ref([])

const createVisible = ref(false)
const createForm = reactive({ name: '', intro: '', category: '流行' })
const profileForm = reactive({ nickname: '', signature: '', avatar: '', gender: 0, phone: '', email: '' })
const passwordForm = reactive({ oldPassword: '', newPassword: '', confirm: '' })
const profileSaving = ref(false)
const passwordSaving = ref(false)

const profile = computed(() => userStore.user || {})

const tabs = [
  { name: 'like', label: '我喜欢的音乐', icon: 'StarFilled' },
  { name: 'create', label: '创建的歌单', icon: 'Notebook' },
  { name: 'collect', label: '收藏的歌单', icon: 'CollectionTag' },
  { name: 'follow', label: '关注的歌手', icon: 'Microphone' },
  { name: 'history', label: '播放历史', icon: 'Clock' },
  { name: 'profile', label: '个人资料', icon: 'User' }
]

function loadTab(tab) {
  activeTab.value = tab
  if (tab === 'like') {
    loading.value = true
    getLikeSongs()
      .then((data) => {
        likeSongs.value = data || []
      })
      .finally(() => {
        loading.value = false
      })
  } else if (tab === 'create') {
    getMyPlaylists().then((data) => {
      createList.value = data || []
    })
  } else if (tab === 'collect') {
    getCollectPlaylists().then((data) => {
      collectList.value = data || []
    })
  } else if (tab === 'follow') {
    getFollowSingers().then((data) => {
      followList.value = data || []
    })
  } else if (tab === 'history') {
    getHistory(100).then((data) => {
      historyList.value = data || []
    })
  } else if (tab === 'profile') {
    loadProfile()
  }
}

function loadProfile() {
  getProfile().then((data) => {
    userStore.user = data
    userStore.persist()
    Object.assign(profileForm, {
      nickname: data.nickname,
      signature: data.signature || '',
      avatar: data.avatar || '',
      gender: data.gender || 0,
      phone: data.phone || '',
      email: data.email || ''
    })
  })
  if (!categories.value.length) {
    getCategories().then((data) => {
      categories.value = data || []
    })
  }
}

function openCreate() {
  createForm.name = ''
  createForm.intro = ''
  createForm.category = categories.value[0]?.name || '流行'
  createVisible.value = true
}

function submitCreate() {
  if (!createForm.name.trim()) {
    ElMessage.warning('请输入歌单名称')
    return
  }
  createPlaylist(createForm).then(() => {
    ElMessage.success('歌单创建成功')
    createVisible.value = false
    loadTab('create')
  })
}

function removePlaylist(item) {
  ElMessageBox.confirm(`确定删除歌单《${item.name}》吗？`, '提示', { type: 'warning' })
    .then(() => {
      deletePlaylist(item.id).then(() => {
        ElMessage.success('已删除')
        loadTab('create')
      })
    })
    .catch(() => {})
}

function saveProfile() {
  if (!profileForm.nickname.trim()) {
    ElMessage.warning('昵称不能为空')
    return
  }
  profileSaving.value = true
  updateProfile({ ...profileForm })
    .then(() => {
      ElMessage.success('资料已更新')
      userStore.fetchProfile()
    })
    .finally(() => {
      profileSaving.value = false
    })
}

function savePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    ElMessage.warning('请填写完整的密码信息')
    return
  }
  if (passwordForm.newPassword !== passwordForm.confirm) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  passwordSaving.value = true
  changePassword({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
    .then(() => {
      ElMessage.success('密码修改成功，请重新登录')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirm = ''
      userStore.logout()
      router.push('/')
    })
    .finally(() => {
      passwordSaving.value = false
    })
}

function clearAllHistory() {
  ElMessageBox.confirm('确定清空全部播放历史吗？', '提示', { type: 'warning' })
    .then(() => {
      clearHistory().then(() => {
        historyList.value = []
        ElMessage.success('已清空播放历史')
      })
    })
    .catch(() => {})
}

onMounted(() => {
  loadTab('like')
  // 顶部统计依赖各列表长度，进入页面时一并加载，避免未点开对应 tab 时显示 0
  getMyPlaylists().then((data) => {
    createList.value = data || []
  })
  getCollectPlaylists().then((data) => {
    collectList.value = data || []
  })
  getFollowSingers().then((data) => {
    followList.value = data || []
  })
})
</script>

<template>
  <div class="page my-music">
    <div class="user-card card">
      <el-avatar :size="72" :src="userStore.avatar" />
      <div class="user-main">
        <h1 class="user-nickname">{{ profile.nickname }}</h1>
        <div class="user-account text-light">@{{ profile.username }}</div>
        <div class="user-signature text-light">{{ profile.signature || '这个人很懒，还没有留下签名' }}</div>
      </div>
      <div class="user-stats">
        <div class="stat">
          <div class="stat-value">{{ likeSongs.length }}</div>
          <div class="stat-label">喜欢</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ createList.length + collectList.length }}</div>
          <div class="stat-label">歌单</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ followList.length }}</div>
          <div class="stat-label">关注</div>
        </div>
      </div>
    </div>

    <div class="my-body">
      <aside class="side-menu card">
        <div
          v-for="tab in tabs"
          :key="tab.name"
          class="menu-item"
          :class="{ active: activeTab === tab.name }"
          @click="loadTab(tab.name)"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          <span>{{ tab.label }}</span>
        </div>
      </aside>

      <section class="content card" v-loading="loading">
        <!-- 我喜欢的音乐 -->
        <template v-if="activeTab === 'like'">
          <div class="content-head">
            <h2 class="content-title">我喜欢的音乐</h2>
            <el-button
              v-if="likeSongs.length"
              type="primary"
              size="small"
              round
              @click="player.playList(likeSongs, 0)"
            >
              <el-icon class="mr6"><VideoPlay /></el-icon>播放全部
            </el-button>
          </div>
          <SongTable v-if="likeSongs.length || loading" :songs="likeSongs" :active-id="player.current?.id" />
          <el-empty v-else description="还没有喜欢的歌曲，去发现好音乐吧">
            <el-button type="primary" round @click="router.push('/')">去发现音乐</el-button>
          </el-empty>
        </template>

        <!-- 创建的歌单 -->
        <template v-else-if="activeTab === 'create'">
          <div class="content-head">
            <h2 class="content-title">创建的歌单</h2>
            <el-button type="primary" size="small" round @click="openCreate">
              <el-icon class="mr6"><Plus /></el-icon>新建歌单
            </el-button>
          </div>
          <div v-if="createList.length" class="playlist-grid">
            <div v-for="item in createList" :key="item.id" class="playlist-wrap">
              <PlaylistCard :playlist="item" :show-creator="false" />
              <el-button class="delete-btn" text size="small" @click.stop="removePlaylist(item)">删除</el-button>
            </div>
          </div>
          <el-empty v-else description="还没有创建歌单" />
        </template>

        <!-- 收藏的歌单 -->
        <template v-else-if="activeTab === 'collect'">
          <div class="content-head">
            <h2 class="content-title">收藏的歌单</h2>
          </div>
          <div v-if="collectList.length" class="playlist-grid">
            <PlaylistCard v-for="item in collectList" :key="item.id" :playlist="item" />
          </div>
          <el-empty v-else description="还没有收藏歌单" />
        </template>

        <!-- 关注的歌手 -->
        <template v-else-if="activeTab === 'follow'">
          <div class="content-head">
            <h2 class="content-title">关注的歌手</h2>
          </div>
          <div v-if="followList.length" class="singer-grid">
            <div
              v-for="singer in followList"
              :key="singer.id"
              class="singer-item"
              @click="router.push(`/singer/${singer.id}`)"
            >
              <img :src="singer.avatar" class="singer-avatar" />
              <div class="singer-name text-ellipsis">{{ singer.name }}</div>
              <div class="text-light singer-sub">{{ singer.songCount }} 首歌曲</div>
            </div>
          </div>
          <el-empty v-else description="还没有关注的歌手" />
        </template>

        <!-- 播放历史 -->
        <template v-else-if="activeTab === 'history'">
          <div class="content-head">
            <h2 class="content-title">播放历史</h2>
            <el-button v-if="historyList.length" size="small" round @click="clearAllHistory">清空历史</el-button>
          </div>
          <div v-if="historyList.length" class="history-list">
            <div
              v-for="(song, index) in historyList"
              :key="song.id"
              class="history-item"
              @click="player.playList(historyList, index)"
            >
              <img :src="song.cover" class="history-cover" />
              <div class="history-info">
                <div class="text-ellipsis">{{ song.name }}</div>
                <div class="text-light text-ellipsis">{{ song.singerName }}</div>
              </div>
              <span class="text-light history-time">{{ song.playTime }}</span>
            </div>
          </div>
          <el-empty v-else description="还没有播放记录" />
        </template>

        <!-- 个人资料 -->
        <template v-else-if="activeTab === 'profile'">
          <div class="content-head">
            <h2 class="content-title">个人资料</h2>
          </div>
          <el-form label-width="80px" class="profile-form">
            <el-form-item label="头像地址">
              <el-input v-model="profileForm.avatar" placeholder="/images/avatar/u1.png" />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" maxlength="20" show-word-limit />
            </el-form-item>
            <el-form-item label="性别">
              <el-radio-group v-model="profileForm.gender">
                <el-radio :value="0">保密</el-radio>
                <el-radio :value="1">男</el-radio>
                <el-radio :value="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profileForm.phone" maxlength="20" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" maxlength="50" />
            </el-form-item>
            <el-form-item label="个性签名">
              <el-input v-model="profileForm.signature" type="textarea" :rows="3" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="profileSaving" @click="saveProfile">保存资料</el-button>
            </el-form-item>
          </el-form>

          <el-divider content-position="left">修改密码</el-divider>
          <el-form label-width="80px" class="profile-form">
            <el-form-item label="原密码">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirm" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="passwordSaving" @click="savePassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </template>
      </section>
    </div>

    <!-- 新建歌单 -->
    <el-dialog v-model="createVisible" title="新建歌单" width="440px">
      <el-form label-position="top">
        <el-form-item label="歌单名称">
          <el-input v-model="createForm.name" maxlength="50" show-word-limit placeholder="给歌单起个名字" />
        </el-form-item>
        <el-form-item label="歌单分类">
          <el-select v-model="createForm.category" style="width: 100%">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="歌单简介">
          <el-input v-model="createForm.intro" type="textarea" :rows="3" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  margin-bottom: 20px;
}

.user-main {
  flex: 1;
  min-width: 0;
}

.user-nickname {
  margin: 0;
  font-size: 24px;
}

.user-account {
  margin-top: 2px;
  font-size: 12px;
}

.user-signature {
  margin-top: 8px;
  font-size: 12px;
}

.user-stats {
  display: flex;
  gap: 28px;
  padding-right: 12px;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.stat-label {
  color: var(--music-text-3);
  font-size: 12px;
}

.my-body {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.side-menu {
  width: 180px;
  padding: 10px;
  flex-shrink: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--music-text-2);
  font-size: 13px;
  cursor: pointer;
}

.menu-item:hover {
  background: var(--music-hover);
}

.menu-item.active {
  background: var(--music-active-bg);
  color: var(--music-red-light);
  font-weight: 600;
}

.content {
  flex: 1;
  min-width: 0;
  padding: 20px 24px 28px;
}

.content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.content-title {
  margin: 0;
  font-size: 20px;
}

.mr6 {
  margin-right: 4px;
}

.playlist-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
}

.playlist-wrap {
  position: relative;
}

.delete-btn {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 6px;
  color: #fff;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.playlist-wrap:hover .delete-btn {
  opacity: 1;
}

.singer-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
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
}

.singer-name {
  margin-top: 8px;
  font-size: 13px;
}

.singer-item:hover .singer-name {
  color: var(--music-red-light);
}

.singer-sub {
  font-size: 11px;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
}

.history-item:hover {
  background: var(--music-hover);
}

.history-cover {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  object-fit: cover;
}

.history-info {
  flex: 1;
  min-width: 0;
  font-size: 13px;
}

.history-time {
  font-size: 11px;
}

.profile-form {
  max-width: 460px;
}

@media (max-width: 900px) {
  .my-body {
    flex-direction: column;
  }

  .side-menu {
    display: flex;
    width: 100%;
    overflow-x: auto;
  }

  .content {
    width: 100%;
  }

  .playlist-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .singer-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .history-list {
    grid-template-columns: 1fr;
  }

  .user-stats {
    display: none;
  }
}
</style>
