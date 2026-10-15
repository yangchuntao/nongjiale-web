<script setup lang="ts">
import type { PhonePasswordCredentials } from '@nongjiale/shared'
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { appLabel } from '../env'
import { useSiteStore } from '../stores/site'

const site = useSiteStore()
const route = useRoute()
const form = reactive<PhonePasswordCredentials>({ phone: '', password: '' })
const phoneError = ref('')
const passwordError = ref('')
const stubMessage = ref('')

const redirectLabel = computed(() => {
  const value = route.query.redirect
  return typeof value === 'string' ? value : ''
})

function onSubmit() {
  phoneError.value = /^1\d{10}$/.test(form.phone) ? '' : '请输入 11 位手机号'
  passwordError.value = form.password.trim() ? '' : '请输入密码'
  stubMessage.value = ''
  if (phoneError.value || passwordError.value) return
  stubMessage.value = '脚手架：登录接口尚未接入，不会写入令牌。'
}
</script>

<template>
  <section class="login">
    <p class="mark">「脚手架」</p>
    <h1>登录</h1>
    <p class="sub">{{ site.name }} · {{ appLabel }} · 手机号 + 密码</p>
    <form class="login-form" novalidate @submit.prevent="onSubmit">
      <label>
        <span>手机号</span>
        <input
          v-model="form.phone"
          name="phone"
          type="tel"
          inputmode="numeric"
          maxlength="11"
          autocomplete="tel"
          placeholder="11 位手机号"
        />
        <small v-if="phoneError">{{ phoneError }}</small>
      </label>
      <label>
        <span>密码</span>
        <input
          v-model="form.password"
          name="password"
          type="password"
          autocomplete="current-password"
          placeholder="密码"
        />
        <small v-if="passwordError">{{ passwordError }}</small>
      </label>
      <button type="submit">登录</button>
    </form>
    <p v-if="redirectLabel" class="redirect">登录后将回到 {{ redirectLabel }}。当前不会真正登录。</p>
    <p v-if="stubMessage" class="stub" role="status">{{ stubMessage }}</p>
    <p class="switch">
      没有账号？
      <RouterLink to="/register">去注册</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.login {
  max-width: 24rem;
  margin: var(--space-6) auto;
  padding: var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.mark {
  margin: 0;
  color: var(--color-brand);
  font-size: var(--font-caption);
  letter-spacing: 0.08em;
}

h1 {
  margin: var(--space-2) 0 0;
  font-size: var(--font-h1);
}

.sub,
.redirect,
.switch,
.stub {
  color: var(--color-text-secondary);
  font-size: var(--font-body);
  line-height: 1.6;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

label {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  font-size: var(--font-body);
}

input {
  box-sizing: border-box;
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font: inherit;
}

button {
  border: 0;
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  background: var(--color-brand);
  color: var(--color-text-inverse);
  font: inherit;
  cursor: pointer;
}

button:hover {
  background: var(--color-brand-hover);
}

small {
  color: var(--color-error);
}

.stub {
  color: var(--color-warning);
}
</style>
