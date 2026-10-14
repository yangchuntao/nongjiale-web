<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{ success: [] }>()
const auth = useAuthStore()
const oldPassword = ref('')
const newPassword = ref('')
const again = ref('')
const loading = ref(false)

async function submit() {
  if (!oldPassword.value || !newPassword.value) {
    ElMessage.warning('请填写原密码和新密码')
    return
  }
  if (newPassword.value !== again.value) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  loading.value = true
  try {
    await api.changePassword(auth.token!, {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    auth.markPasswordChanged()
    oldPassword.value = ''
    newPassword.value = ''
    again.value = ''
    ElMessage.success('密码已更新')
    emit('success')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '修改失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-form @submit.prevent="submit">
    <el-form-item label="原密码">
      <el-input v-model="oldPassword" type="password" show-password autocomplete="current-password" />
    </el-form-item>
    <el-form-item label="新密码">
      <el-input v-model="newPassword" type="password" show-password autocomplete="new-password" />
    </el-form-item>
    <el-form-item label="确认新密码">
      <el-input v-model="again" type="password" show-password autocomplete="new-password" />
    </el-form-item>
    <el-button type="primary" native-type="submit" :loading="loading">保存密码</el-button>
  </el-form>
</template>
