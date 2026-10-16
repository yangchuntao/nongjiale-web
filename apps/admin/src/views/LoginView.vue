<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchAdminMe, loginAdmin } from '../api/admin'
import { ACCOUNT_DISABLED, describeAdminError } from '../api/errors'
import { passwordError as passwordMessage } from '../api/readers'
import { PHONE_PATTERN } from '../domain/copy'
import { appLabel } from '../env'
import { safeInternalPath } from '../router/guard'
import { HOME_PATH } from '../router/routes'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

const site = useSiteStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const phone = ref('')
const password = ref('')
const phoneError = ref('')
const passwordError = ref('')
const formError = ref('')
const submitting = ref(false)

function syncDisabledNotice() {
  if (route.query.disabled === '1') formError.value = ACCOUNT_DISABLED
}

watch(() => route.query.disabled, syncDisabledNotice, { immediate: true })

async function onSubmit() {
  phoneError.value = PHONE_PATTERN.test(phone.value.trim()) ? '' : '请输入 11 位手机号'
  passwordError.value = passwordMessage(password.value)
  if (phoneError.value || passwordError.value) {
    document.getElementById(phoneError.value ? 'admin-phone' : 'admin-password')?.focus()
    return
  }
  formError.value = ''
  submitting.value = true
  try {
    const session = await loginAdmin({ phone: phone.value.trim(), password: password.value })
    auth.setSession(session)
    try {
      auth.applyMe(await fetchAdminMe())
    } catch {
      // 登录令牌已写入。/me 失败时顶栏仍可用登录响应里的显示名。
    }
    void site.loadFromAdmin()
    ElMessage.success('登录成功')
    await router.replace(safeInternalPath(route.query.redirect, HOME_PATH))
  } catch (cause) {
    formError.value = describeAdminError(cause).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="login">
    <p class="login-kicker">{{ site.name }}</p>
    <h1>运营登录</h1>
    <p class="muted">{{ appLabel }} · 手机号 + 密码</p>
    <el-form class="login-form" label-position="top" @submit.prevent="onSubmit">
      <el-form-item label="手机号" :error="phoneError">
        <el-input
          id="admin-phone"
          v-model="phone"
          name="phone"
          maxlength="11"
          inputmode="numeric"
          autocomplete="tel"
          placeholder="11 位手机号"
        />
      </el-form-item>
      <el-form-item label="密码" :error="passwordError">
        <el-input
          id="admin-password"
          v-model="password"
          name="password"
          type="password"
          show-password
          autocomplete="current-password"
          placeholder="密码"
        />
      </el-form-item>
      <el-alert v-if="formError" :title="formError" type="error" :closable="false" show-icon role="alert" />
      <el-button type="primary" native-type="submit" :loading="submitting">登录</el-button>
    </el-form>
  </section>
</template>
