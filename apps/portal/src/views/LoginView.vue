<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const phone = ref('13800000001')
const password = ref('password')
const error = ref('')

async function submit() {
  error.value = ''
  try {
    await auth.login(phone.value.trim(), password.value)
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败'
  }
}
</script>

<template>
  <section class="card" style="max-width:420px;margin:0 auto">
    <h1 class="page-title">游客登录</h1>
    <p class="muted">演示账号：13800000001 / password</p>
    <form @submit.prevent="submit">
      <div class="field">
        <label>手机号</label>
        <input v-model="phone" autocomplete="username" required />
      </div>
      <div class="field">
        <label>密码</label>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn block" type="submit" :disabled="auth.loading">登录</button>
    </form>
  </section>
</template>
