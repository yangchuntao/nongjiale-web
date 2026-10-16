<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { fetchStore, updateStore } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  draftFromStore,
  listingErrors,
  orgLabel,
  shelfStatusLabel,
  type ListingDraft,
  type StoreDetail,
} from '../api/readers'
import { LISTING_SAVED, RECOMMEND_HELP, SHELF_EFFECTIVE, SORT_HELP } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const store = ref<StoreDetail | null>(null)
const saving = ref(false)
const shelving = ref(false)
const saveError = ref('')
const nameError = ref('')
const regionError = ref('')
const sortError = ref('')
const priceError = ref('')
const versionError = ref('')

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const draft = reactive<ListingDraft>({
  name: '',
  regionId: null,
  address: '',
  phone: '',
  coverUrl: '',
  galleryText: '',
  priceText: '',
  priceFromText: '',
  packageText: '',
  facilities: '',
  features: '',
  notice: '',
  trafficText: '',
  homeRecommended: false,
  homeSortText: '',
  shelfStatus: 'OFF_SHELF',
  version: null,
})

function applyDraft(next: StoreDetail) {
  store.value = next
  Object.assign(draft, draftFromStore(next))
}

async function load() {
  saveError.value = ''
  store.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchStore(id.value, signal))
  if (outcome.status === 'ok') applyDraft(outcome.data)
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

watch(id, () => void load(), { immediate: true })

function showFieldErrors(): boolean {
  const fieldErrors = listingErrors(draft)
  nameError.value = fieldErrors.name
  regionError.value = fieldErrors.regionId
  sortError.value = fieldErrors.homeSort
  priceError.value = fieldErrors.priceFrom
  versionError.value = fieldErrors.version
  const focusId = nameError.value
    ? 'listing-name'
    : regionError.value
      ? 'listing-region'
      : sortError.value
        ? 'listing-sort'
        : priceError.value
          ? 'listing-price-from'
          : ''
  if (focusId) document.getElementById(focusId)?.focus()
  return Boolean(focusId || versionError.value)
}

async function onSubmit() {
  saveError.value = ''
  if (showFieldErrors()) return
  saving.value = true
  try {
    const updated = await updateStore(id.value, draft)
    if (updated) applyDraft(updated)
    else await load()
    ElMessage.success(LISTING_SAVED)
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    saveError.value = view.message
  } finally {
    saving.value = false
  }
}

async function onShelf(shelfStatus: 'ON_SHELF' | 'OFF_SHELF') {
  const publishing = shelfStatus === 'ON_SHELF'
  try {
    await ElMessageBox.confirm(
      publishing
        ? '上架后游客可见性立即变化。确认后立即生效。'
        : '下架后游客将不可见、不可提交意向。确认后立即生效。',
      publishing ? '代上架' : '代下架',
      { type: 'warning' },
    )
  } catch {
    return
  }
  const previous = draft.shelfStatus
  draft.shelfStatus = shelfStatus
  saveError.value = ''
  if (showFieldErrors()) {
    draft.shelfStatus = previous
    return
  }
  shelving.value = true
  try {
    const updated = await updateStore(id.value, draft)
    if (updated) applyDraft(updated)
    else await load()
    ElMessage.success(SHELF_EFFECTIVE)
  } catch (cause) {
    draft.shelfStatus = previous
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    saveError.value = view.message
  } finally {
    shelving.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <h1>房源编辑</h1>
      <RouterLink to="/listings">返回列表</RouterLink>
    </div>
    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <template v-else-if="store">
      <p class="hint">{{ orgLabel(store) }} · {{ shelfStatusLabel(store.shelfStatus) }}</p>
      <el-form class="form-narrow" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="名称" :error="nameError" required>
          <el-input id="listing-name" v-model="draft.name" maxlength="128" />
        </el-form-item>
        <el-form-item label="地区编号" :error="regionError" required>
          <el-input-number id="listing-region" v-model="draft.regionId" :min="0" :step="1" :precision="0" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input id="listing-address" v-model="draft.address" maxlength="256" />
        </el-form-item>
        <el-form-item label="门店电话">
          <el-input id="listing-phone" v-model="draft.phone" maxlength="32" />
        </el-form-item>
        <el-form-item label="价格文案">
          <el-input id="listing-price" v-model="draft.priceText" maxlength="64" />
        </el-form-item>
        <el-form-item label="起步价" :error="priceError">
          <el-input id="listing-price-from" v-model="draft.priceFromText" inputmode="decimal" />
        </el-form-item>
        <el-form-item label="封面地址">
          <el-input id="listing-cover" v-model="draft.coverUrl" />
        </el-form-item>
        <el-form-item label="图集">
          <el-input id="listing-gallery" v-model="draft.galleryText" type="textarea" :rows="4" placeholder="每行一个图片地址" />
        </el-form-item>
        <el-form-item label="套餐文案">
          <el-input id="listing-package" v-model="draft.packageText" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item label="特色">
          <el-input v-model="draft.features" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="设施">
          <el-input v-model="draft.facilities" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="须知">
          <el-input v-model="draft.notice" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="交通与周边">
          <el-input v-model="draft.trafficText" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="首页推荐">
          <el-checkbox v-model="draft.homeRecommended">在首页推荐楼层展示</el-checkbox>
          <p class="hint">{{ RECOMMEND_HELP }}</p>
        </el-form-item>
        <el-form-item label="排序权重" :error="sortError" required>
          <el-input id="listing-sort" v-model="draft.homeSortText" inputmode="numeric" />
          <p class="hint">{{ SORT_HELP }}</p>
        </el-form-item>
        <p v-if="versionError" class="hint" role="alert">{{ versionError }}</p>
        <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon />
        <div class="actions">
          <el-button type="primary" native-type="submit" :loading="saving" :disabled="draft.version === null">保存</el-button>
        </div>
      </el-form>
      <div class="actions">
        <el-button v-if="store.shelfStatus !== 'ON_SHELF'" :loading="shelving" @click="onShelf('ON_SHELF')">代上架</el-button>
        <el-button v-if="store.shelfStatus === 'ON_SHELF'" type="danger" :loading="shelving" @click="onShelf('OFF_SHELF')">
          代下架
        </el-button>
      </div>
      <p class="hint">代上下架不走商家申请队列，确认后立即影响游客可见性。</p>
    </template>
  </section>
</template>
