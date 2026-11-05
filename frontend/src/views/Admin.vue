<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  adminAlbums,
  adminBanners,
  adminDeleteAlbum,
  adminDeleteBanner,
  adminDeletePlaylist,
  adminDeleteSinger,
  adminDeleteSong,
  adminPlaylists,
  adminSaveAlbum,
  adminSaveBanner,
  adminSavePlaylist,
  adminSaveSinger,
  adminSaveSong,
  adminSingers,
  adminSongs,
  adminStats,
  adminUpdateUser,
  adminUsers,
  getCategories
} from '../api'
import { formatCount, formatDuration } from '../utils/format'

const activeTab = ref('dashboard')
const loading = ref(false)
const stats = ref({})
const songs = ref([])
const singers = ref([])
const albums = ref([])
const playlists = ref([])
const banners = ref([])
const users = ref([])
const categories = ref([])

const keyword = ref('')
const songStatus = ref(-1)
const page = ref(1)
const size = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const form = reactive({})
const currentType = ref('song')

const singerOptions = ref([])
const albumOptions = ref([])

const tabTitle = computed(() => {
  return {
    dashboard: '数据看板',
    song: '歌曲管理',
    singer: '歌手管理',
    album: '专辑管理',
    playlist: '歌单管理',
    banner: '轮播图管理',
    user: '用户管理'
  }[activeTab.value]
})

function resetPager() {
  page.value = 1
  total.value = 0
}

function loadStats() {
  adminStats().then((data) => {
    stats.value = data
  })
}

