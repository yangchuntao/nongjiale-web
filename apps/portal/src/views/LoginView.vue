<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { describePortalError } from '../api/errors'
import { login } from '../api/portal'
import { validatePassword, PHONE_PATTERN } from '../domain/intent'
import { safeInternalPath } from '../router/guard'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

const site = useSiteStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ phone: '', password: '' })
const phoneError = ref('')
const passwordError = ref('')
const formError = ref('')
const submitting = ref(false)

async function onSubmit() {
  phoneError.value = PHONE_PATTERN.test(form.phone.trim()) ? '' : '请输入 11 位手机号'
  passwordError.value = validatePassword(form.password)
  formError.value = ''
  if (phoneError.value || passwordError.value) {
    document.getElementById(phoneError.value ? 'login-phone' : 'login-password')?.focus()
    return
  }
  submitting.value = true
  try {
    const token = await login({ phone: form.phone.trim(), password: form.password })
    auth.setToken(token)
    await auth.refreshProfile()
    await router.replace(safeInternalPath(route.query.redirect, '/'))
  } catch (cause) {
    formError.value = describePortalError(cause).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="auth-card">
    <p class="eyebrow">水乡农家</p>
    <h1>登录</h1>
    <p class="lede">{{ site.name }} · 手机号 + 密码</p>
    <form class="form-grid" novalidate @submit.prevent="onSubmit">
      <label class="field">
        <span>手机号</span>
        <input id="login-phone" v-model="form.phone" name="phone" type="tel" inputmode="numeric" maxlength="11" autocomplete="tel" />
        <small v-if="phoneError">{{ phoneError }}</small>
      </label>
      <label class="field">
        <span>密码</span>
        <input id="login-password" v-model="form.password" name="password" type="password" autocomplete="current-password" />
        <small v-if="passwordError">{{ passwordError }}</small>
      </label>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <button class="btn btn-primary btn-lg" type="submit" :disabled="submitting">
        {{ submitting ? '登录中…' : '登录' }}
      </button>
    </form>
    <p class="muted">
      没有账号？
      <RouterLink :to="{ path: '/register', query: route.query }">去注册</RouterLink>
    </p>
  </section>
</template>
