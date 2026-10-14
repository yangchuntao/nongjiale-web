<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { ARTICLE_STATUS_LABEL, labelOf, type Article } from '@nongjiale/shared'
import * as api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const items = ref<Article[]>([])
const total = ref(0)
const page = ref(1)
const status = ref('')
const visible = ref(false)

const form = reactive({
  id: 0,
  title: '',
  coverUrl: '',
  summary: '',
  body: '',
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.fetchArticles(auth.token!, {
      status: status.value || undefined,
      page: page.value,
      pageSize: 20,
    })
    items.value = Array.isArray(data?.items) ? data.items : []
    total.value = typeof data?.total === 'number' ? data.total : items.value.length
  } catch (e) {
    items.value = []
    total.value = 0
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  form.id = 0
  form.title = ''
  form.coverUrl = ''
  form.summary = ''
  form.body = ''
  visible.value = true
}

function openEdit(row: Article) {
  form.id = row.id
  form.title = row.title || ''
  form.coverUrl = row.coverUrl || ''
  form.summary = row.summary || ''
  form.body = row.body || ''
  visible.value = true
}

function payload() {
  return {
    title: form.title.trim(),
    coverUrl: form.coverUrl.trim() || null,
    summary: form.summary.trim(),
    body: form.body,
  }
}

async function save() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  saving.value = true
  try {
    if (form.id) await api.updateArticle(auth.token!, form.id, payload())
    else await api.createArticle(auth.token!, payload())
    ElMessage.success(form.id ? '已保存' : '已创建草稿')
    visible.value = false
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function setStatus(row: Article, next: 'DRAFT' | 'PUBLISHED') {
  try {
    await api.updateArticleStatus(auth.token!, row.id, next)
    ElMessage.success(next === 'PUBLISHED' ? '已发布' : '已转回草稿')
    await load()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '状态更新失败')
  }
}

watch(status, () => {
  page.value = 1
  load()
})

onMounted(load)
</script>

<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h2>资讯 / 攻略</h2>
      <el-button type="primary" @click="openCreate">新建草稿</el-button>
    </div>
    <p style="color:#666">门户只展示已发布内容。这里不做专题、问答。</p>
    <el-select v-model="status" clearable placeholder="全部状态" style="width:160px;margin-bottom:12px">
      <el-option label="草稿" value="DRAFT" />
      <el-option label="已发布" value="PUBLISHED" />
    </el-select>
    <el-alert v-if="error" :title="error" type="error" show-icon style="margin-bottom:12px">
      <el-button size="small" @click="load">重试</el-button>
    </el-alert>
    <el-table :data="items" v-loading="loading" stripe>
      <el-table-column prop="id" label="编号" width="80" />
      <el-table-column prop="title" label="标题" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">{{ labelOf(ARTICLE_STATUS_LABEL, row.status) }}</template>
      </el-table-column>
      <el-table-column prop="publishedAt" label="发布时间" width="180" />
      <el-table-column label="操作" width="240">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="primary" :disabled="row.status === 'PUBLISHED'" @click="setStatus(row, 'PUBLISHED')">发布</el-button>
          <el-button size="small" :disabled="row.status === 'DRAFT'" @click="setStatus(row, 'DRAFT')">转草稿</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无资讯" />
      </template>
    </el-table>
    <div v-if="total > 20" style="margin-top:12px;display:flex;justify-content:flex-end">
      <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="20" v-model:current-page="page" @current-change="load" />
    </div>

    <el-dialog v-model="visible" :title="form.id ? '编辑资讯' : '新建资讯'" width="640px">
      <el-form label-width="72px">
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="form.coverUrl" placeholder="图片 URL，可空" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="正文">
          <el-input v-model="form.body" type="textarea" :rows="8" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
