<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  labelOf,
  LISTING_STATE_LABEL,
  STORE_STATUS_LABEL,
  type Region,
  type StorePackage,
} from '@nongjiale/shared'
import * as api from '../api'
import { ApiError } from '../utils/http'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isNew = computed(() => route.name === 'store-new')
const storeId = computed(() => route.params.id as string)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const packageError = ref('')
const tagError = ref('')
const regions = ref<Region[]>([])
const packages = ref<StorePackage[]>([])
const tags = ref<string[]>([])
const tagDraft = ref('')

const form = reactive({
  name: '',
  regionId: undefined as number | undefined,
  address: '',
  phone: '',
  summary: '',
  coverUrl: '',
  galleryText: '',
  facilities: '',
  notice: '',
  traffic: '',
  surroundings: '',
  version: 0,
  status: '',
  listingStatus: '',
  priceFrom: undefined as number | undefined,
  salesCount: undefined as number | undefined,
  merchantId: undefined as number | undefined,
})

const pkgVisible = ref(false)
const pkgSaving = ref(false)
const pkgForm = reactive({
  id: 0,
  name: '',
  description: '',
  priceFrom: 0,
  sortOrder: 0,
})

function fillStore(store: Awaited<ReturnType<typeof api.fetchStore>>) {
  form.name = store.name || ''
  form.regionId = store.regionId
  form.address = store.address || ''
  form.phone = store.phone || ''
  form.summary = store.summary || ''
  form.coverUrl = store.coverUrl || ''
  form.galleryText = Array.isArray(store.gallery) ? store.gallery.join('\n') : ''
  form.facilities = store.facilities || ''
  form.notice = store.notice || ''
  form.traffic = store.traffic || ''
  form.surroundings = store.surroundings || ''
  form.version = store.version
  form.status = store.status || ''
  form.listingStatus = store.listingStatus || ''
  form.priceFrom = store.priceFrom
  form.salesCount = store.salesCount
  form.merchantId = store.merchantId
}

function payload() {
  return {
    name: form.name.trim(),
    regionId: Number(form.regionId),
    address: form.address.trim(),
    phone: form.phone.trim(),
    summary: form.summary.trim(),
    coverUrl: form.coverUrl.trim() || null,
    gallery: form.galleryText.split('\n').map((line) => line.trim()).filter(Boolean),
    facilities: form.facilities.trim(),
    notice: form.notice.trim(),
    traffic: form.traffic.trim(),
    surroundings: form.surroundings.trim(),
    version: isNew.value ? undefined : form.version,
  }
}

async function loadRegions() {
  try {
    const data = await api.fetchRegions()
    regions.value = Array.isArray(data) ? data : []
  } catch (e) {
    regions.value = []
    ElMessage.error(e instanceof Error ? e.message : '地区加载失败')
  }
}

async function loadPackages() {
  packageError.value = ''
  try {
    const data = await api.fetchPackages(auth.token!, storeId.value)
    packages.value = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []
  } catch (e) {
    packages.value = []
    packageError.value = e instanceof Error ? e.message : '套餐加载失败'
  }
}

async function loadTags() {
  tagError.value = ''
  try {
    const data = await api.fetchTags(auth.token!, storeId.value)
    tags.value = Array.isArray(data?.tags) ? data.tags : []
  } catch (e) {
    tags.value = []
    tagError.value = e instanceof Error ? e.message : '标签加载失败'
  }
}

async function load() {
  loading.value = true
  error.value = ''
  await loadRegions()
  if (isNew.value) {
    loading.value = false
    return
  }
  try {
    const store = await api.fetchStore(auth.token!, storeId.value)
    fillStore(store)
    await Promise.all([loadPackages(), loadTags()])
  } catch (e) {
    error.value = e instanceof ApiError && e.httpStatus === 404
      ? '门店不存在或不属于当前商家'
      : (e instanceof Error ? e.message : '加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!form.name.trim() || !form.regionId) {
    ElMessage.warning('请填写门店名称和地区')
    return
  }
  saving.value = true
  try {
    if (isNew.value) {
      const created = await api.createStore(auth.token!, payload())
      ElMessage.success('已创建草稿，游客仍不可订')
      if (created?.id) router.replace(`/stores/${created.id}`)
      else router.replace('/stores')
      return
    }
    const updated = await api.updateStore(auth.token!, storeId.value, payload())
    if (updated) fillStore(updated)
    ElMessage.success('资料已保存。游客是否可订仍取决于上架审核')
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 409) {
      ElMessage.error(e.message || '数据已更新，请刷新')
      await load()
    } else {
      ElMessage.error(e instanceof Error ? e.message : '保存失败')
    }
  } finally {
    saving.value = false
  }
}

function openPackage(row?: StorePackage) {
  pkgForm.id = row?.id || 0
  pkgForm.name = row?.name || ''
  pkgForm.description = row?.description || ''
  pkgForm.priceFrom = row?.priceFrom ?? 0
  pkgForm.sortOrder = row?.sortOrder ?? 0
  pkgVisible.value = true
}

async function savePackage() {
  if (!pkgForm.name.trim()) {
    ElMessage.warning('请填写套餐名称')
    return
  }
  pkgSaving.value = true
  const body = {
    name: pkgForm.name.trim(),
    description: pkgForm.description.trim(),
    priceFrom: Number(pkgForm.priceFrom) || 0,
    sortOrder: Number(pkgForm.sortOrder) || 0,
  }
  try {
    if (pkgForm.id) await api.updatePackage(auth.token!, storeId.value, pkgForm.id, body)
    else await api.createPackage(auth.token!, storeId.value, body)
    pkgVisible.value = false
    ElMessage.success('套餐已保存')
    await loadPackages()
    const store = await api.fetchStore(auth.token!, storeId.value)
    form.priceFrom = store.priceFrom
    form.version = store.version
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '套餐保存失败')
  } finally {
    pkgSaving.value = false
  }
}

