<script setup lang="ts">
import { intentStatusLabel, intentStatusTone } from '../api/readers'

defineProps<{ status: string }>()
</script>

<template>
  <span class="tag" :class="`tag-${intentStatusTone(status)}`">{{ intentStatusLabel(status) }}</span>
</template>
