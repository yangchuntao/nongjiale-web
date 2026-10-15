<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { REVIEW_STATUS_LABEL, labelOf, merchantApplicationId, type MerchantApplication, type Region } from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const regions = ref<Region[]>([])
const regionError = ref('')
const mine = ref<MerchantApplication | null>(null)
const mineError = ref('')
const imageUrls = ref<string[]>([])
const uploading = ref(false)
const submitting = ref(false)
const error = ref('')
const createdId = ref<number | null>(null)

const form = reactive({
  subjectName: '',
  contactName: '',
  phone: '',
  proposedStoreName: '',
  regionId: '' as number | '',
  description: '',
  licenseText: '',
})

const locked = computed(() => mine.value?.status === 'PENDING' || mine.value?.status === 'APPROVED' || createdId.value != null)

async function loadRegions() {
  regionError.value = ''
  try {
    const data = await api.fetchRegions()
    regions.value = Array.isArray(data) ? data : []
  } catch (e) {
    regions.value = []
    regionError.value = e instanceof Error ? e.message : '地区加载失败'
  }
}

async function loadMine() {
  mineError.value = ''
  if (!auth.token) {
    mine.value = null
    return
  }
  try {
    mine.value = await api.fetchMyMerchantApplication(auth.token)
  } catch (e) {
    mine.value = null
    if (e instanceof ApiError && e.httpStatus === 404) return
    mineError.value = e instanceof Error ? e.message : '无法读取入驻进度'
  }
}

function removeImage(url: string) {
  imageUrls.value = imageUrls.value.filter((item) => item !== url)
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = '证照请上传图片'
    return
  }
  uploading.value = true
  error.value = ''
  try {
    const data = await api.uploadMerchantMedia(file, auth.token)
    if (!data?.url) throw new Error('上传成功但没有返回图片地址')
    imageUrls.value.push(data.url)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '上传失败'
  } finally {
    uploading.value = false
  }
}

async function submit() {
  error.value = ''
  if (!form.subjectName.trim() || !form.contactName.trim() || !form.phone.trim() || !form.proposedStoreName.trim() || !form.regionId) {
    error.value = '请填写主体名称、联系人、手机、拟营门店和地区'
    return
  }
  submitting.value = true
  try {
    const data = await api.createMerchantApplication({
      subjectName: form.subjectName.trim(),
      contactName: form.contactName.trim(),
      phone: form.phone.trim(),
      proposedStoreName: form.proposedStoreName.trim(),
      regionId: Number(form.regionId),
      description: form.description.trim() || undefined,
      licenseText: form.licenseText.trim() || undefined,
      licenseImageUrls: imageUrls.value.length ? imageUrls.value : undefined,
    }, auth.token)
    createdId.value = data?.applicationId ?? null
    await loadMine()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '提交失败'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (auth.user?.phone) form.phone = auth.user.phone
  if (auth.user?.displayName) form.contactName = auth.user.displayName
  await Promise.all([loadRegions(), loadMine()])
})
</script>

<template>
  <section class="card" style="max-width:640px;margin:0 auto">
    <h1 class="page-title">商家入驻申请</h1>
    <p class="muted">提交后不会立刻成为商家。审核通过后由运营开通账号，首次登录需要改密。</p>

    <p v-if="mineError" class="error">
      {{ mineError }}
      <button class="btn secondary" type="button" @click="loadMine">重试</button>
    </p>

    <div v-if="mine || createdId" class="card">
      <p><strong>最近申请：</strong>{{ labelOf(REVIEW_STATUS_LABEL, mine?.status || (createdId ? 'PENDING' : '')) }}</p>
      <p v-if="merchantApplicationId(mine) || createdId" class="muted">编号 {{ merchantApplicationId(mine) || createdId }}</p>
      <p v-if="mine?.rejectReason" class="error">驳回原因：{{ mine.rejectReason }}</p>
      <p v-if="mine?.status === 'PENDING' || createdId">已提交，等待审核。审核通过后将开通商家账号。</p>
      <p v-else-if="mine?.status === 'APPROVED'">已入驻。请使用运营开通的商家账号登录商家中心。</p>
      <p v-else-if="mine?.status === 'REJECTED'" class="muted">可以修改资料后重新提交一条新申请。</p>
    </div>

    <p v-if="regionError" class="error">
      {{ regionError }}
      <button class="btn secondary" type="button" @click="loadRegions">重试</button>
    </p>

    <form v-if="!locked" @submit.prevent="submit">
      <div class="field">
        <label for="subjectName">主体名称</label>
        <input id="subjectName" v-model="form.subjectName" required />
      </div>
      <div class="field">
        <label for="contactName">联系人</label>
        <input id="contactName" v-model="form.contactName" required />
      </div>
      <div class="field">
        <label for="phone">手机</label>
        <input id="phone" v-model="form.phone" required />
      </div>
      <div class="field">
        <label for="proposedStoreName">拟营门店名</label>
        <input id="proposedStoreName" v-model="form.proposedStoreName" required />
      </div>
      <div class="field">
        <label for="regionId">地区</label>
        <select id="regionId" v-model="form.regionId" required>
          <option disabled value="">请选择地区</option>
          <option v-for="region in regions" :key="region.id" :value="region.id">{{ region.name }}</option>
        </select>
      </div>
      <div class="field">
        <label for="description">说明</label>
        <textarea id="description" v-model="form.description" rows="4" />
      </div>
      <div class="field">
        <label for="licenseText">证照说明</label>
        <textarea id="licenseText" v-model="form.licenseText" rows="3" placeholder="可先填写证照文本" />
      </div>
      <div class="field">
        <label for="licenseFile">证照图片</label>
        <input id="licenseFile" type="file" accept="image/*" :disabled="uploading" @change="onFile" />
        <p v-if="uploading" class="muted">上传中…</p>
        <ul>
          <li v-for="url in imageUrls" :key="url">
            <a :href="url" target="_blank" rel="noreferrer">{{ url }}</a>
            <button class="linkish" type="button" @click="removeImage(url)">移除</button>
          </li>
        </ul>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="btn block" type="submit" :disabled="submitting || uploading">
        {{ submitting ? '提交中…' : '提交入驻申请' }}
      </button>
    </form>
    <p v-else-if="error" class="error">{{ error }}</p>
  </section>
</template>
