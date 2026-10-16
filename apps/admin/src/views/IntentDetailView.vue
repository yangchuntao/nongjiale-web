<script setup lang="ts">
import type { IntentStatus } from '@nongjiale/shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { appendIntentNote, changeIntentStatus, fetchIntent } from '../api/admin'
import { describeAdminError } from '../api/errors'
import {
  buildIntentNoteBody,
  displayIntentStatus,
  guestLabel,
  intentDateLabel,
  intentStatusLabel,
  intentTagMuted,
  intentTagType,
  nextIntentStatuses,
  noteHeading,
  type IntentRecord,
} from '../api/readers'
import { INTENT_OPERATOR_NOTICE } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const intent = ref<IntentRecord | null>(null)
const note = ref('')
const noteError = ref('')
const actionError = ref('')
const acting = ref(false)

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const nextStatuses = computed(() => (intent.value ? nextIntentStatuses(intent.value.status) : []))

async function load() {
  actionError.value = ''
  intent.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchIntent(id.value, signal))
  if (outcome.status === 'ok') intent.value = outcome.data
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

watch(id, () => void load(), { immediate: true })

async function onStatus(status: IntentStatus) {
  if (!intent.value) return
  if (status === 'CLOSED') {
    try {
      await ElMessageBox.confirm('关闭后不能再迁移状态。', '关闭意向', { type: 'warning' })
    } catch {
      return
    }
  }
  acting.value = true
  actionError.value = ''
  try {
    await changeIntentStatus(id.value, status, intent.value.version, note.value)
    note.value = ''
    noteError.value = ''
    ElMessage.success(`已更新为${intentStatusLabel(status)}`)
    await load()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    acting.value = false
  }
}

async function onNote() {
  noteError.value = ''
  try {
    buildIntentNoteBody(note.value)
  } catch (cause) {
    noteError.value = cause instanceof Error ? cause.message : '请填写备注'
    document.getElementById('intent-note')?.focus()
    return
  }
  acting.value = true
  actionError.value = ''
  try {
    await appendIntentNote(id.value, note.value)
    note.value = ''
    ElMessage.success('已追加备注')
    await load()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    acting.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <h1>意向详情</h1>
      <RouterLink to="/intents">返回列表</RouterLink>
    </div>
    <p class="notice">{{ INTENT_OPERATOR_NOTICE }}</p>
    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <template v-else-if="intent">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="单号">
          <span class="mono">{{ intent.intentNo || intent.id }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="intentTagType(intent.status)" :class="{ 'tag-muted': intentTagMuted(intent.status) }" round>{{ displayIntentStatus(intent.status, intent.statusLabel) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="房源">{{ intent.storeName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ intentDateLabel(intent) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="人数">{{ guestLabel(intent.guests) }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ intent.contactName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ intent.contactPhone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="游客备注">{{ intent.userRemark || '—' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ intent.createdAt || '—' }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="nextStatuses.length" class="actions">
        <el-button
          v-for="status in nextStatuses"
          :key="status"
          :type="status === 'CLOSED' ? 'danger' : 'primary'"
          :loading="acting"
          @click="onStatus(status)"
        >
          {{ intentStatusLabel(status) }}
        </el-button>
      </div>
      <p v-else class="hint">当前状态不能再迁移。仍可查看并追加备注。</p>
      <el-form class="form-narrow" label-position="top" @submit.prevent="onNote">
        <el-form-item label="备注" :error="noteError">
          <el-input id="intent-note" v-model="note" type="textarea" :rows="3" maxlength="1000" placeholder="追加到时间线，不覆盖历史" />
        </el-form-item>
        <el-button native-type="submit" :loading="acting">追加备注</el-button>
      </el-form>
      <el-alert v-if="actionError" :title="actionError" type="error" :closable="false" show-icon />
      <div>
        <h2>备注时间线</h2>
        <el-empty v-if="!intent.notes.length" description="还没有跟进备注" />
        <el-timeline v-else>
          <el-timeline-item v-for="item in intent.notes" :key="item.id" :timestamp="item.createdAt || '—'">
            <strong>{{ noteHeading(item) }}</strong>
            <p class="hint">{{ item.note || '—' }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
    </template>
  </section>
</template>
