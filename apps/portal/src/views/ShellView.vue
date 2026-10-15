<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => route.meta.title)
const pageId = computed(() => route.meta.pageId)
const hint = computed(() => route.meta.hint ?? '此页为脚手架占位，未接入业务数据。')
const id = computed(() => {
  const value = route.params.id
  return typeof value === 'string' ? value : ''
})
</script>

<template>
  <section class="shell">
    <p class="mark">「脚手架」</p>
    <h1>{{ title }}</h1>
    <p class="page-id">{{ pageId }}</p>
    <p v-if="id" class="param">路径参数 id：{{ id }}</p>
    <div class="empty">
      <p>暂无业务数据</p>
      <p>{{ hint }}</p>
    </div>
  </section>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.mark {
  margin: 0;
  color: var(--color-brand);
  font-size: var(--font-caption);
  letter-spacing: 0.08em;
}

h1 {
  margin: 0;
  font-size: var(--font-h1);
  font-weight: 600;
}

.page-id,
.param,
.empty p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-body);
  line-height: 1.6;
}

.empty {
  margin-top: var(--space-4);
  padding: var(--space-5);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
}
</style>
