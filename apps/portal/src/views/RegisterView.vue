<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { describePortalError } from '../api/errors'
import { register } from '../api/portal'
import { PHONE_PATTERN, validatePassword } from '../domain/intent'
import { safeInternalPath } from '../router/guard'
import { useAuthStore } from '../stores/auth'
import { useSiteStore } from '../stores/site'

const site = useSiteStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ phone: '', password: '', confirm: '' })
const errors = reactive({ phone: '', password: '', confirm: '' })
const formError = ref('')
const submitting = ref(false)

async function onSubmit() {
  errors.phone = PHONE_PATTERN.test(form.phone.trim()) ? '' : '请输入 11 位手机号'
  errors.password = validatePassword(form.password)
  errors.confirm = form.confirm === form.password ? '' : '两次密码不一致'
  formError.value = ''
  const first = (['phone', 'password', 'confirm'] as const).find((key) => errors[key])
  if (first) {
    document.getElementById(`register-${first}`)?.focus()
    return
  }
  submitting.value = true
  try {
    const token = await register({ phone: form.phone.trim(), password: form.password })
    auth.setToken(token)
    await auth.refreshProfile()
    await router.replace(safeInternalPath(route.query.redirect, '/'))
  } catch (cause) {
    if (cause instanceof Error && cause.message.includes('令牌')) {
      await router.replace({ path: '/login', query: route.query })
      return
    }
    formError.value = describePortalError(cause).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="auth-card">
    <p class="eyebrow">水乡农家</p>
    <h1>注册</h1>
    <p class="lede">{{ site.name }} · 手机号 + 密码，注册为游客</p>
    <form class="form-grid" novalidate @submit.prevent="onSubmit">
      <label class="field">
        <span>手机号</span>
        <input id="register-phone" v-model="form.phone" name="phone" type="tel" inputmode="numeric" maxlength="11" autocomplete="tel" />
        <small v-if="errors.phone">{{ errors.phone }}</small>
      </label>
      <label class="field">
        <span>密码</span>
        <input id="register-password" v-model="form.password" name="password" type="password" autocomplete="new-password" />
        <small v-if="errors.password">{{ errors.password }}</small>
      </label>
      <label class="field">
        <span>确认密码</span>
        <input id="register-confirm" v-model="form.confirm" name="confirm" type="password" autocomplete="new-password" />
        <small v-if="errors.confirm">{{ errors.confirm }}</small>
      </label>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <button class="btn btn-primary btn-lg" type="submit" :disabled="submitting">
        {{ submitting ? '提交中…' : '注册' }}
      </button>
    </form>
    <p class="muted">
      已有账号？
      <RouterLink :to="{ path: '/login', query: route.query }">去登录</RouterLink>
    </p>
  </section>
</template>
