<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { describePortalError } from '../api/errors'
import { fetchRegions, submitMerchantApply } from '../api/portal'
import type { RegionItem } from '../api/readers'
import { buildMerchantApplyBody, type ApplyErrors } from '../domain/apply'
import { orderRegions } from '../domain/filters'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const regions = ref<RegionItem[]>([])
const regionNote = ref('')
const errors = reactive<ApplyErrors>({})
const formError = ref('')
const submitting = ref(false)
const succeeded = ref(false)
const licenseName = ref('')
const form = reactive({
  subjectName: '',
  contactName: '',
  contactPhone: '',
  storeName: '',
  regionId: '',
  remark: '',
})

const ordered = () => orderRegions(regions.value)

function onLicense(event: Event) {
  const input = event.target
  if (!(input instanceof HTMLInputElement)) return
  licenseName.value = input.files?.[0]?.name ?? ''
}

async function onSubmit() {
  formError.value = ''
  const result = buildMerchantApplyBody(form)
  Object.keys(errors).forEach((key) => delete errors[key as keyof ApplyErrors])
  Object.assign(errors, result.errors)
  if (!result.body) {
    const first = (['subjectName', 'contactName', 'contactPhone', 'storeName', 'regionId', 'remark'] as const).find(
      (key) => errors[key],
    )
    if (first) document.getElementById(`apply-${first}`)?.focus()
    return
  }
  submitting.value = true
  try {
    await submitMerchantApply(result.body)
    succeeded.value = true
  } catch (cause) {
    formError.value = describePortalError(cause).message
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (auth.isAuthenticated && !auth.phone) await auth.refreshProfile()
  if (auth.phone && !form.contactPhone) form.contactPhone = auth.phone
  try {
    regions.value = await fetchRegions()
    if (!regions.value.length) regionNote.value = '暂无地区，仍可在说明里写明所在地'
  } catch {
    regionNote.value = '地区加载失败，请稍后重试'
  }
})
</script>

<template>
  <section class="stack">
    <div v-if="succeeded" class="panel stack">
      <h1>审核中</h1>
      <p class="body-large">提交后将由运营审核。通过后开通商家账号，您将使用登记手机登录商家端。</p>
      <p class="muted">不承诺上架时间。未审核通过前不能进入商家端。</p>
      <p v-if="licenseName" class="muted">已选择证照文件「{{ licenseName }}」。当前接口只接收文字字段，图片需运营人工另行核验，本次没有上传文件。</p>
      <RouterLink class="btn btn-primary" to="/">返回首页</RouterLink>
    </div>
    <form v-else class="panel stack" novalidate @submit.prevent="onSubmit">
      <div class="page-head">
        <h1>商家入驻申请</h1>
        <p class="lede">提交后将由运营审核。通过后开通商家账号，您将使用登记手机登录商家端。</p>
      </div>
      <div class="form-grid">
      <label class="field">
        <span>主体名称 *</span>
        <input id="apply-subjectName" v-model="form.subjectName" type="text" maxlength="64" />
        <small v-if="errors.subjectName">{{ errors.subjectName }}</small>
      </label>
      <label class="field">
        <span>联系人 *</span>
        <input id="apply-contactName" v-model="form.contactName" type="text" maxlength="64" autocomplete="name" />
        <small v-if="errors.contactName">{{ errors.contactName }}</small>
      </label>
      <label class="field">
        <span>手机 *</span>
        <input id="apply-contactPhone" v-model="form.contactPhone" type="tel" maxlength="11" autocomplete="tel" />
        <small v-if="errors.contactPhone">{{ errors.contactPhone }}</small>
      </label>
      <label class="field">
        <span>拟营门店名 *</span>
        <input id="apply-storeName" v-model="form.storeName" type="text" maxlength="64" />
        <small v-if="errors.storeName">{{ errors.storeName }}</small>
      </label>
      <label class="field">
        <span>地区 *</span>
        <select id="apply-regionId" v-model="form.regionId">
          <option value="">请选择</option>
          <option v-for="region in ordered()" :key="region.id" :value="String(region.id)">
            {{ region.parentId ? `－ ${region.name}` : region.name }}
          </option>
        </select>
        <small v-if="errors.regionId">{{ errors.regionId }}</small>
        <small v-else-if="regionNote" class="muted">{{ regionNote }}</small>
      </label>
      <label class="field">
        <span>说明</span>
        <textarea id="apply-remark" v-model="form.remark" rows="4" maxlength="500"></textarea>
        <small v-if="errors.remark">{{ errors.remark }}</small>
      </label>
      <label class="field">
        <span>证照图片</span>
        <input type="file" accept="image/*" @change="onLicense" />
        <small class="muted">人工审核用。入驻接口当前按 JSON 提交文字，选择文件不会当作已上传。</small>
      </label>
      </div>
      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <button class="btn btn-primary btn-lg" type="submit" :disabled="submitting">
        {{ submitting ? '提交中…' : '提交申请' }}
      </button>
    </form>
  </section>
</template>
