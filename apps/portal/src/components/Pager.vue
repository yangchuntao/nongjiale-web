<script setup lang="ts">
import { computed } from 'vue'
import { pageCount, pageList } from '../domain/pager'

const props = defineProps<{ page: number; pageSize: number; total: number }>()
const emit = defineEmits<{ change: [page: number] }>()

const count = computed(() => pageCount(props.total, props.pageSize))
const items = computed(() => pageList(props.page, count.value))
</script>

<template>
  <nav v-if="total > pageSize" class="pager" aria-label="分页">
    <button type="button" :disabled="page <= 1" @click="emit('change', page - 1)">上一页</button>
    <button
      v-for="item in items"
      :key="item"
      type="button"
      :class="{ current: item === page }"
      :aria-current="item === page ? 'page' : undefined"
      @click="emit('change', item)"
    >
      {{ item }}
    </button>
    <button type="button" :disabled="page >= count" @click="emit('change', page + 1)">下一页</button>
  </nav>
</template>
