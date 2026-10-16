<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchMerchantStore, updateMerchantStore } from '../api/merchant'
import {
  draftFromDetail,
  shelfStatusLabel,
  validateStoreDraft,
  type StoreDetail,
  type StoreDraft,
} from '../api/readers'
import { describeMerchantError } from '../api/errors'
import { STORE_SAVED } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const store = ref<StoreDetail | null>(null)
const saving = ref(false)
const saveError = ref('')
const nameError = ref('')
const regionError = ref('')
const priceError = ref('')
const versionError = ref('')

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const draft = reactive<StoreDraft>({
  name: '',
  regionId: null,
  address: '',
  phone: '',
  coverUrl: '',
  galleryText: '',
  packageText: '',
  facilities: '',
  features: '',
  notice: '',
  trafficText: '',
  priceText: '',
  priceFromText: '',
  version: null,
})

function applyDraft(next: StoreDetail) {
  store.value = next
  Object.assign(draft, draftFromDetail(next))
}

async function load() {
  saveError.value = ''
  store.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchMerchantStore(id.value, signal))
  if (outcome.status === 'ok') applyDraft(outcome.data)
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

watch(id, () => void load(), { immediate: true })

async function onSubmit() {
  const fieldErrors = validateStoreDraft(draft)
  nameError.value = fieldErrors.name
  regionError.value = fieldErrors.regionId
  priceError.value = fieldErrors.priceFrom
  versionError.value = fieldErrors.version
  saveError.value = ''
  if (nameError.value || regionError.value || priceError.value || versionError.value) {
    const focusId = nameError.value
      ? 'store-name'
      : regionError.value
        ? 'store-region'
        : priceError.value
          ? 'store-price-from'
          : 'store-version'
    document.getElementById(focusId)?.focus()
    return
  }
  saving.value = true
  try {
    const updated = await updateMerchantStore(id.value, draft)
    if (updated) applyDraft(updated)
    else await load()
    ElMessage.success(STORE_SAVED)
  } catch (cause) {
    const view = describeMerchantError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    saveError.value = view.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <h1>编辑门店</h1>
      <div class="actions">
        <RouterLink to="/stores">返回列表</RouterLink>
        <RouterLink v-if="id" :to="`/stores/${id}/shelf`">上下架申请</RouterLink>
      </div>
    </div>
    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <template v-else-if="store">
      <el-form class="form-narrow" label-position="top" @submit.prevent="onSubmit">
        <h2 class="form-group-title">基本信息</h2>
        <el-form-item label="门店名称" :error="nameError" required>
          <el-input id="store-name" v-model="draft.name" maxlength="80" />
        </el-form-item>
        <el-form-item label="地区编号" :error="regionError" required>
          <el-input-number id="store-region" v-model="draft.regionId" :min="0" :step="1" :precision="0" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input id="store-address" v-model="draft.address" maxlength="120" />
        </el-form-item>
        <el-form-item label="门店电话">
          <el-input id="store-phone" v-model="draft.phone" maxlength="20" />
        </el-form-item>
        <h2 class="form-group-title">价格与图片</h2>
        <el-form-item label="价格文案">
          <el-input id="store-price" v-model="draft.priceText" maxlength="80" />
        </el-form-item>
        <el-form-item label="起步价" :error="priceError">
          <el-input id="store-price-from" v-model="draft.priceFromText" inputmode="decimal" />
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input id="store-cover" v-model="draft.coverUrl" />
        </el-form-item>
        <el-form-item label="图集">
          <el-input id="store-gallery" v-model="draft.galleryText" type="textarea" :rows="4" placeholder="每行一个图片地址" />
        </el-form-item>
        <h2 class="form-group-title">套餐与须知</h2>
        <el-form-item label="套餐文案">
          <el-input id="store-package" v-model="draft.packageText" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="特色">
          <el-input id="store-features" v-model="draft.features" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="设施">
          <el-input id="store-facilities" v-model="draft.facilities" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="须知">
          <el-input id="store-notice" v-model="draft.notice" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="交通">
          <el-input id="store-traffic" v-model="draft.trafficText" type="textarea" :rows="3" />
        </el-form-item>
        <p v-if="versionError" class="hint" role="alert">{{ versionError }}</p>
        <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon />
        <div class="actions">
          <el-button id="store-version" type="primary" native-type="submit" :loading="saving" :disabled="draft.version === null">
            保存
          </el-button>
        </div>
      </el-form>

      <el-descriptions class="ops-readonly" title="运营维护（只读）" :column="1" border>
        <el-descriptions-item label="主体编号">{{ store.merchantOrgId || '—' }}</el-descriptions-item>
        <el-descriptions-item label="上架状态">{{ shelfStatusLabel(store.shelfStatus) }}</el-descriptions-item>
        <el-descriptions-item label="首页推荐">{{ store.homeRecommended ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="排序权重">{{ store.homeSort ?? '—' }}</el-descriptions-item>
      </el-descriptions>
      <p class="hint">首页推荐、排序权重和上架状态只展示。保存请求不会带上这些字段。</p>
    </template>
  </section>
</template>

