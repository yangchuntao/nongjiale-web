<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '../stores/config'

const route = useRoute()
const config = useConfigStore()

const intentId = computed(() => (route.query.intentId as string) || '')
const intentNo = computed(() => (route.query.intentNo as string) || '')
const tel = computed(() => (route.query.tel as string) || config.contactPhone)

onMounted(() => {
  if (!config.loaded) config.load()
})
</script>

<template>
  <section class="card" style="max-width:520px;margin:0 auto;text-align:center">
    <h1 class="page-title">意向已提交</h1>
    <p class="muted">客服将电话确认，无需在线支付。</p>
    <p v-if="intentId"><strong>意向 ID：</strong>{{ intentId }}</p>
    <p v-if="intentNo"><strong>意向编号：</strong>{{ intentNo }}</p>
    <p>
      <strong>客服电话：</strong>
      <a :href="`tel:${tel}`">{{ tel }}</a>
    </p>
    <div class="actions" style="justify-content:center">
      <router-link class="btn" to="/">回首页</router-link>
      <router-link class="btn secondary" to="/search">继续浏览</router-link>
    </div>
  </section>
</template>
