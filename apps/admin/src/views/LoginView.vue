<script setup lang="ts">
import type { PhonePasswordCredentials } from '@nongjiale/shared'
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
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
    <el-form class="login-form" @submit.prevent="onSubmit">
      <el-form-item label="手机号" :error="phoneError">
        <el-input
          v-model="form.phone"
          name="phone"
          maxlength="11"
          inputmode="numeric"
          autocomplete="tel"
          placeholder="11 位手机号"
        />
      </el-form-item>
      <el-form-item label="密码" :error="passwordError">
        <el-input
          v-model="form.password"
          name="password"
          type="password"
          show-password
          autocomplete="current-password"
          placeholder="密码"
        />
      </el-form-item>
      <el-button type="primary" native-type="submit">登录</el-button>
    </el-form>
    <p v-if="redirectLabel" class="redirect">登录后将回到 {{ redirectLabel }}。当前不会真正登录。</p>
    <p v-if="stubMessage" class="stub" role="status">{{ stubMessage }}</p>
  </section>
</template>

<style scoped>
.login {
  max-width: 24rem;
  margin: var(--space-7) auto;
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
.stub {
  color: var(--color-text-secondary);
  font-size: var(--font-body);
  line-height: 1.6;
}

.login-form {
  margin-top: var(--space-4);
}

.stub {
  color: var(--color-warning);
}
</style>
