<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { approveApply, fetchApply, rejectApply } from '../api/admin'
import { describeAdminError } from '../api/errors'
import { orgLabel, passwordError, rejectReasonError, reviewStatusLabel, reviewTagType, type MerchantApply } from '../api/readers'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const apply = ref<MerchantApply | null>(null)
const rejectOpen = ref(false)
const approveOpen = ref(false)
const openingPassword = ref('')
const openingPasswordError = ref('')
const reason = ref('')
const reasonError = ref('')
const actionError = ref('')
const acting = ref(false)

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const pending = computed(() => apply.value?.status === 'PENDING')

async function load() {
  actionError.value = ''
  apply.value = null
  if (!id.value) return
  const outcome = await run((signal) => fetchApply(id.value, signal))
  if (outcome.status === 'ok') apply.value = outcome.data
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

watch(id, () => void load(), { immediate: true })

function openApprove() {
  openingPassword.value = ''
  openingPasswordError.value = ''
  approveOpen.value = true
}

async function onApprove() {
  openingPasswordError.value = openingPassword.value.trim() ? passwordError(openingPassword.value) : ''
  if (openingPasswordError.value) {
    document.getElementById('approve-password')?.focus()
    return
  }
  acting.value = true
  actionError.value = ''
  try {
    const opened = await approveApply(id.value, openingPassword.value)
    approveOpen.value = false
    await ElMessageBox.alert(
      `手机：${opened.phone || '见申请联系人'}\n一次性密码：${opened.plainPassword}\n请当场告知商家。关闭后不再显示。`,
      '商家已开通',
      { confirmButtonText: '我已记下' },
    )
    await router.push('/applies')
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    acting.value = false
  }
}

function openReject() {
  reason.value = ''
  reasonError.value = ''
  rejectOpen.value = true
}

async function onReject() {
  reasonError.value = rejectReasonError(reason.value)
  if (reasonError.value) {
    document.getElementById('reject-reason')?.focus()
    return
  }
  acting.value = true
  actionError.value = ''
  try {
    await rejectApply(id.value, reason.value)
    rejectOpen.value = false
    ElMessage.success('已驳回')
    await router.push('/applies')
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
      <h1>入驻详情</h1>
      <RouterLink to="/applies">返回队列</RouterLink>
    </div>
    <el-skeleton v-if="loading" :rows="8" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <template v-else-if="apply">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="状态">
          <el-tag :type="reviewTagType(apply.status)">{{ reviewStatusLabel(apply.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="主体">{{ orgLabel(apply) }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ apply.contactName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ apply.contactPhone || '—' }}</el-descriptions-item>
        <el-descriptions-item label="拟营门店">{{ apply.plannedStoreName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="地区编号">{{ apply.regionId ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ apply.description || '—' }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ apply.createdAt || '—' }}</el-descriptions-item>
        <el-descriptions-item v-if="apply.reviewedAt" label="审核时间">{{ apply.reviewedAt }}</el-descriptions-item>
        <el-descriptions-item v-if="apply.rejectReason" label="驳回原因">{{ apply.rejectReason }}</el-descriptions-item>
      </el-descriptions>
      <div>
        <h2>证照</h2>
        <div v-if="apply.licenseUrls.length" class="license-grid">
          <img v-for="url in apply.licenseUrls" :key="url" :src="url" alt="证照" />
        </div>
        <p v-else class="hint">未上传证照</p>
      </div>
      <el-alert v-if="actionError" :title="actionError" type="error" :closable="false" show-icon />
      <div v-if="pending" class="actions">
        <el-button type="primary" :loading="acting" @click="openApprove">通过</el-button>
        <el-button type="danger" :disabled="acting" @click="openReject">驳回</el-button>
      </div>
      <el-dialog v-model="approveOpen" title="通过入驻" width="28rem">
        <p class="hint">通过后开通商家账号并绑定该主体。密码可留空，由服务端生成。明文密码只展示这一次。</p>
        <el-form label-position="top" @submit.prevent="onApprove">
          <el-form-item label="初始密码（可选）" :error="openingPasswordError">
            <el-input id="approve-password" v-model="openingPassword" type="text" autocomplete="off" maxlength="64" />
          </el-form-item>
          <div class="actions">
            <el-button @click="approveOpen = false">取消</el-button>
            <el-button type="primary" native-type="submit" :loading="acting">确认通过</el-button>
          </div>
        </el-form>
      </el-dialog>
      <el-dialog v-model="rejectOpen" title="驳回入驻" width="28rem">
        <el-form label-position="top" @submit.prevent="onReject">
          <el-form-item label="驳回原因" :error="reasonError" required>
            <el-input id="reject-reason" v-model="reason" type="textarea" :rows="4" maxlength="500" />
          </el-form-item>
          <div class="actions">
            <el-button @click="rejectOpen = false">取消</el-button>
            <el-button type="danger" native-type="submit" :loading="acting">确认驳回</el-button>
          </div>
        </el-form>
      </el-dialog>
    </template>
  </section>
</template>
