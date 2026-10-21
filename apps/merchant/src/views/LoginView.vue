<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ACCOUNT_DISABLED, describeMerchantError } from '../api/errors'
import { loginMerchant } from '../api/merchant'
import { PHONE_PATTERN, validatePassword } from '../domain/copy'
import { appLabel } from '../env'
import { safeInternalPath } from '../router/guard'
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
  passwordError.value = validatePassword(password.value)
  if (phoneError.value || passwordError.value) {
    document.getElementById(phoneError.value ? 'merchant-phone' : 'merchant-password')?.focus()
    return
  }
  formError.value = ''
  submitting.value = true
  try {
    const session = await loginMerchant({ phone: phone.value.trim(), password: password.value })
    auth.setSession(session)
    ElMessage.success('登录成功')
    await router.replace(safeInternalPath(route.query.redirect, '/stores'))
  } catch (cause) {
    formError.value = describeMerchantError(cause).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-shell">
    <section class="login">
      <div class="login-brand">
        <span class="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <div>
          <b>{{ site.name }}</b>
          <div>{{ appLabel }}</div>
        </div>
      </div>
      <p class="login-kicker">商家后台 · PARTNER CONSOLE</p>
      <h1 class="login-title">商家登录</h1>
      <p class="muted">手机号 + 密码</p>
      <el-form class="login-form" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="手机号" :error="phoneError">
          <el-input
            id="merchant-phone"
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
            id="merchant-password"
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
      <p class="login-foot">门店由运营代为开通。还没有账号请联系客服，或在门户提交商家入驻申请。</p>
    </section>
  </div>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
