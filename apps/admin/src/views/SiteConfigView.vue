<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const loaded = ref(false)
const error = ref('')
const form = reactive({
  siteName: '',
  primaryColor: '',
  contactPhone: '',
})

async function load() {
  loading.value = true
  error.value = ''
  loaded.value = false
  try {
    const data = await api.fetchSiteConfig(auth.token!)
    form.siteName = typeof data?.siteName === 'string' ? data.siteName : ''
    form.primaryColor = typeof data?.primaryColor === 'string' ? data.primaryColor : ''
    form.contactPhone = typeof data?.contactPhone === 'string' ? data.contactPhone : ''
    loaded.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!loaded.value) return
  if (form.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(form.primaryColor)) {
    ElMessage.warning('主色请填 #RRGGBB，未定可以留空')
    return
  }
  saving.value = true
  try {
    const data = await api.saveSiteConfig(auth.token!, {
      siteName: form.siteName.trim(),
      primaryColor: form.primaryColor.trim(),
      contactPhone: form.contactPhone.trim(),
    })
    if (data && typeof data === 'object') {
      form.siteName = typeof data.siteName === 'string' ? data.siteName : form.siteName
      form.primaryColor = typeof data.primaryColor === 'string' ? data.primaryColor : form.primaryColor
      form.contactPhone = typeof data.contactPhone === 'string' ? data.contactPhone : form.contactPhone
    }
    ElMessage.success('站点配置已保存')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div v-loading="loading" style="max-width:560px">
    <h2>站点配置</h2>
    <p style="color:#666">站名、主色、客服电话。正式值未定时可以留空或使用占位。门户读取 /api/config/public。</p>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-form v-if="loaded" label-width="88px" @submit.prevent="save">
      <el-form-item label="站名">
        <el-input v-model="form.siteName" placeholder="未定时可留空" />
      </el-form-item>
      <el-form-item label="主色">
        <el-input v-model="form.primaryColor" placeholder="#2F6B3A" />
      </el-form-item>
      <el-form-item label="客服电话">
        <el-input v-model="form.contactPhone" />
      </el-form-item>
      <el-button type="primary" native-type="submit" :loading="saving">保存</el-button>
    </el-form>
    <el-empty v-else-if="!loading && error" description="配置尚未加载" />
  </div>
</template>
