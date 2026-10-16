<script setup lang="ts">
import type { PageResult } from '@nongjiale/shared'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { deleteArticle, fetchArticles } from '../api/admin'
import { describeAdminError } from '../api/errors'
import { articleStatusLabel, pageFromQuery, type ArticleRecord } from '../api/readers'
import { EMPTY_GUIDES } from '../domain/copy'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const result = ref<PageResult<ArticleRecord> | null>(null)
const actionError = ref('')
const deletingId = ref('')

const page = computed(() => pageFromQuery(route.query.page))

async function load() {
  const outcome = await run((signal) => fetchArticles(page.value, signal))
  if (outcome.status === 'ok') result.value = outcome.data
  if (outcome.status === 'error') {
    result.value = null
    await leaveIfDisabled(errorKind.value, auth, router)
  }
}

function changePage(next: number) {
  void router.push(next <= 1 ? '/guides' : { path: '/guides', query: { page: String(next) } })
}

watch(page, () => void load(), { immediate: true })

async function onDelete(row: ArticleRecord) {
  try {
    await ElMessageBox.confirm('删除后门户将不再展示该攻略。', '删除攻略', { type: 'warning' })
  } catch {
    return
  }
  deletingId.value = row.id
  actionError.value = ''
  try {
    await deleteArticle(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    actionError.value = view.message
  } finally {
    deletingId.value = ''
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h1>攻略</h1>
        <p class="hint">发布后出现在门户列表和详情。没有评论。</p>
      </div>
      <RouterLink to="/guides/new">新建</RouterLink>
    </div>
    <el-alert v-if="actionError" :title="actionError" type="error" :closable="false" show-icon />
    <el-skeleton v-if="loading" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-empty v-else-if="!result?.items.length" :description="EMPTY_GUIDES">
      <RouterLink to="/guides/new">新建攻略</RouterLink>
    </el-empty>
    <template v-else>
      <div class="table-wrap">
        <el-table :data="result.items" row-key="id">
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'info'">{{ articleStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" min-width="160">
            <template #default="{ row }">{{ row.updatedAt || '—' }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="140" fixed="right">
            <template #default="{ row }">
              <div class="actions">
                <RouterLink :to="`/guides/${row.id}`">编辑</RouterLink>
                <el-button text type="danger" :loading="deletingId === row.id" @click="onDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-pagination
        v-if="result.total > result.pageSize"
        layout="prev, pager, next"
        :total="result.total"
        :page-size="result.pageSize"
        :current-page="result.page || page"
        @current-change="changePage"
      />
    </template>
  </section>
</template>
