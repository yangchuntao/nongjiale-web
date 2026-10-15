<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { describePortalError } from '../api/errors'
import { createIntent, fetchStore } from '../api/portal'
import { canSubmitIntent, priceLabel, type StoreDetail } from '../api/readers'
import IntentNoticeBanner from '../components/IntentNoticeBanner.vue'
import { INTENT_FORM_NOTICE } from '../domain/copy'
import { buildCreateIntentBody, todayIso, type IntentErrors } from '../domain/intent'
import { useAuthStore } from '../stores/auth'
import { useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const store = ref<StoreDetail | null>(null)
const submitError = ref('')
const submitKind = ref('')
const submitting = ref(false)
const errors = reactive<IntentErrors>({})
const form = reactive({
  checkIn: '',
  checkOut: '',
  nights: '',
  guests: '2',
  contactName: '',
  contactPhone: '',
  userRemark: '',
})

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const unavailable = computed(() => errorKind.value === 'gone' || errorKind.value === 'notFound' || (store.value ? !canSubmitIntent(store.value.shelfStatus) : false))

async function loadStore() {
  store.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchStore(id.value, signal))
  if (outcome.status === 'ok') store.value = outcome.data
}

async function onSubmit() {
  submitError.value = ''
  submitKind.value = ''
  const storeId = Number(id.value)
  const result = buildCreateIntentBody(storeId, form, todayIso())
  Object.keys(errors).forEach((key) => delete errors[key as keyof IntentErrors])
  Object.assign(errors, result.errors)
  if (!result.body) {
    const first = (['checkIn', 'checkOut', 'nights', 'guests', 'contactName', 'contactPhone', 'userRemark'] as const).find(
      (key) => errors[key],
    )
    if (first) document.getElementById(`intent-${first}`)?.focus()
    return
  }
  submitting.value = true
  try {
    const created = await createIntent(result.body)
    await router.push(`/intents/${created.id}/success`)
  } catch (cause) {
    const view = describePortalError(cause)
    submitError.value = view.message
    submitKind.value = view.kind
  } finally {
    submitting.value = false
  }
}

watch(id, () => void loadStore(), { immediate: true })

onMounted(async () => {
  if (!auth.phone) await auth.refreshProfile()
  if (!form.contactPhone && auth.phone) form.contactPhone = auth.phone
})
</script>

<template>
  <section class="stack">
    <div class="page-head">
      <h1>提交意向</h1>
      <RouterLink v-if="id" :to="`/listings/${id}`">返回房源</RouterLink>
    </div>
    <IntentNoticeBanner :text="INTENT_FORM_NOTICE" />
    <div v-if="loading" class="skeleton-card" aria-busy="true"></div>
    <div v-else-if="unavailable" class="empty-state">
      <p>{{ error || '该房源当前不可提交意向' }}</p>
      <p>该房源暂不可提交意向</p>
      <RouterLink class="btn btn-secondary" to="/listings">返回列表</RouterLink>
    </div>
    <div v-else-if="error" class="empty-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" type="button" @click="loadStore">加载失败，点击重试</button>
    </div>
    <form v-else-if="store" class="panel stack" novalidate @submit.prevent="onSubmit">
      <p><strong>{{ store.name }}</strong></p>
      <p v-if="priceLabel(store.priceText, store.priceFrom)" class="muted">
        {{ priceLabel(store.priceText, store.priceFrom) }}
      </p>
      <label class="field">
        <span>到店日 *</span>
        <input id="intent-checkIn" v-model="form.checkIn" type="date" required />
        <small v-if="errors.checkIn">{{ errors.checkIn }}</small>
      </label>
      <label class="field">
        <span>离店日</span>
        <input id="intent-checkOut" v-model="form.checkOut" type="date" />
        <small v-if="errors.checkOut">{{ errors.checkOut }}</small>
      </label>
      <label class="field">
        <span>晚数</span>
        <input id="intent-nights" v-model="form.nights" type="number" min="1" inputmode="numeric" />
        <small v-if="errors.nights">{{ errors.nights }}</small>
      </label>
      <label class="field">
        <span>人数 *</span>
        <input id="intent-guests" v-model="form.guests" type="number" min="1" inputmode="numeric" />
        <small v-if="errors.guests">{{ errors.guests }}</small>
      </label>
      <label class="field">
        <span>联系人 *</span>
        <input id="intent-contactName" v-model="form.contactName" type="text" maxlength="64" autocomplete="name" />
        <small v-if="errors.contactName">{{ errors.contactName }}</small>
      </label>
      <label class="field">
        <span>手机 *</span>
        <input id="intent-contactPhone" v-model="form.contactPhone" type="tel" maxlength="11" autocomplete="tel" />
        <small v-if="errors.contactPhone">{{ errors.contactPhone }}</small>
      </label>
      <label class="field">
        <span>备注</span>
        <textarea id="intent-userRemark" v-model="form.userRemark" rows="4" maxlength="500"></textarea>
        <small v-if="errors.userRemark">{{ errors.userRemark }}</small>
      </label>
      <p v-if="submitError" class="form-error" role="alert">{{ submitError }}</p>
      <p v-if="submitKind === 'gone'" class="muted">
        <RouterLink to="/listings">建议回列表看看其他农家乐</RouterLink>
      </p>
      <button class="btn btn-primary btn-lg" type="submit" :disabled="submitting">
        {{ submitting ? '提交中…' : '提交意向' }}
      </button>
    </form>
  </section>
</template>
