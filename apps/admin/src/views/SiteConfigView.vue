<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { reactive, ref } from 'vue'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchSiteConfig, saveSiteConfig } from '../api/admin'
import { describeAdminError } from '../api/errors'
import { siteConfigErrors, type SiteConfigRecord } from '../api/readers'
import { SITE_PLACEHOLDER_HELP, SITE_PREVIEW_HELP } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const router = useRouter()
const auth = useAuthStore()
const site = useSiteStore()
const { loading, error, errorKind, run } = useLoadState()
const saving = ref(false)
const saveError = ref('')
const nameError = ref('')
const colorError = ref('')
const phoneError = ref('')
const draft = reactive<SiteConfigRecord>({
  siteName: site.name,
  brandColor: site.color,
  contactPhone: site.phone,
})

function applyDraft(next: SiteConfigRecord) {
  draft.siteName = next.siteName || site.name
  draft.brandColor = next.brandColor || site.color
  draft.contactPhone = next.contactPhone || site.phone
}

async function load() {
  saveError.value = ''
  const outcome = await run((signal) => fetchSiteConfig(signal))
  if (outcome.status === 'ok') {
    applyDraft(outcome.data)
    site.applyConfig(outcome.data)
  }
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

onMounted(() => void load())

async function onSubmit() {
  const fieldErrors = siteConfigErrors(draft)
  nameError.value = fieldErrors.siteName
  colorError.value = fieldErrors.brandColor
  phoneError.value = fieldErrors.contactPhone
  saveError.value = ''
  if (nameError.value || colorError.value || phoneError.value) {
    const focusId = nameError.value ? 'site-name' : colorError.value ? 'site-color' : 'site-phone'
    document.getElementById(focusId)?.focus()
    return
  }
  saving.value = true
  try {
    const saved = await saveSiteConfig(draft)
    applyDraft(saved)
    site.applyConfig(saved)
    ElMessage.success('已保存')
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    saveError.value = view.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page">
    <div>
      <h1>站点配置</h1>
      <p class="hint">{{ SITE_PLACEHOLDER_HELP }}</p>
      <p class="hint">{{ SITE_PREVIEW_HELP }}</p>
    </div>
    <el-skeleton v-if="loading" :rows="4" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-form v-else class="form-narrow" label-position="top" @submit.prevent="onSubmit">
      <el-form-item label="站名" :error="nameError" required>
        <el-input id="site-name" v-model="draft.siteName" maxlength="64" />
      </el-form-item>
      <el-form-item label="主色" :error="colorError" required>
        <el-input id="site-color" v-model="draft.brandColor" maxlength="7" placeholder="#4BA3D9" />
      </el-form-item>
      <el-form-item label="客服电话" :error="phoneError" required>
        <el-input id="site-phone" v-model="draft.contactPhone" maxlength="32" />
      </el-form-item>
      <p class="hint">当前预览：{{ draft.siteName || '站点名称' }} · {{ draft.contactPhone || '400-000-0000' }}</p>
      <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon />
      <el-button type="primary" native-type="submit" :loading="saving">保存</el-button>
    </el-form>
  </section>
</template>
