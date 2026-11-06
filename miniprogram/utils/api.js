/**
 * 全部后端接口，与 frontend/src/api/index.js 一一对应。
 * 路径都不带 /api 前缀，由 utils/request.js 统一补全。
 */
const { request } = require('./request')

/* ==================== 认证 ==================== */
const login = (data) => request({ url: '/auth/login', method: 'POST', data })
const register = (data) => request({ url: '/auth/register', method: 'POST', data })

/* ==================== 首页 / 搜索 ==================== */
const getHome = () => request({ url: '/home' })
const search = (keyword, limit) =>
  request({ url: '/search', params: { keyword, limit: limit || 20 } })

/* ==================== 歌曲 ==================== */
const getSongPage = (params) => request({ url: '/song/page', params })
const getSong = (id) => request({ url: '/song/' + id })
const playSong = (id) => request({ url: '/song/' + id + '/play', method: 'POST', silent: true })
const likeSong = (id) => request({ url: '/song/' + id + '/like', method: 'POST' })

/* ==================== 歌手 / 专辑 ==================== */
const getSingerPage = (params) => request({ url: '/singer/page', params })
const getSinger = (id) => request({ url: '/singer/' + id })
const followSinger = (id) => request({ url: '/singer/' + id + '/follow', method: 'POST' })
const getAlbumPage = (params) => request({ url: '/album/page', params })
const getAlbum = (id) => request({ url: '/album/' + id })

/* ==================== 歌单 ==================== */
const getPlaylistPage = (params) => request({ url: '/playlist/page', params })
const getPlaylist = (id) => request({ url: '/playlist/' + id })
const getMyPlaylists = () => request({ url: '/playlist/mine' })
const getCollectedPlaylists = () => request({ url: '/playlist/collected' })
const createPlaylist = (data) => request({ url: '/playlist', method: 'POST', data })
const updatePlaylist = (id, data) => request({ url: '/playlist/' + id, method: 'PUT', data })
const deletePlaylist = (id) => request({ url: '/playlist/' + id, method: 'DELETE' })
const addSongToPlaylist = (id, songId) =>
  request({ url: '/playlist/' + id + '/song/' + songId, method: 'POST' })
const removeSongFromPlaylist = (id, songId) =>
  request({ url: '/playlist/' + id + '/song/' + songId, method: 'DELETE' })
const collectPlaylist = (id) => request({ url: '/playlist/' + id + '/collect', method: 'POST' })
const playPlaylist = (id) => request({ url: '/playlist/' + id + '/play', method: 'POST', silent: true })

/* ==================== 评论 ==================== */
const getComments = (params) => request({ url: '/comment/page', params })
const addComment = (data) => request({ url: '/comment', method: 'POST', data })
const likeComment = (id) => request({ url: '/comment/' + id + '/like', method: 'POST' })
const deleteComment = (id) => request({ url: '/comment/' + id, method: 'DELETE' })

/* ==================== 播放历史 ==================== */
const recordHistory = (songId) =>
  request({ url: '/history', method: 'POST', params: { songId }, silent: true })
const getHistory = (limit) => request({ url: '/history', params: { limit: limit || 100 } })
const clearHistory = () => request({ url: '/history', method: 'DELETE' })
const removeHistory = (songId) => request({ url: '/history/' + songId, method: 'DELETE' })

/* ==================== 用户中心 ==================== */
const getProfile = () => request({ url: '/user/profile' })
const updateProfile = (data) => request({ url: '/user/profile', method: 'PUT', data })
const changePassword = (data) => request({ url: '/user/password', method: 'PUT', data })
const getLikeSongs = () => request({ url: '/user/like/song' })
const getCollectPlaylists = () => request({ url: '/user/collect/playlist' })
const getFollowSingers = () => request({ url: '/user/follow/singer' })

/* ==================== 分类 ==================== */
const getCategories = () => request({ url: '/category/list' })

/* ==================== 后台（管理员） ==================== */
const adminStats = () => request({ url: '/admin/stats' })
const adminSongs = (params) => request({ url: '/admin/song/page', params })
const adminSaveSong = (data) => request({ url: '/admin/song', method: 'POST', data })
const adminDeleteSong = (id) => request({ url: '/admin/song/' + id, method: 'DELETE' })
const adminUsers = (params) => request({ url: '/admin/user/page', params })
const adminUpdateUser = (id, role, status) =>
  request({ url: '/admin/user/' + id, method: 'PUT', params: { role, status } })
const adminBanners = () => request({ url: '/admin/banner/list' })

module.exports = {
  login,
  register,
  getHome,
  search,
  getSongPage,
  getSong,
  playSong,
  likeSong,
  getSingerPage,
  getSinger,
  followSinger,
  getAlbumPage,
  getAlbum,
  getPlaylistPage,
  getPlaylist,
  getMyPlaylists,
  getCollectedPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  collectPlaylist,
  playPlaylist,
  getComments,
  addComment,
  likeComment,
  deleteComment,
  recordHistory,
  getHistory,
  clearHistory,
  removeHistory,
  getProfile,
  updateProfile,
  changePassword,
  getLikeSongs,
  getCollectPlaylists,
  getFollowSingers,
  getCategories,
  adminStats,
  adminSongs,
  adminSaveSong,
  adminDeleteSong,
  adminUsers,
  adminUpdateUser,
  adminBanners
}
