<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = computed(() => {
  const value = route.params.id
  return typeof value === 'string' ? value : ''
})
const editing = computed(() => id.value.length > 0)
const title = computed(() => (editing.value ? '攻略编辑' : '攻略'))
const pageId = computed(() => (editing.value ? 'A-GUIDE-EDIT' : 'A-GUIDE-LIST'))
const hint = computed(() =>
  editing.value ? '攻略编辑脚手架。' : '攻略列表脚手架。无 id 时仍是列表。',
)
</script>

<template>
  <section class="shell">
    <p class="mark">「脚手架」</p>
    <h1>{{ title }}</h1>
    <p class="page-id">{{ pageId }}</p>
    <p v-if="editing" class="param">路径参数 id：{{ id }}</p>
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
