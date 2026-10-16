<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { createArticle, fetchArticle, updateArticle } from '../api/admin'
import { describeAdminError } from '../api/errors'
import { articleErrors, draftFromArticle, type ArticleDraft, type ArticleRecord } from '../api/readers'
import { useAuthStore } from '../stores/auth'
import { leaveIfDisabled, useLoadState } from '../utils/load'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { loading, error, errorKind, run } = useLoadState()
const article = ref<ArticleRecord | null>(null)
const saving = ref(false)
const saveError = ref('')
const titleError = ref('')
const draft = reactive<ArticleDraft>({
  title: '',
  coverUrl: '',
  summary: '',
  body: '',
  status: 'DRAFT',
})

const id = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''))
const creating = computed(() => id.value === 'new')

function applyDraft(next: ArticleRecord) {
  article.value = next
  Object.assign(draft, draftFromArticle(next))
}

async function load() {
  saveError.value = ''
  titleError.value = ''
  if (creating.value) {
    article.value = null
    Object.assign(draft, { title: '', coverUrl: '', summary: '', body: '', status: 'DRAFT' })
    return
  }
  article.value = null
  const outcome = await run((signal) => fetchArticle(id.value, signal))
  if (outcome.status === 'ok') applyDraft(outcome.data)
  if (outcome.status === 'error') await leaveIfDisabled(errorKind.value, auth, router)
}

watch(id, () => void load(), { immediate: true })

async function save(status: ArticleDraft['status']) {
  draft.status = status
  titleError.value = articleErrors(draft).title
  saveError.value = ''
  if (titleError.value) {
    document.getElementById('guide-title')?.focus()
    return
  }
  saving.value = true
  try {
    if (creating.value) {
      const created = await createArticle(draft)
      ElMessage.success(status === 'PUBLISHED' ? '已发布，门户可见' : '已保存')
      await router.replace(`/guides/${created.id}`)
      return
    }
    const updated = await updateArticle(id.value, draft)
    if (updated) applyDraft(updated)
    else await load()
    ElMessage.success(status === 'PUBLISHED' ? '已发布，门户可见' : '已保存')
  } catch (cause) {
    const view = describeAdminError(cause)
    if (await leaveIfDisabled(view.kind, auth, router)) return
    saveError.value = view.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="page-head">
      <h1>{{ creating ? '新建攻略' : '攻略编辑' }}</h1>
      <RouterLink to="/guides">返回列表</RouterLink>
    </div>
    <el-skeleton v-if="loading && !creating" :rows="6" animated />
    <el-empty v-else-if="error" :description="error">
      <el-button @click="load">重试</el-button>
    </el-empty>
    <el-form v-else class="form-narrow" label-position="top" @submit.prevent="save(draft.status)">
      <el-form-item label="标题" :error="titleError" required>
        <el-input id="guide-title" v-model="draft.title" maxlength="200" />
      </el-form-item>
      <el-form-item label="封面">
        <el-input v-model="draft.coverUrl" placeholder="图片地址" />
      </el-form-item>
      <el-form-item label="摘要">
        <el-input v-model="draft.summary" type="textarea" :rows="3" maxlength="500" />
      </el-form-item>
      <el-form-item label="正文">
        <el-input v-model="draft.body" type="textarea" :rows="10" />
      </el-form-item>
      <el-form-item label="发布状态">
        <el-radio-group v-model="draft.status">
          <el-radio value="DRAFT">草稿</el-radio>
          <el-radio value="PUBLISHED">已发布</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-alert v-if="saveError" :title="saveError" type="error" :closable="false" show-icon />
      <div class="actions">
        <el-button native-type="submit" :loading="saving">保存</el-button>
        <el-button type="primary" :loading="saving" @click="save('PUBLISHED')">发布</el-button>
        <el-button v-if="!creating && article?.status === 'PUBLISHED'" :loading="saving" @click="save('DRAFT')">下线</el-button>
      </div>
    </el-form>
  </section>
</template>
