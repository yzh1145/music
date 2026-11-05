<template>
  <div class="not-found">
    <div class="code num">404</div>
    <p class="desc">你访问的页面去听歌了，暂时找不到</p>
    <el-button type="primary" round @click="$router.replace('/')">回到首页</el-button>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 60px - var(--player-height));
  color: var(--music-text);
}

.code {
  font-size: 96px;
  font-weight: 800;
  color: var(--music-red-light);
  letter-spacing: 4px;
}

.desc {
  margin: 0 0 24px;
  color: var(--music-text-3);
  font-size: 14px;
}
</style>
