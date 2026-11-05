<script setup>
import { onMounted } from 'vue'
import Layout from './components/Layout.vue'
import { useUserStore } from './stores/user'

const userStore = useUserStore()

// 刷新页面后若本地还有 token，则拉取一次用户信息
onMounted(() => {
  if (userStore.token) {
    userStore.fetchProfile().catch(() => userStore.logout())
  }
})
</script>

<template>
  <Layout />
</template>
