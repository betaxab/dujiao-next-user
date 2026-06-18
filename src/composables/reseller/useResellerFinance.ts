import { reactive, ref } from 'vue'
import {
  resellerAPI,
  type ResellerBalanceData,
  type ResellerDashboardData,
  type ResellerLedgerData,
  type ResellerWithdrawApplyPayload,
  type ResellerWithdrawData,
} from '../../api'

export type ResellerFinanceListParams = {
  page?: number
  page_size?: number
  currency?: string
  type?: string
  status?: string
  order_id?: number
}

export const useResellerFinance = () => {
  const dashboardLoading = ref(false)
  const balanceLoading = ref(false)
  const ledgerLoading = ref(false)
  const withdrawsLoading = ref(false)
  const submittingWithdraw = ref(false)
  const dashboard = ref<ResellerDashboardData | null>(null)
  const balances = ref<ResellerBalanceData[]>([])
  const ledgerEntries = ref<ResellerLedgerData[]>([])
  const withdraws = ref<ResellerWithdrawData[]>([])
  const ledgerPagination = reactive({ page: 1, page_size: 20, total: 0, total_page: 1 })
  const withdrawsPagination = reactive({ page: 1, page_size: 20, total: 0, total_page: 1 })

  const loadDashboard = async () => {
    dashboardLoading.value = true
    try {
      const response = await resellerAPI.dashboard()
      dashboard.value = response.data.data || null
    } finally {
      dashboardLoading.value = false
    }
  }

  const loadBalances = async (params: ResellerFinanceListParams = {}) => {
    balanceLoading.value = true
    try {
      const response = await resellerAPI.balanceAccounts(params)
      balances.value = response.data.data || []
    } finally {
      balanceLoading.value = false
    }
  }

  const loadLedgerEntries = async (params: ResellerFinanceListParams = {}) => {
    ledgerLoading.value = true
    try {
      const response = await resellerAPI.ledgerEntries({
        page: ledgerPagination.page,
        page_size: ledgerPagination.page_size,
        ...params,
      })
      ledgerEntries.value = response.data.data || []
      Object.assign(ledgerPagination, response.data.pagination || ledgerPagination)
    } finally {
      ledgerLoading.value = false
    }
  }

  const loadWithdraws = async (params: ResellerFinanceListParams = {}) => {
    withdrawsLoading.value = true
    try {
      const response = await resellerAPI.withdraws({
        page: withdrawsPagination.page,
        page_size: withdrawsPagination.page_size,
        ...params,
      })
      withdraws.value = response.data.data || []
      Object.assign(withdrawsPagination, response.data.pagination || withdrawsPagination)
    } finally {
      withdrawsLoading.value = false
    }
  }

  const applyWithdraw = async (payload: ResellerWithdrawApplyPayload) => {
    submittingWithdraw.value = true
    try {
      await resellerAPI.applyWithdraw(payload)
      await Promise.all([loadDashboard(), loadBalances(), loadWithdraws({ page: 1 })])
    } finally {
      submittingWithdraw.value = false
    }
  }

  return {
    dashboardLoading,
    balanceLoading,
    ledgerLoading,
    withdrawsLoading,
    submittingWithdraw,
    dashboard,
    balances,
    ledgerEntries,
    withdraws,
    ledgerPagination,
    withdrawsPagination,
    loadDashboard,
    loadBalances,
    loadLedgerEntries,
    loadWithdraws,
    applyWithdraw,
  }
}
