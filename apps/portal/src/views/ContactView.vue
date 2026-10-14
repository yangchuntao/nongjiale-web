<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'
import { useConfigStore } from '../stores/config'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const config = useConfigStore()
const id = computed(() => Number(route.params.id))
const content = ref('')
const contactName = ref(auth.user?.displayName || '')
const contactPhone = ref(auth.user?.phone || '')
const error = ref('')
const done = ref(false)
const resultTel = ref('')
const submitting = ref(false)

async function submit() {
  if (!auth.token) return
  error.value = ''
  submitting.value = true
  try {
    const res = await api.createContactMessage(auth.token, {
      homestayId: id.value,
      content: content.value.trim(),
      contactName: contactName.value.trim(),
      contactPhone: contactPhone.value.trim(),
    })
    resultTel.value = res.contactPhone || config.contactPhone
    done.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : '提交失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="card" style="max-width:520px;margin:0 auto">
    <h1 class="page-title">咨询留言</h1>
    <div v-if="done">
      <p>留言已提交，客服会尽快联系你。</p>
      <p><strong>客服电话：</strong><a :href="`tel:${resultTel}`">{{ resultTel }}</a></p>
      <button class="btn" type="button" @click="router.push(`/homestays/${id}`)">返回详情</button>
    </div>
    <form v-else @submit.prevent="submit">
      <div class="field">
        <label>留言内容</label>
        <textarea v-model="content" rows="4" required />
      </div>
      <div class="field">
        <label>联系人</label>
        <input v-model="contactName" required />
      </div>
      <div class="field">
        <label>联系电话</label>
        <input v-model="contactPhone" required />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn block" type="submit" :disabled="submitting">提交留言</button>
    </form>
  </section>
</template>
