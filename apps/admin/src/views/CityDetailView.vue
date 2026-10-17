<script setup lang="ts">
import { ApiError } from '@nongjiale/shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { closeCity, fetchCity, openCity, saveCityChecklist } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  buildChecklistPatch,
  cityTitle,
  openStatusLabel,
  type CityDetail,
  type CityHandKey,
} from '../api/readers'
import {
  CHECKLIST_AUTO_HINT,
  CITY_CLOSE_SUCCESS,
  CITY_DETAIL_ERROR,
  CITY_DETAIL_MISSING,
  CITY_NM_HINT,
  CITY_OPEN_SUCCESS,
  cityCloseConfirm,
  cityOpenConfirm,
} from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const detail = ref<CityDetail | null>(null)
const actionError = ref('')
const saving = ref(false)
const pending = ref<'open' | 'close' | ''>('')

const cityId = computed(() => {
  const raw = route.params.cityId
  const id = typeof raw === 'string' ? raw : ''
  return /^[1-9]\d*$/.test(id) ? id : ''
})

const pageError = computed(() => {
  if (errorKind.value === 'notFound') return CITY_DETAIL_MISSING
  if (errorKind.value === 'generic') return CITY_DETAIL_ERROR
  return error.value
})

async function load() {
  actionError.value = ''
  detail.value = null
  const id = cityId.value
  const outcome = await run(async (signal) => {
    if (!id) throw new ApiError(CITY_DETAIL_MISSING, 404, 404)
    return fetchCity(id, signal)
  })
  if (outcome.status === 'ok') detail.value = outcome.data
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

async function refreshAfterReject() {
  const id = cityId.value
  if (!id) return
  try {
    detail.value = await fetchCity(id)
  } catch (cause) {
    const view = describeAdminError(cause)
    if (!actionError.value) actionError.value = view.message
  }
}

async function onHand(key: CityHandKey, value: unknown) {
  const current = detail.value
  if (!current || saving.value || pending.value) return
  const next = value === true
  if (current.checklist[key] === next) return
  const previous = current
  detail.value = { ...current, checklist: { ...current.checklist, [key]: next } }
  saving.value = true
  actionError.value = ''
  try {
    detail.value = await saveCityChecklist(current.id, buildChecklistPatch(current.version, { [key]: next }))
  } catch (cause) {
    detail.value = previous
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
    if (view.kind === 'conflict') await refreshAfterReject()
  } finally {
    saving.value = false
  }
}

async function confirmAction(kind: 'open' | 'close') {
  const current = detail.value
  if (!current || pending.value || saving.value) return
  if (kind === 'open' && !current.canOpen) return
  if (kind === 'close' && !current.canClose) return
  try {
    await ElMessageBox.confirm(
      kind === 'open' ? cityOpenConfirm(current.name) : cityCloseConfirm(current.name),
      kind === 'open' ? '开通此市' : '关闭开通',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }
  pending.value = kind
  actionError.value = ''
  try {
    detail.value = kind === 'open' ? await openCity(current.id, current.version) : await closeCity(current.id, current.version)
    ElMessage.success(kind === 'open' ? CITY_OPEN_SUCCESS : CITY_CLOSE_SUCCESS)
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
    await refreshAfterReject()
  } finally {
    pending.value = ''
  }
}

watch(cityId, () => void load(), { immediate: true })
</script>

<template>
  <section class="page">
    <el-skeleton v-if="loading && !detail" :rows="8" animated />
    <el-empty v-else-if="!detail && errorKind === 'notFound'" :description="CITY_DETAIL_MISSING">
      <RouterLink to="/cities">返回列表</RouterLink>
    </el-empty>
    <el-empty v-else-if="!detail && error" :description="pageError">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <template v-else-if="detail">
      <div class="page-head">
        <div>
          <h1>{{ cityTitle(detail) }}</h1>
          <p class="hint">
            <el-tag v-if="detail.openStatus === 'OPEN'" type="success" round>{{ openStatusLabel(detail.openStatus) }}</el-tag>
            <el-tag v-else class="tag-muted" round>{{ openStatusLabel(detail.openStatus) }}</el-tag>
          </p>
        </div>
        <RouterLink to="/cities">返回列表</RouterLink>
      </div>

      <div class="summary-grid city-counts">
        <article class="summary-card">
          <span class="summary-label">上架可意向店</span>
          <span class="summary-value" :class="detail.checklist.supplyReady ? 'count-ok' : 'count-warn'">
            {{ detail.storeCount }} / {{ detail.minStores }}
          </span>
        </article>
        <article class="summary-card">
          <span class="summary-label">关联攻略</span>
          <span class="summary-value" :class="detail.checklist.articlesReady ? 'count-ok' : 'count-warn'">
            {{ detail.articleCount }} / {{ detail.minArticles }}
          </span>
        </article>
      </div>
      <p class="hint">{{ CITY_NM_HINT }}当前生效 {{ detail.minStores }} / {{ detail.minArticles }}。</p>

      <section aria-labelledby="city-checklist-title">
        <h2 id="city-checklist-title">开通检查</h2>
        <ul class="checklist">
          <li>
            <el-checkbox
              :model-value="detail.checklist.destinationReady"
              :disabled="saving || pending !== ''"
              @change="onHand('destinationReady', $event)"
            >
              目的地数据齐
            </el-checkbox>
          </li>
          <li>
            <el-checkbox :model-value="detail.checklist.supplyReady" disabled>
              最低上架供给 ≥ {{ detail.minStores }}（{{ detail.storeCount }} / {{ detail.minStores }}）
            </el-checkbox>
            <p class="hint">{{ CHECKLIST_AUTO_HINT }}<span v-if="!detail.checklist.supplyReady"> · 未达标</span></p>
          </li>
          <li>
            <el-checkbox :model-value="detail.checklist.articlesReady" disabled>
              攻略 ≥ {{ detail.minArticles }}（{{ detail.articleCount }} / {{ detail.minArticles }}）
            </el-checkbox>
            <p class="hint">{{ CHECKLIST_AUTO_HINT }}<span v-if="!detail.checklist.articlesReady"> · 未达标</span></p>
          </li>
          <li>
            <el-checkbox
              :model-value="detail.checklist.supportCovered"
              :disabled="saving || pending !== ''"
              @change="onHand('supportCovered', $event)"
            >
              客服覆盖说明（勾选确认）
            </el-checkbox>
          </li>
          <li>
            <el-checkbox
              :model-value="detail.checklist.dirtyDataCleared"
              :disabled="saving || pending !== ''"
              @change="onHand('dirtyDataCleared', $event)"
            >
              测数/脏数据清理确认
            </el-checkbox>
          </li>
        </ul>
      </section>

      <div v-if="actionError" class="missing" role="alert">{{ actionError }}</div>
      <div v-if="detail.missingReasons.length" id="city-missing" class="missing" tabindex="0">
        <p>请完成下列项后再开通：</p>
        <ul>
          <li v-for="reason in detail.missingReasons" :key="reason">{{ reason }}</li>
        </ul>
      </div>

      <div class="city-actions">
        <el-button
          type="primary"
          :disabled="!detail.canOpen || saving"
          :loading="pending === 'open'"
          aria-describedby="city-missing"
          @click="confirmAction('open')"
        >
          开通此市
        </el-button>
        <el-button v-if="detail.canClose" type="danger" :disabled="saving" :loading="pending === 'close'" @click="confirmAction('close')">
          关闭开通
        </el-button>
      </div>
    </template>
  </section>
</template>
