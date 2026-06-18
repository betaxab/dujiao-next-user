import type { BadgeTone } from './status'

type ResellerWithdrawState = {
  withdraw_enabled?: boolean
}

type ResellerFinanceProfile = {
  status?: string
  settlement_status?: string
}

type ResellerFinanceStatusNamespace = 'profileStatusMap' | 'settlementStatusMap'

export type ResellerFinanceStatusView = {
  namespace: ResellerFinanceStatusNamespace
  key: string
  badgeTone: BadgeTone
}

const PROFILE_STATUS_ACTIVE = 'active'
const PROFILE_STATUS_PENDING_REVIEW = 'pending_review'

const profileStatusKeyMap: Record<string, string> = {
  pending_review: 'pendingReview',
  active: 'active',
  rejected: 'rejected',
  disabled: 'disabled',
}

const settlementStatusKeyMap: Record<string, string> = {
  normal: 'normal',
  frozen: 'frozen',
  frozen_review: 'frozen',
  disabled: 'disabled',
}

const withdrawDisabledReasonKeyMap: Record<string, string> = {
  profile_inactive: 'profileInactive',
  settlement_unavailable: 'settlementUnavailable',
}

const ledgerTypeKeyMap: Record<string, string> = {
  order_profit: 'orderProfit',
  refund_deduct: 'refundDeduct',
  withdraw_lock: 'withdrawLock',
  manual_adjust: 'manualAdjust',
  withdraw_paid: 'withdrawPaid',
}

export const isResellerWithdrawEnabled = (dashboard?: ResellerWithdrawState | null) => dashboard?.withdraw_enabled === true

export const getResellerWithdrawDisabledReasonKey = (reason?: string) => {
  if (!reason) return 'default'
  return withdrawDisabledReasonKeyMap[reason] || 'default'
}

export const getResellerFinanceStatusView = (profile?: ResellerFinanceProfile | null): ResellerFinanceStatusView => {
  if (!profile) {
    return {
      namespace: 'profileStatusMap',
      key: 'unknown',
      badgeTone: 'neutral',
    }
  }

  const profileStatus = profile?.status || ''
  if (profileStatus && profileStatus !== PROFILE_STATUS_ACTIVE) {
    return {
      namespace: 'profileStatusMap',
      key: profileStatusKeyMap[profileStatus] || profileStatus,
      badgeTone: profileStatus === PROFILE_STATUS_PENDING_REVIEW ? 'warning' : 'neutral',
    }
  }

  const settlementStatus = profile?.settlement_status || ''
  return {
    namespace: 'settlementStatusMap',
    key: settlementStatusKeyMap[settlementStatus] || settlementStatus || 'unknown',
    badgeTone: settlementStatus === 'normal' ? 'success' : 'warning',
  }
}

export const getResellerLedgerTypeKey = (type?: string) => {
  if (!type) return null
  return ledgerTypeKeyMap[type] || null
}
