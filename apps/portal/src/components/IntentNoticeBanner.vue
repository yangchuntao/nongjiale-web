<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ text: string; collapsible?: boolean; startCollapsed?: boolean }>(), {
  collapsible: false,
  startCollapsed: false,
})

const collapsed = ref(props.collapsible && props.startCollapsed)
</script>

<template>
  <aside class="intent-banner" role="note">
    <p v-show="!collapsed">{{ text }}</p>
    <button v-if="collapsible" type="button" @click="collapsed = !collapsed">
      {{ collapsed ? '展开说明' : '收起说明' }}
    </button>
  </aside>
</template>
