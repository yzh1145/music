import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/Home.vue'), meta: { title: '发现音乐' } },
  { path: '/playlist/:id', name: 'playlist', component: () => import('../views/PlaylistDetail.vue'), meta: { title: '歌单详情' } },
  { path: '/song/:id', name: 'song', component: () => import('../views/SongDetail.vue'), meta: { title: '歌曲详情' } },
  { path: '/singer/:id', name: 'singer', component: () => import('../views/SingerDetail.vue'), meta: { title: '歌手' } },
  { path: '/album/:id', name: 'album', component: () => import('../views/AlbumDetail.vue'), meta: { title: '专辑' } },
  { path: '/playlists', name: 'playlists', component: () => import('../views/PlaylistSquare.vue'), meta: { title: '歌单广场' } },
  { path: '/search', name: 'search', component: () => import('../views/Search.vue'), meta: { title: '搜索' } },
  { path: '/my', name: 'my', component: () => import('../views/MyMusic.vue'), meta: { title: '我的音乐', requiresAuth: true } },
  { path: '/admin', name: 'admin', component: () => import('../views/Admin.vue'), meta: { title: '后台管理', requiresAuth: true, requiresAdmin: true } },
  { path: '/:pathMatch(.*)*', name: 'notFound', component: () => import('../views/NotFound.vue'), meta: { title: '页面不存在' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  document.title = `${to.meta.title || '云音乐'} - 云音乐`
  if (to.meta.requiresAuth && !userStore.token) {
    ElMessage.warning('请先登录')
    userStore.openLogin()
    return { name: 'home' }
  }
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    ElMessage.error('只有管理员可以访问后台')
    return { name: 'home' }
  }
  return true
})

export default router
