import type { Router } from 'vue-router'
import { ref } from 'vue'
import { describeAdminError, type AdminErrorKind } from '../api/errors'

export type LoadOutcome<T> = { status: 'ok'; data: T } | { status: 'aborted' } | { status: 'error' }

export function useLoadState() {
  const loading = ref(false)
  const error = ref('')
  const errorKind = ref<AdminErrorKind | ''>('')
  let current: AbortController | null = null

  async function run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<LoadOutcome<T>> {
    current?.abort()
    const controller = new AbortController()
    current = controller
    loading.value = true
    error.value = ''
    errorKind.value = ''
    try {
      const data = await task(controller.signal)
      if (controller.signal.aborted) return { status: 'aborted' }
      return { status: 'ok', data }
    } catch (cause) {
      if (controller.signal.aborted) return { status: 'aborted' }
      const view = describeAdminError(cause)
      error.value = view.message
      errorKind.value = view.kind
      return { status: 'error' }
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  }

  return { loading, error, errorKind, run }
}

export async function leaveIfDisabled(
  kind: AdminErrorKind | '',
  auth: { logout: () => void },
  router: Router,
): Promise<boolean> {
  if (kind !== 'disabled') return false
  auth.logout()
  await router.replace({ path: '/login', query: { disabled: '1' } })
  return true
}
