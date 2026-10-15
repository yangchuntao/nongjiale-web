<script setup lang="ts">
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
</script>

<template>
  <main class="home">
    <p class="eyebrow">MVP-0</p>
    <h1>{{ appStore.title }}</h1>
    <p>农家乐垂直平台前端空仓。此页仅为占位，业务页面尚未开始。</p>
    <p class="en">
      Empty frontend skeleton for the rural farmstay marketplace. This page is a placeholder only.
    </p>
  </main>
</template>

<style scoped>
.home {
  box-sizing: border-box;
  min-height: 100svh;
  max-width: 40rem;
  margin: 0 auto;
  padding: 32px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--muted);
}

h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

p {
  margin: 0;
  line-height: 1.6;
  color: var(--muted);
}
</style>
