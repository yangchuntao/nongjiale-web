<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GuideEditView from './GuideEditView.vue'
import GuideListView from './GuideListView.vue'

const route = useRoute()
const editing = computed(() => {
  const id = route.params.id
  return typeof id === 'string' && id.length > 0
})
</script>

<template>
  <GuideEditView v-if="editing" />
  <GuideListView v-else />
</template>
