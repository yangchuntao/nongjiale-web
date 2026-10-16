<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { HOME_PATH } from '../router/routes'
</script>

<template>
  <el-empty description="页面不存在">
    <RouterLink :to="HOME_PATH">返回入驻队列</RouterLink>
  </el-empty>
</template>
