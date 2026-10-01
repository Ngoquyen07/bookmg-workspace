import { onMounted, onScopeDispose, shallowRef } from 'vue'
import { dashboardApi } from '../api/dashboardApi.js'

export function useDashboard() {
  const dashboard = shallowRef(null)
  const loading = shallowRef(false)
  const error = shallowRef('')
  let requestId = 0

  async function refresh() {
    const id = ++requestId
    loading.value = true
    error.value = ''
    try {
      const result = await dashboardApi.get()
      if (id === requestId) dashboard.value = result.data
    } catch (cause) {
      if (id === requestId) error.value = cause.message
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  onMounted(refresh)
  onScopeDispose(() => { requestId++ })
  return { dashboard, loading, error, refresh }
}