function loadSongs() {
  loading.value = true
  adminSongs({ keyword: keyword.value, status: songStatus.value, page: page.value, size: size.value })
    .then((data) => {
      songs.value = data.list || []
      total.value = data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function loadSingers() {
  loading.value = true
  adminSingers({ keyword: keyword.value, page: page.value, size: size.value })
    .then((data) => {
      singers.value = data.list || []
      total.value = data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function loadAlbums() {
  loading.value = true
  adminAlbums({ keyword: keyword.value, page: page.value, size: size.value })
    .then((data) => {
      albums.value = data.list || []
      total.value = data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function loadPlaylists() {
  loading.value = true
  adminPlaylists({ keyword: keyword.value, page: page.value, size: size.value })
    .then((data) => {
      playlists.value = data.list || []
      total.value = data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function loadBanners() {
  loading.value = true
  adminBanners()
    .then((data) => {
      banners.value = data || []
      total.value = banners.value.length
    })
    .finally(() => {
      loading.value = false
    })
}

function loadUsers() {
  loading.value = true
  adminUsers({ keyword: keyword.value, page: page.value, size: size.value })
    .then((data) => {
      users.value = data.list || []
      total.value = data.total || 0
    })
    .finally(() => {
      loading.value = false
    })
}

function loadOptions() {
  adminSingers({ page: 1, size: 100 }).then((data) => {
    singerOptions.value = data.list || []
  })
  adminAlbums({ page: 1, size: 100 }).then((data) => {
    albumOptions.value = data.list || []
  })
  if (!categories.value.length) {
    getCategories().then((data) => {
      categories.value = data || []
    })
  }
}

function loadCurrent() {
  resetPager()
  keyword.value = ''
  load()
}

function load() {
  if (activeTab.value === 'dashboard') loadStats()
  else if (activeTab.value === 'song') loadSongs()
  else if (activeTab.value === 'singer') loadSingers()
  else if (activeTab.value === 'album') loadAlbums()
  else if (activeTab.value === 'playlist') loadPlaylists()
  else if (activeTab.value === 'banner') loadBanners()
  else if (activeTab.value === 'user') loadUsers()
}

function changeTab(tab) {
  activeTab.value = tab
  loadCurrent()
  if (tab === 'song' || tab === 'album') loadOptions()
}

function openDialog(type, row) {
  currentType.value = type
  Object.keys(form).forEach((key) => delete form[key])
  dialogTitle.value = `${row && row.id ? '编辑' : '新增'}${
    { song: '歌曲', singer: '歌手', album: '专辑', playlist: '歌单', banner: '轮播图' }[type]
  }`
  if (type === 'song') {
    Object.assign(form, {
      id: row?.id,
      name: row?.name || '',
      singerId: row?.singerId || null,
      albumId: row?.albumId || null,
      categoryId: row?.categoryId || null,
      cover: row?.cover || '/images/album/a1.png',
      audioUrl: row?.audioUrl || '/audio/track-1.wav',
      duration: row?.duration || 0,
      lyric: row?.lyric || '',
      isRecommend: row?.isRecommend ?? 0,
      status: row?.status ?? 1
    })
    loadOptions()
  } else if (type === 'singer') {
    Object.assign(form, {
      id: row?.id,
      name: row?.name || '',
      avatar: row?.avatar || '/images/singer/s1.png',
      cover: row?.cover || '/images/singer/cover/s1.png',
      gender: row?.gender ?? 0,
      region: row?.region || '',
      birthday: row?.birthday || null,
      intro: row?.intro || ''
    })
  } else if (type === 'album') {
    Object.assign(form, {
      id: row?.id,
      name: row?.name || '',
      singerId: row?.singerId || null,
      cover: row?.cover || '/images/album/a1.png',
      publishDate: row?.publishDate || null,
      company: row?.company || '',
      intro: row?.intro || ''
    })
    loadOptions()
  } else if (type === 'playlist') {
    Object.assign(form, {
      id: row?.id,
      name: row?.name || '',
      cover: row?.cover || '/images/playlist/p6.png',
      intro: row?.intro || '',
      category: row?.category || '流行',
      isRecommend: row?.isRecommend ?? 0
    })
    loadOptions()
  } else if (type === 'banner') {
    Object.assign(form, {
      id: row?.id,
      title: row?.title || '',
      imageUrl: row?.imageUrl || '/images/banner/b1.png',
      linkType: row?.linkType ?? 1,
      linkId: row?.linkId ?? 1,
      sort: row?.sort ?? 0,
      status: row?.status ?? 1
    })
  }
  dialogVisible.value = true
}

function save() {
  const apiMap = {
    song: adminSaveSong,
    singer: adminSaveSinger,
    album: adminSaveAlbum,
    playlist: adminSavePlaylist,
    banner: adminSaveBanner
  }
  saving.value = true
  apiMap[currentType.value]({ ...form })
    .then(() => {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      load()
      if (currentType.value === 'song' || currentType.value === 'singer' || currentType.value === 'album') {
        loadOptions()
      }
    })
    .finally(() => {
      saving.value = false
    })
}

function remove(type, row) {
  const apiMap = {
    song: adminDeleteSong,
    singer: adminDeleteSinger,
    album: adminDeleteAlbum,
    playlist: adminDeletePlaylist,
    banner: adminDeleteBanner
  }
  ElMessageBox.confirm(`确定删除「${row.name || row.title}」吗？`, '提示', { type: 'warning' })
    .then(() => {
      apiMap[type](row.id).then(() => {
        ElMessage.success('删除成功')
        load()
        loadStats()
      })
    })
    .catch(() => {})
}

function updateUser(row, field) {
  adminUpdateUser(row.id, row.role, row.status)
    .then(() => ElMessage.success('已更新'))
    .catch(() => load())
}

onMounted(() => {
  loadStats()
  loadOptions()
})
</script>

<template>
  <div class="page admin-page">
    <div class="admin-layout">
      <aside class="admin-menu card">
        <div class="admin-brand">
          <span class="brand-dot"></span>
          管理后台
        </div>
        <div
          v-for="item in [
            { key: 'dashboard', label: '数据看板', icon: 'DataLine' },
            { key: 'song', label: '歌曲管理', icon: 'Headset' },
            { key: 'singer', label: '歌手管理', icon: 'Microphone' },
            { key: 'album', label: '专辑管理', icon: 'Notebook' },
            { key: 'playlist', label: '歌单管理', icon: 'Files' },
            { key: 'banner', label: '轮播图管理', icon: 'Picture' },
            { key: 'user', label: '用户管理', icon: 'User' }
          ]"
          :key="item.key"
          class="menu-item"
          :class="{ active: activeTab === item.key }"
          @click="changeTab(item.key)"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </div>
      </aside>

      <section class="admin-content">
        <!-- 看板 -->
        <template v-if="activeTab === 'dashboard'">
          <h2 class="content-title">数据看板</h2>
          <div class="stats-grid">
            <div v-for="item in [
              { key: 'userCount', label: '用户总数', icon: 'User', color: '#ec4141' },
              { key: 'songCount', label: '歌曲总数', icon: 'Headset', color: '#ff9f43' },
              { key: 'singerCount', label: '歌手总数', icon: 'Microphone', color: '#5b8ff9' },
              { key: 'albumCount', label: '专辑总数', icon: 'Notebook', color: '#20c997' },
              { key: 'playlistCount', label: '歌单总数', icon: 'Files', color: '#9b59b6' },
              { key: 'commentCount', label: '评论总数', icon: 'ChatDotRound', color: '#16a085' },
              { key: 'playCount', label: '累计播放', icon: 'VideoPlay', color: '#e17055' },
              { key: 'todayUserCount', label: '今日注册', icon: 'Calendar', color: '#0984e3' }
            ]" :key="item.key" class="stat-card card">
              <div class="stat-icon" :style="{ background: item.color + '1a', color: item.color }">
                <el-icon :size="22"><component :is="item.icon" /></el-icon>
              </div>
              <div>
                <div class="stat-value num">{{ item.key === 'playCount' ? formatCount(stats[item.key]) : stats[item.key] ?? 0 }}</div>
                <div class="stat-label">{{ item.label }}</div>
              </div>
            </div>
          </div>
          <div class="card welcome">
            <h3>欢迎回来，管理员</h3>
            <p class="text-light">
              这里是云音乐管理后台，你可以维护歌曲、歌手、专辑、歌单和首页轮播图，也可以管理注册用户。
              所有修改会立即在前台生效。
            </p>
          </div>
        </template>

        <!-- 其它管理页 -->
        <template v-else>
          <div class="content-head">
            <h2 class="content-title">{{ tabTitle }}</h2>
            <div class="head-actions">
              <el-input
                v-model="keyword"
                placeholder="输入关键词搜索"
                clearable
                style="width: 200px"
                @keyup.enter="loadCurrent"
                @clear="loadCurrent"
              />
              <el-select v-if="activeTab === 'song'" v-model="songStatus" style="width: 120px" @change="loadCurrent">
                <el-option label="全部状态" :value="-1" />
                <el-option label="已上架" :value="1" />
                <el-option label="已下架" :value="0" />
              </el-select>
              <el-button @click="loadCurrent">查询</el-button>
              <el-button
                v-if="activeTab !== 'user'"
                type="primary"
                @click="openDialog(activeTab === 'banner' ? 'banner' : activeTab)"
              >
                <el-icon class="mr4"><Plus /></el-icon>
                新增{{ tabTitle.replace('管理', '') }}
              </el-button>
            </div>
          </div>

          <div class="card table-card" v-loading="loading">
            <!-- 歌曲 -->
            <el-table v-if="activeTab === 'song'" :data="songs" stripe>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="name" label="歌曲" min-width="160">
                <template #default="{ row }">
                  <div class="cell-song">
                    <img :src="row.cover" class="cell-cover" />
                    <span class="text-ellipsis">{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="singerName" label="歌手" width="110" />
              <el-table-column prop="albumName" label="专辑" width="130" />
              <el-table-column label="时长" width="80">
                <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
              </el-table-column>
              <el-table-column label="播放" width="90">
                <template #default="{ row }">{{ formatCount(row.playCount) }}</template>
              </el-table-column>
              <el-table-column label="推荐" width="70">
                <template #default="{ row }">
                  <el-tag v-if="row.isRecommend === 1" size="small" type="danger">推荐</el-tag>
                  <span v-else class="text-light">-</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">
                    {{ row.status === 1 ? '上架' : '下架' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="{ row }">
                  <el-button text size="small" @click="openDialog('song', row)">编辑</el-button>
                  <el-button text size="small" type="danger" @click="remove('song', row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 歌手 -->
            <el-table v-else-if="activeTab === 'singer'" :data="singers" stripe>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column label="歌手" min-width="180">
                <template #default="{ row }">
                  <div class="cell-song">
                    <img :src="row.avatar" class="cell-avatar" />
                    <div>
                      <div>{{ row.name }}</div>
                      <div class="text-light cell-sub">{{ row.region }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="songCount" label="歌曲数" width="90" />
              <el-table-column prop="albumCount" label="专辑数" width="90" />
              <el-table-column label="关注数" width="100">
                <template #default="{ row }">{{ formatCount(row.followCount) }}</template>
              </el-table-column>
              <el-table-column prop="intro" label="简介" min-width="200" show-overflow-tooltip />
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="{ row }">
                  <el-button text size="small" @click="openDialog('singer', row)">编辑</el-button>
                  <el-button text size="small" type="danger" @click="remove('singer', row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 专辑 -->
            <el-table v-else-if="activeTab === 'album'" :data="albums" stripe>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column label="专辑" min-width="180">
                <template #default="{ row }">
                  <div class="cell-song">
                    <img :src="row.cover" class="cell-cover" />
                    <span>{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="singerName" label="歌手" width="120" />
              <el-table-column prop="publishDate" label="发行日期" width="120" />
              <el-table-column prop="songCount" label="歌曲数" width="90" />
              <el-table-column prop="company" label="发行公司" min-width="150" show-overflow-tooltip />
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="{ row }">
                  <el-button text size="small" @click="openDialog('album', row)">编辑</el-button>
                  <el-button text size="small" type="danger" @click="remove('album', row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 歌单 -->
            <el-table v-else-if="activeTab === 'playlist'" :data="playlists" stripe>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column label="歌单" min-width="200">
                <template #default="{ row }">
                  <div class="cell-song">
                    <img :src="row.cover" class="cell-cover" />
                    <span>{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="creatorName" label="创建者" width="120" />
              <el-table-column prop="category" label="分类" width="100" />
              <el-table-column prop="songCount" label="歌曲数" width="90" />
              <el-table-column label="播放" width="90">
                <template #default="{ row }">{{ formatCount(row.playCount) }}</template>
              </el-table-column>
              <el-table-column label="推荐" width="70">
                <template #default="{ row }">
                  <el-tag v-if="row.isRecommend === 1" size="small" type="danger">推荐</el-tag>
                  <span v-else class="text-light">-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="{ row }">
                  <el-button text size="small" @click="openDialog('playlist', row)">编辑</el-button>
                  <el-button text size="small" type="danger" @click="remove('playlist', row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 轮播图 -->
            <el-table v-else-if="activeTab === 'banner'" :data="banners" stripe>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column label="图片" width="180">
                <template #default="{ row }">
                  <img :src="row.imageUrl" class="cell-banner" />
                </template>
              </el-table-column>
              <el-table-column prop="title" label="标题" min-width="160" />
              <el-table-column label="跳转" width="160">
                <template #default="{ row }">
                  {{ { 1: '歌单', 2: '歌手', 3: '歌曲' }[row.linkType] || '无' }} #{{ row.linkId }}
                </template>
              </el-table-column>
              <el-table-column prop="sort" label="排序" width="80" />
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">
                    {{ row.status === 1 ? '显示' : '隐藏' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="130" fixed="right">
                <template #default="{ row }">
                  <el-button text size="small" @click="openDialog('banner', row)">编辑</el-button>
                  <el-button text size="small" type="danger" @click="remove('banner', row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 用户 -->
            <el-table v-else-if="activeTab === 'user'" :data="users" stripe>
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column label="用户" min-width="180">
                <template #default="{ row }">
                  <div class="cell-song">
                    <el-avatar :size="32" :src="row.avatar" />
                    <div>
                      <div>{{ row.nickname }}</div>
                      <div class="text-light cell-sub">@{{ row.username }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="注册时间" width="170" />
              <el-table-column label="角色" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.role" size="small" @change="updateUser(row)">
                    <el-option label="普通用户" :value="0" />
                    <el-option label="管理员" :value="1" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.status" size="small" @change="updateUser(row)">
                    <el-option label="正常" :value="1" />
                    <el-option label="禁用" :value="0" />
                  </el-select>
                </template>
              </el-table-column>
            </el-table>

            <div v-if="activeTab !== 'banner'" class="table-pagination">
              <el-pagination
                v-model:current-page="page"
                :page-size="size"
                :total="total"
                layout="total, prev, pager, next"
                background
                @current-change="load"
              />
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <!-- 歌曲 -->
      <el-form v-if="currentType === 'song'" label-width="90px">
        <el-form-item label="歌曲名称">
          <el-input v-model="form.name" maxlength="100" />
        </el-form-item>
        <el-form-item label="歌手">
          <el-select v-model="form.singerId" filterable style="width: 100%">
            <el-option v-for="item in singerOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="专辑">
          <el-select v-model="form.albumId" filterable clearable style="width: 100%">
            <el-option v-for="item in albumOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.categoryId" clearable style="width: 100%">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input v-model="form.cover" />
        </el-form-item>
        <el-form-item label="音频地址">
          <el-input v-model="form.audioUrl" />
        </el-form-item>
        <el-form-item label="时长(秒)">
          <el-input-number v-model="form.duration" :min="0" :max="10000" />
        </el-form-item>
        <el-form-item label="歌词">
          <el-input v-model="form.lyric" type="textarea" :rows="3" placeholder="[00:01.00]歌词内容" />
        </el-form-item>
        <el-form-item label="是否推荐">
          <el-switch v-model="form.isRecommend" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <!-- 歌手 -->
      <el-form v-else-if="currentType === 'singer'" label-width="90px">
        <el-form-item label="歌手名称">
          <el-input v-model="form.name" maxlength="50" />
        </el-form-item>
        <el-form-item label="头像地址">
          <el-input v-model="form.avatar" />
        </el-form-item>
        <el-form-item label="大图地址">
          <el-input v-model="form.cover" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.gender">
            <el-radio :value="0">组合</el-radio>
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="地区">
          <el-input v-model="form.region" placeholder="如：华语" />
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" maxlength="500" />
        </el-form-item>
      </el-form>

      <!-- 专辑 -->
      <el-form v-else-if="currentType === 'album'" label-width="90px">
        <el-form-item label="专辑名称">
          <el-input v-model="form.name" maxlength="100" />
        </el-form-item>
        <el-form-item label="歌手">
          <el-select v-model="form.singerId" filterable style="width: 100%">
            <el-option v-for="item in singerOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input v-model="form.cover" />
        </el-form-item>
        <el-form-item label="发行日期">
          <el-date-picker v-model="form.publishDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="发行公司">
          <el-input v-model="form.company" maxlength="100" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" maxlength="500" />
        </el-form-item>
      </el-form>

      <!-- 歌单 -->
      <el-form v-else-if="currentType === 'playlist'" label-width="90px">
        <el-form-item label="歌单名称">
          <el-input v-model="form.name" maxlength="50" />
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input v-model="form.cover" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width: 100%">
            <el-option v-for="item in categories" :key="item.id" :label="item.name" :value="item.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" maxlength="255" />
        </el-form-item>
        <el-form-item label="是否推荐">
          <el-switch v-model="form.isRecommend" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>

      <!-- 轮播图 -->
      <el-form v-else-if="currentType === 'banner'" label-width="90px">
        <el-form-item label="标题">
          <el-input v-model="form.title" maxlength="80" />
        </el-form-item>
        <el-form-item label="图片地址">
          <el-input v-model="form.imageUrl" />
        </el-form-item>
        <el-form-item label="跳转类型">
          <el-select v-model="form.linkType" style="width: 100%">
            <el-option label="歌单" :value="1" />
            <el-option label="歌手" :value="2" />
            <el-option label="歌曲" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转ID">
          <el-input-number v-model="form.linkId" :min="1" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">显示</el-radio>
            <el-radio :value="0">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.admin-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.admin-menu {
  width: 190px;
  padding: 14px 10px;
  flex-shrink: 0;
  position: sticky;
  top: 84px;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 14px;
  font-size: 16px;
  font-weight: 700;
  border-bottom: 1px solid var(--music-border);
  margin-bottom: 10px;
}

.brand-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--music-red-light);
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

.admin-content {
  flex: 1;
  min-width: 0;
}

.content-title {
  margin: 0 0 16px;
  font-size: 22px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  color: var(--music-text-3);
  font-size: 12px;
}

.welcome {
  margin-top: 20px;
  padding: 22px;
}

.welcome h3 {
  margin: 0 0 8px;
}

.welcome p {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
}

.content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mr4 {
  margin-right: 4px;
}

.table-card {
  padding: 8px 12px 16px;
}

.cell-song {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cell-cover {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  object-fit: cover;
}

.cell-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.cell-banner {
  width: 160px;
  height: 54px;
  border-radius: 6px;
  object-fit: cover;
}

.cell-sub {
  font-size: 11px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 14px 6px 4px;
}

@media (max-width: 900px) {
  .admin-layout {
    flex-direction: column;
  }

  .admin-menu {
    position: static;
    display: flex;
    width: 100%;
    overflow-x: auto;
  }

  .admin-brand {
    display: none;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
