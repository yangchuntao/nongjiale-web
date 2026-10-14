<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useConfigStore } from '../stores/config'

const route = useRoute()
const config = useConfigStore()

const intentId = computed(() => (route.query.intentId as string) || '')
const intentNo = computed(() => (route.query.intentNo as string) || '')
const tel = computed(() => (route.query.tel as string) || config.contactPhone)
const displayNo = computed(() => intentNo.value || intentId.value)

onMounted(() => {
  if (!config.loaded) config.load()
})
</script>

<template>
  <section class="card" style="max-width:560px;margin:0 auto;text-align:center">
    <h1 class="page-title">预订意向已提交</h1>
    <p v-if="displayNo"><strong>单号：</strong>{{ displayNo }}</p>
    <p>客服将与您确认档期，意向不等于已锁房。</p>
    <p>
      请联系
      <a :href="`tel:${tel}`">{{ tel }}</a>
    </p>
    <div class="actions" style="justify-content:center">
      <router-link class="btn" to="/">返回首页</router-link>
      <router-link class="btn secondary" to="/me/intents">我的意向</router-link>
    </div>
  </section>
</template>
