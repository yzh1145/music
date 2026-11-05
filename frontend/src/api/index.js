import axios from 'axios'
import { ElMessage } from 'element-plus'

/**
 * 统一 axios 实例：baseURL 走 Vite 代理，请求头自动携带 JWT。
 * 后端统一返回 { code, message, data }，这里直接解包出 data。
 */
const http = axios.create({
  baseURL: '/api',
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('music_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 200) return body.data
      if (body.code === 401) {
        localStorage.removeItem('music_token')
        localStorage.removeItem('music_user')
        window.dispatchEvent(new CustomEvent('music:unauthorized'))
      }
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return body
  },
  (error) => {
    const message = error.response?.data?.message || error.message || '网络异常，请稍后再试'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

/* ==================== 认证 ==================== */
export const login = (data) => http.post('/auth/login', data)
export const register = (data) => http.post('/auth/register', data)

/* ==================== 首页 / 搜索 ==================== */
export const getHome = () => http.get('/home')
export const search = (keyword, limit = 20) => http.get('/search', { params: { keyword, limit } })

/* ==================== 歌曲 ==================== */
export const getSongPage = (params) => http.get('/song/page', { params })
export const getSong = (id) => http.get(`/song/${id}`)
export const playSong = (id) => http.post(`/song/${id}/play`)
export const likeSong = (id) => http.post(`/song/${id}/like`)

/* ==================== 歌手 / 专辑 ==================== */
export const getSingerPage = (params) => http.get('/singer/page', { params })
export const getSinger = (id) => http.get(`/singer/${id}`)
export const followSinger = (id) => http.post(`/singer/${id}/follow`)
export const getAlbumPage = (params) => http.get('/album/page', { params })
export const getAlbum = (id) => http.get(`/album/${id}`)

/* ==================== 歌单 ==================== */
export const getPlaylistPage = (params) => http.get('/playlist/page', { params })
export const getPlaylist = (id) => http.get(`/playlist/${id}`)
export const getMyPlaylists = () => http.get('/playlist/mine')
export const getCollectedPlaylists = () => http.get('/playlist/collected')
export const createPlaylist = (data) => http.post('/playlist', data)
export const updatePlaylist = (id, data) => http.put(`/playlist/${id}`, data)
export const deletePlaylist = (id) => http.delete(`/playlist/${id}`)
export const addSongToPlaylist = (id, songId) => http.post(`/playlist/${id}/song/${songId}`)
export const removeSongFromPlaylist = (id, songId) => http.delete(`/playlist/${id}/song/${songId}`)
export const collectPlaylist = (id) => http.post(`/playlist/${id}/collect`)
export const playPlaylist = (id) => http.post(`/playlist/${id}/play`)

/* ==================== 评论 ==================== */
export const getComments = (params) => http.get('/comment/page', { params })
export const addComment = (data) => http.post('/comment', data)
export const likeComment = (id) => http.post(`/comment/${id}/like`)
export const deleteComment = (id) => http.delete(`/comment/${id}`)

/* ==================== 播放历史 ==================== */
export const recordHistory = (songId) => http.post('/history', null, { params: { songId } })
export const getHistory = (limit = 100) => http.get('/history', { params: { limit } })
export const clearHistory = () => http.delete('/history')

/* ==================== 用户中心 ==================== */
export const getProfile = () => http.get('/user/profile')
export const updateProfile = (data) => http.put('/user/profile', data)
export const changePassword = (data) => http.put('/user/password', data)
export const getLikeSongs = () => http.get('/user/like/song')
export const getCollectPlaylists = () => http.get('/user/collect/playlist')
export const getFollowSingers = () => http.get('/user/follow/singer')

/* ==================== 分类 ==================== */
export const getCategories = () => http.get('/category/list')

/* ==================== 后台 ==================== */
export const adminStats = () => http.get('/admin/stats')
export const adminSongs = (params) => http.get('/admin/song/page', { params })
export const adminSaveSong = (data) => http.post('/admin/song', data)
export const adminDeleteSong = (id) => http.delete(`/admin/song/${id}`)
export const adminSingers = (params) => http.get('/admin/singer/page', { params })
export const adminSaveSinger = (data) => http.post('/admin/singer', data)
export const adminDeleteSinger = (id) => http.delete(`/admin/singer/${id}`)
export const adminAlbums = (params) => http.get('/admin/album/page', { params })
export const adminSaveAlbum = (data) => http.post('/admin/album', data)
export const adminDeleteAlbum = (id) => http.delete(`/admin/album/${id}`)
export const adminPlaylists = (params) => http.get('/admin/playlist/page', { params })
export const adminSavePlaylist = (data) => http.post('/admin/playlist', data)
export const adminDeletePlaylist = (id) => http.delete(`/admin/playlist/${id}`)
export const adminBanners = () => http.get('/admin/banner/list')
export const adminSaveBanner = (data) => http.post('/admin/banner', data)
export const adminDeleteBanner = (id) => http.delete(`/admin/banner/${id}`)
export const adminUsers = (params) => http.get('/admin/user/page', { params })
export const adminUpdateUser = (id, role, status) =>
  http.put(`/admin/user/${id}`, null, { params: { role, status } })

export default http