async function removePackage(row: StorePackage) {
  try {
    await api.deletePackage(auth.token!, storeId.value, row.id)
    ElMessage.success('已删除套餐')
    await loadPackages()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}

function addTag() {
  const value = tagDraft.value.trim()
  if (!value) return
  if (!tags.value.includes(value)) tags.value = [...tags.value, value]
  tagDraft.value = ''
}

function removeTag(tag: string) {
  tags.value = tags.value.filter((item) => item !== tag)
}

async function saveTags() {
  try {
    const data = await api.replaceTags(auth.token!, storeId.value, tags.value)
    tags.value = Array.isArray(data?.tags) ? data.tags : tags.value
    ElMessage.success('标签已保存')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '标签保存失败')
  }
}

onMounted(load)
</script>

<template>
  <div v-loading="loading">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <h2>{{ isNew ? '新建门店' : '编辑门店' }}</h2>
      <el-button @click="router.push('/stores')">返回列表</el-button>
    </div>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <template v-else>
      <p v-if="!isNew" style="color:#666">
        对客状态：{{ labelOf(STORE_STATUS_LABEL, form.status) }}
        · 申请态：{{ labelOf(LISTING_STATE_LABEL, form.listingStatus) }}
        · 起价 {{ form.priceFrom ?? '—' }}（由套餐汇总，不能手改）
        · 销量 {{ form.salesCount ?? '—' }}
        · 主体 {{ form.merchantId ?? auth.profile?.merchantId ?? '—' }}
      </p>
      <el-tabs>
        <el-tab-pane label="基础">
          <el-form label-width="88px" style="max-width:640px" @submit.prevent="save">
            <el-form-item label="名称" required>
              <el-input v-model="form.name" />
            </el-form-item>
            <el-form-item label="地区" required>
              <el-select v-model="form.regionId" placeholder="选择地区" style="width:100%">
                <el-option v-for="region in regions" :key="region.id" :label="region.name" :value="region.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="地址">
              <el-input v-model="form.address" />
            </el-form-item>
            <el-form-item label="电话">
              <el-input v-model="form.phone" />
            </el-form-item>
            <el-form-item label="简介">
              <el-input v-model="form.summary" type="textarea" :rows="4" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="图集">
          <el-form label-width="88px" style="max-width:640px">
            <el-form-item label="封面 URL">
              <el-input v-model="form.coverUrl" placeholder="https://" />
            </el-form-item>
            <el-form-item label="图集 URL">
              <el-input v-model="form.galleryText" type="textarea" :rows="6" placeholder="每行一个图片 URL" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="套餐" :disabled="isNew">
          <el-alert v-if="isNew" title="请先保存门店，再维护套餐" type="info" show-icon />
          <template v-else>
            <el-alert v-if="packageError" :title="packageError" type="error" show-icon style="margin-bottom:12px">
              <el-button size="small" @click="loadPackages">重试</el-button>
            </el-alert>
            <el-button type="primary" @click="openPackage()">新建套餐</el-button>
            <el-table :data="packages" stripe style="margin-top:12px">
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="priceFrom" label="价格" width="120" />
              <el-table-column prop="sortOrder" label="排序" width="80" />
              <el-table-column prop="description" label="说明" />
              <el-table-column label="操作" width="160">
                <template #default="{ row }">
                  <el-button size="small" @click="openPackage(row)">编辑</el-button>
                  <el-button size="small" type="danger" plain @click="removePackage(row)">删除</el-button>
                </template>
              </el-table-column>
              <template #empty>
                <el-empty description="暂无套餐" />
              </template>
            </el-table>
          </template>
        </el-tab-pane>
        <el-tab-pane label="标签" :disabled="isNew">
          <el-alert v-if="tagError" :title="tagError" type="error" show-icon style="margin-bottom:12px">
            <el-button size="small" @click="loadTags">重试</el-button>
          </el-alert>
          <div style="display:flex;gap:8px;margin-bottom:12px;max-width:480px">
            <el-input v-model="tagDraft" placeholder="输入标签后添加" @keyup.enter="addTag" />
            <el-button @click="addTag">添加</el-button>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            <el-tag v-for="tag in tags" :key="tag" closable @close="removeTag(tag)">{{ tag }}</el-tag>
            <span v-if="!tags.length" style="color:#999">暂无标签</span>
          </div>
          <el-button type="primary" :disabled="isNew" @click="saveTags">保存标签</el-button>
        </el-tab-pane>
        <el-tab-pane label="交通/须知/周边">
          <el-form label-width="88px" style="max-width:640px">
            <el-form-item label="设施">
              <el-input v-model="form.facilities" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="须知">
              <el-input v-model="form.notice" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="交通">
              <el-input v-model="form.traffic" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="周边">
              <el-input v-model="form.surroundings" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <div style="margin-top:16px;display:flex;gap:8px">
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        <el-button v-if="!isNew" @click="router.push({ path: '/listing-applications', query: { storeId } })">
          提交上下架申请
        </el-button>
      </div>
    </template>

    <el-dialog v-model="pkgVisible" :title="pkgForm.id ? '编辑套餐' : '新建套餐'" width="480px">
      <el-form label-width="72px">
        <el-form-item label="名称">
          <el-input v-model="pkgForm.name" />
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="pkgForm.priceFrom" :min="0" :step="10" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="pkgForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="pkgForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pkgVisible = false">取消</el-button>
        <el-button type="primary" :loading="pkgSaving" @click="savePackage">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
