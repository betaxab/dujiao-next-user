import { reactive, ref } from 'vue'
import {
  resellerAPI,
  type ResellerOrderData,
  type ResellerOrderDetailData,
  type ResellerOrderListParams,
  type ResellerOrderStatsData,
} from '../../api'

export const useResellerOrders = () => {
  const loading = ref(false)
  const detailLoading = ref(false)
  const rows = ref<ResellerOrderData[]>([])
  const detail = ref<ResellerOrderDetailData | null>(null)
  const stats = ref<ResellerOrderStatsData | null>(null)
  const pagination = reactive({ page: 1, page_size: 20, total: 0, total_page: 1 })

  const load = async (params: ResellerOrderListParams = {}) => {
    loading.value = true
    try {
      const response = await resellerAPI.orders({ page: pagination.page, page_size: pagination.page_size, ...params })
      rows.value = response.data.data || []
      Object.assign(pagination, response.data.pagination || pagination)
    } finally {
      loading.value = false
    }
  }

  const loadStats = async (params: ResellerOrderListParams = {}) => {
    const response = await resellerAPI.orderStats(params)
    stats.value = response.data.data || null
  }

  const loadDetail = async (orderNo: string) => {
    detailLoading.value = true
    try {
      const response = await resellerAPI.orderDetail(orderNo)
      detail.value = response.data.data || null
    } finally {
      detailLoading.value = false
    }
  }

  return { loading, detailLoading, rows, detail, stats, pagination, load, loadStats, loadDetail }
}
