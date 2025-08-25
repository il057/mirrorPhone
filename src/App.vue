<template>
  <main class="phone-screen">
    <router-view />
  </main>
</template>

<script setup>
// 目前不需要任何脚本
</script>

<style>
/* 全局样式 */
@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 我们将一些最基础的样式放在这里，确保应用铺满全屏。
  这些样式会应用到整个应用。
*/
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #000; /* 黑色背景，模拟手机息屏背景 */
  color: #fff;
}

.phone-screen {
  height: 100vh;
  width: 100vw;
  overflow: hidden; /* 防止内容溢出屏幕 */
}
</style>