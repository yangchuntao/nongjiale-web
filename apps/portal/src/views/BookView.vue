<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { HomestayDetail } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = computed(() => Number(route.params.id))
const detail = ref<HomestayDetail | null>(null)
const checkIn = ref('')
const checkOut = ref('')
const guests = ref(2)
const travelMode = ref('自驾')
const contactName = ref(auth.user?.displayName || '')
const contactPhone = ref(auth.user?.phone || '')
const error = ref('')
const submitting = ref(false)

onMounted(async () => {
  try {
    detail.value = await api.fetchHomestay(id.value)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 3)
    checkIn.value = tomorrow.toISOString().slice(0, 10)
    checkOut.value = dayAfter.toISOString().slice(0, 10)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  }
})

function idemKey() {
  return `${auth.user?.userId || 'u'}:${id.value}:${checkIn.value}:${Date.now()}`
}

async function submit() {
  if (!auth.token) return
  error.value = ''
  submitting.value = true
  try {
    const result = await api.createBookingIntent(
      auth.token,
      {
        homestayId: id.value,
        checkIn: checkIn.value,
        checkOut: checkOut.value,
        guests: Number(guests.value),
        travelMode: travelMode.value || undefined,
        contactName: contactName.value.trim(),
        contactPhone: contactPhone.value.trim(),
      },
      idemKey(),
    )
    router.replace({
      name: 'booking-success',
      query: {
        intentId: String(result.intentId),
        intentNo: result.intentNo,
        tel: result.contactPhone,
      },
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : '提交失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="card" style="max-width:520px;margin:0 auto">
    <h1 class="page-title">提交预订意向</h1>
    <p v-if="detail" class="muted">{{ detail.name }} · ¥{{ detail.priceFrom }} 起</p>
    <form @submit.prevent="submit">
      <div class="field">
        <label>入住日期</label>
        <input v-model="checkIn" type="date" required />
      </div>
      <div class="field">
        <label>离店日期</label>
        <input v-model="checkOut" type="date" required />
      </div>
      <div class="field">
        <label>人数</label>
        <input v-model.number="guests" type="number" min="1" required />
      </div>
      <div class="field">
        <label>出行方式</label>
        <select v-model="travelMode">
          <option>自驾</option>
          <option>高铁</option>
          <option>大巴</option>
          <option>其他</option>
        </select>
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
      <button class="btn block" type="submit" :disabled="submitting">提交意向</button>
    </form>
  </section>
</template>
