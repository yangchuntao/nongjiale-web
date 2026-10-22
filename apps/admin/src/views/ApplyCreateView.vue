<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { applyCreateErrors, createApplyForMerchant, fetchCityOptions, type ApplyCreateDraft } from '../api/admin'
import { cityTitle, type CitySummary } from '../api/readers'
import { describeAdminError } from '../api/errors'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const router = useRouter()
const auth = useAuthStore()
const { errorKind, run } = useLoadState()
const cities = ref<CitySummary[]>([])
const submitting = ref(false)
const submitError = ref('')
const fieldErrors = ref<Partial<Record<keyof ApplyCreateDraft, string>>>({})

const draft = reactive<ApplyCreateDraft>({
  orgName: '',
  contactName: '',
  contactPhone: '',
  plannedStoreName: '',
  regionId: '',
  description: '',
})

onMounted(async () => {
  const outcome = await run((signal) => fetchCityOptions(signal))
  if (outcome.status === 'ok') cities.value = outcome.data
  if (outcome.status === 'error') {
    await leaveIfDisabled(errorKind.value, auth, router)
  }
})

function clearError(key: keyof ApplyCreateDraft) {
  if (fieldErrors.value[key]) {
    const next = { ...fieldErrors.value }
    delete next[key]
    fieldErrors.value = next
  }
}

async function onSubmit() {
  const errors = applyCreateErrors(draft)
  fieldErrors.value = errors
  if (Object.keys(errors).length > 0) return
  submitError.value = ''
  submitting.value = true
  try {
    const id = await createApplyForMerchant(draft)
    ElMessage.success('已代商家提交入驻申请')
    await router.replace(`/applies/${id}`)
  } catch (cause) {
    submitError.value = describeAdminError(cause).message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>代商家录入入驻申请</h1>
        <p class="hint">
          由运营代商家填写，落一条「待审」申请并标记来源为运营代录；
          提交后与商家自填申请走同一审核流（通过开通 / 驳回）。带 * 为必填。
        </p>
      </div>
    </div>
    <el-form class="apply-create-form" label-position="top" @submit.prevent="onSubmit">
      <el-form-item label="主体名称" required :error="fieldErrors.orgName">
        <el-input
          id="apply-orgName"
          v-model="draft.orgName"
          maxlength="128"
          placeholder="商家主体名称，如「广陵表弟农家」"
          @input="clearError('orgName')"
        />
      </el-form-item>
      <el-form-item label="联系人" :error="fieldErrors.contactName">
        <el-input
          id="apply-contactName"
          v-model="draft.contactName"
          maxlength="64"
          placeholder="选填"
          @input="clearError('contactName')"
        />
      </el-form-item>
      <el-form-item label="联系电话" :error="fieldErrors.contactPhone">
        <el-input
          id="apply-contactPhone"
          v-model="draft.contactPhone"
          maxlength="11"
          inputmode="numeric"
          placeholder="选填，11 位手机号；审核通过时用作商家登录手机号"
          @input="clearError('contactPhone')"
        />
      </el-form-item>
      <el-form-item label="拟开门店名" :error="fieldErrors.plannedStoreName">
        <el-input
          id="apply-plannedStoreName"
          v-model="draft.plannedStoreName"
          maxlength="128"
          placeholder="选填，仅供运营参考"
          @input="clearError('plannedStoreName')"
        />
      </el-form-item>
      <el-form-item label="意向地区" :error="fieldErrors.regionId">
        <el-select v-model="draft.regionId" style="width: 18rem" clearable filterable placeholder="选填，启用中的市">
          <el-option
            v-for="city in cities"
            :key="city.id"
            :label="cityTitle(city)"
            :value="city.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="商家/门店介绍" :error="fieldErrors.description">
        <el-input
          id="apply-description"
          v-model="draft.description"
          type="textarea"
          :rows="4"
          maxlength="1000"
          show-word-limit
          placeholder="选填"
          @input="clearError('description')"
        />
      </el-form-item>
      <el-alert v-if="submitError" :title="submitError" type="error" :closable="false" show-icon role="alert" />
      <el-button type="primary" native-type="submit" :loading="submitting">提交申请</el-button>
    </el-form>
  </section>
</template>

<style scoped>
.apply-create-form {
  max-width: 34rem;
}
</style>
