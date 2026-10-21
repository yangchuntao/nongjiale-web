<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { createBanner, fetchBanner, fetchCityOptions, updateBanner } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  bannerFieldErrors,
  draftFromBanner,
  openBannerCities,
  type BannerDraft,
  type BannerFieldErrors,
  type BannerRecord,
  type CitySummary,
} from '../api/readers'
import {
  BANNER_CITY_BLOCKED,
  BANNER_CITY_CLOSED,
  BANNER_CLOSED_NOTE,
  BANNER_LINK_HELP,
  BANNER_LOAD_ERROR,
  BANNER_SCOPE_HELP,
  BANNER_SORT_HELP,
} from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const cities = ref<CitySummary[]>([])
const loaded = ref<BannerRecord | null>(null)
const saving = ref(false)
const saveError = ref('')
const previewBroken = ref(false)
const draft = reactive<BannerDraft>(blankDraft())
const fieldErrors = ref<BannerFieldErrors>(emptyErrors())
let baseline = JSON.stringify(draft)

const creating = computed(() => route.name === 'banner-new')
const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const openCities = computed(() => openBannerCities(cities.value))
const previewUrl = computed(() => (/^https?:\/\//i.test(draft.imageUrl.trim()) ? draft.imageUrl.trim() : ''))
const closedTarget = computed(() => {
  if (draft.scope !== 'CITY' || !loaded.value || loaded.value.cityOpen !== false) return null
  if (draft.cityId !== (loaded.value.cityId ?? '')) return null
  return {
    id: loaded.value.cityId ?? '',
    name: loaded.value.cityName || '该市',
  }
})

function blankDraft(): BannerDraft {
  return {
    title: '',
    imageUrl: '',
    linkUrl: '',
    scope: 'ALL',
    cityId: '',
    sortOrderText: '100',
    enabled: true,
  }
}

function emptyErrors(): BannerFieldErrors {
  return { imageUrl: '', linkUrl: '', cityId: '', sortOrder: '' }
}

function remember() {
  baseline = JSON.stringify(draft)
}

function applyDraft(next: BannerRecord) {
  loaded.value = next
  Object.assign(draft, draftFromBanner(next))
  remember()
}

async function loadCities() {
  try {
    cities.value = await fetchCityOptions()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    saveError.value = view.message
  }
}

async function load() {
  saveError.value = ''
  fieldErrors.value = emptyErrors()
  previewBroken.value = false
  if (creating.value) {
    loaded.value = null
    Object.assign(draft, blankDraft())
    remember()
    return
  }
  loaded.value = null
  const outcome = await run((signal) => fetchBanner(id.value, signal))
  if (outcome.status === 'ok') applyDraft(outcome.data)
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

watch(() => draft.scope, (scope) => {
  if (scope === 'ALL') draft.cityId = ''
})

watch(previewUrl, () => {
  previewBroken.value = false
})

watch([creating, id], () => void load(), { immediate: true })
void loadCities()

function validate(): boolean {
  const openIds = new Set(openCities.value.map((city) => city.id))
  fieldErrors.value = bannerFieldErrors(draft, openIds)
  return !Object.values(fieldErrors.value).some(Boolean)
}

async function save() {
  saveError.value = ''
  if (!validate()) return
  saving.value = true
  try {
    if (creating.value) await createBanner(draft)
    else await updateBanner(id.value, draft)
    ElMessage.success('已保存')
    await router.push('/banners')
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    saveError.value = view.kind === 'conflict' ? BANNER_CITY_CLOSED : view.message
  } finally {
    saving.value = false
  }
}

async function cancel() {
  if (JSON.stringify(draft) !== baseline) {
    try {
      await ElMessageBox.confirm('有未保存的修改，确认离开？', '离开编辑', { type: 'warning' })
    } catch {
      return
    }
  }
  await router.push('/banners')
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <h1>{{ creating ? '新建 Banner' : '编辑 Banner' }}</h1>
      <RouterLink to="/banners">返回列表</RouterLink>
    </div>
    <el-skeleton v-if="loading && !creating" :rows="6" animated />
    <el-empty
      v-else-if="error"
      :description="errorKind === 'forbidden' ? error : BANNER_LOAD_ERROR"
    >
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-form v-else class="form-narrow" label-position="top" @submit.prevent="save">
      <el-alert
        v-if="closedTarget"
        :title="`${closedTarget.name} · ${BANNER_CLOSED_NOTE}`"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form-item label="图片地址" :error="fieldErrors.imageUrl" required>
        <el-input v-model="draft.imageUrl" placeholder="https://" />
      </el-form-item>
      <div v-if="previewUrl && !previewBroken" class="banner-preview">
        <img :src="previewUrl" :alt="draft.title || '活动宣传'" @error="previewBroken = true" />
      </div>
      <p v-else-if="previewUrl" class="muted">图片暂时无法预览，保存后仍使用该地址。</p>
      <el-form-item label="跳转链接" :error="fieldErrors.linkUrl" required>
        <el-input v-model="draft.linkUrl" placeholder="/listings 或 https://" />
        <p class="hint">{{ BANNER_LINK_HELP }}</p>
      </el-form-item>
      <el-form-item label="投放范围" required>
        <el-radio-group v-model="draft.scope">
          <el-radio value="ALL">全站</el-radio>
          <el-radio value="CITY">指定市</el-radio>
        </el-radio-group>
        <p class="hint">{{ BANNER_SCOPE_HELP }}</p>
      </el-form-item>
      <el-form-item v-if="draft.scope === 'CITY'" label="指定市" :error="fieldErrors.cityId" required>
        <el-select v-model="draft.cityId" placeholder="请选择已开通的市" style="width: 16rem">
          <el-option
            v-for="city in openCities"
            :key="city.id"
            :label="city.name"
            :value="city.id"
          />
          <el-option
            v-if="closedTarget"
            :label="`${closedTarget.name}（${BANNER_CITY_BLOCKED}）`"
            :value="closedTarget.id"
            disabled
          />
        </el-select>
      </el-form-item>
      <el-form-item label="排序" :error="fieldErrors.sortOrder" required>
        <el-input v-model="draft.sortOrderText" inputmode="numeric" />
        <p class="hint">{{ BANNER_SORT_HELP }}</p>
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="draft.enabled" />
      </el-form-item>
      <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon />
      <div class="actions">
        <el-button type="primary" native-type="submit" :loading="saving">保存</el-button>
        <el-button :disabled="saving" @click="cancel">取消</el-button>
      </div>
    </el-form>
  </section>
</template>
