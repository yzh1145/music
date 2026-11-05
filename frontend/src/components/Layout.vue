<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import LoginDialog from './LoginDialog.vue'
import PlayerBar from './PlayerBar.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const keyword = ref(route.query.keyword || '')
// 初始值由 index.html 中的内联脚本决定，这里只负责切换与记忆
const isDark = ref(document.documentElement.classList.contains('dark'))

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('music_theme', isDark.value ? 'dark' : 'light')
}

function onSearch() {
  const value = keyword.value.trim()
  if (!value) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  router.push({ name: 'search', query: { keyword: value } })
}

function onCommand(command) {
  if (command === 'my') router.push('/my')
  if (command === 'admin') router.push('/admin')
  if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/')
  }
}

function handleUnauthorized() {
  userStore.logout()
  ElMessage.warning('登录状态已失效，请重新登录')
  userStore.openLogin()
}

onMounted(() => {
  window.addEventListener('music:unauthorized', handleUnauthorized)
})

onBeforeUnmount(() => {
  window.removeEventListener('music:unauthorized', handleUnauthorized)
})
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="header-inner">
        <router-link to="/" class="logo">
          <svg class="logo-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#fff" />
            <circle cx="10.6" cy="15.6" r="2.7" fill="currentColor" />
            <path
              d="M13.3 15.4V5.6c.9 1.8 3 2.4 4 4.2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="logo-text">云音乐</span>
        </router-link>

        <nav class="nav">
          <router-link to="/" class="nav-item" :class="{ active: route.name === 'home' }">发现音乐</router-link>
          <router-link to="/playlists" class="nav-item" :class="{ active: route.name === 'playlists' }">歌单广场</router-link>
          <router-link to="/my" class="nav-item" :class="{ active: route.name === 'my' }">我的音乐</router-link>
          <router-link v-if="userStore.isAdmin" to="/admin" class="nav-item" :class="{ active: route.name === 'admin' }">
            后台管理
          </router-link>
        </nav>

        <div class="search">
          <el-input
            v-model="keyword"
            placeholder="搜索歌曲、歌手、歌单"
            clearable
            @keyup.enter="onSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="user">
          <el-tooltip :content="isDark ? '切换到浅色模式' : '切换到深色模式'" placement="bottom">
            <el-button text circle class="theme-btn" @click="toggleTheme">
              <el-icon :size="18"><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
            </el-button>
          </el-tooltip>
          <template v-if="userStore.isLogin">
            <el-dropdown trigger="click" @command="onCommand">
              <div class="user-info">
                <el-avatar :size="32" :src="userStore.avatar" />
                <span class="user-name text-ellipsis">{{ userStore.nickname }}</span>
                <el-icon><ArrowDown /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="my">我的音乐</el-dropdown-item>
                  <el-dropdown-item v-if="userStore.isAdmin" command="admin">后台管理</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button text class="login-btn" @click="userStore.openLogin('login')">登录</el-button>
            <el-button type="primary" round size="small" @click="userStore.openLogin('register')">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </main>

    <PlayerBar />
    <LoginDialog />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--music-header-bg);
  box-shadow: var(--music-header-shadow);
}

.header-inner {
  display: flex;
  align-items: center;
  gap: 28px;
  max-width: 1120px;
  height: 60px;
  margin: 0 auto;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-weight: 700;
  font-size: 19px;
  letter-spacing: 1px;
}

.logo-icon {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  color: var(--music-red);
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-item {
  position: relative;
  padding: 8px 14px;
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}

.nav-item.active {
  color: var(--music-nav-active-text);
  background: var(--music-nav-active-bg);
  font-weight: 600;
}

.search {
  flex: 1;
  max-width: 300px;
  margin-left: auto;
}

.search :deep(.el-input__wrapper) {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  box-shadow: none;
}

.search :deep(.el-input__inner) {
  color: #fff;
}

.search :deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.7);
}

.search :deep(.el-input__prefix) {
  color: rgba(255, 255, 255, 0.85);
}

.user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-btn,
.theme-btn {
  --el-button-text-color: rgba(255, 255, 255, 0.9);
  --el-button-hover-text-color: #fff;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.12);
  --el-fill-color-light: rgba(255, 255, 255, 0.12);
  --el-fill-color: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.9);
}

.theme-btn {
  margin-right: 4px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px 4px 4px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  cursor: pointer;
}

.user-name {
  max-width: 88px;
  font-size: 13px;
}

.main {
  min-height: calc(100vh - 60px);
}

@media (max-width: 900px) {
  .header-inner {
    gap: 16px;
  }

  .nav-item {
    padding: 8px 10px;
  }
}

/* 窄屏：导航换到第二行并可横向滚动，搜索框占满剩余宽度 */
@media (max-width: 768px) {
  .header-inner {
    flex-wrap: wrap;
    height: auto;
    gap: 8px 10px;
    padding: 10px 12px 6px;
  }

  .logo-text,
  .user-name {
    display: none;
  }

  .search {
    flex: 1;
    min-width: 0;
    max-width: none;
    margin-left: 0;
  }

  .nav {
    order: 3;
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nav-item {
    flex-shrink: 0;
    padding: 5px 12px;
    font-size: 13px;
  }

  .user {
    gap: 2px;
  }
}
</style>
