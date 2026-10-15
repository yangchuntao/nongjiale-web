<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="empty-state">
    <h1>页面不存在</h1>
    <p>没有找到这个地址。</p>
    <RouterLink class="btn btn-primary" to="/">回首页</RouterLink>
  </section>
</template>
