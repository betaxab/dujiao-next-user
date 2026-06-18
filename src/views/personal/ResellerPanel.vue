<template>
  <div class="space-y-6">
    <Alert v-if="panelAlert" :variant="pageAlertVariant(panelAlert.level)" :class="pageAlertToneClass(panelAlert.level)">
      <AlertDescription>{{ panelAlert.message }}</AlertDescription>
    </Alert>

    <div class="rounded-2xl border bg-card p-7 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-xl font-bold text-foreground">{{ t('personalCenter.reseller.managementTitle') }}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{{ t('personalCenter.reseller.managementSubtitle') }}</p>
        </div>
        <Badge v-if="!managementLoading" :variant="managementStatusVariant" size="sm">
          {{ managementStatusText }}
        </Badge>
      </div>

      <div v-if="managementLoading" class="space-y-3">
        <div v-for="idx in 3" :key="`management-${idx}`" class="h-16 animate-pulse rounded-xl border bg-muted"></div>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="rounded-xl border bg-secondary p-4">
            <div class="text-xs text-muted-foreground">{{ t('personalCenter.reseller.managementStatusLabel') }}</div>
            <div class="mt-2 text-base font-bold text-foreground">{{ managementStatusText }}</div>
          </div>
          <div class="rounded-xl border bg-secondary p-4">
            <div class="text-xs text-muted-foreground">{{ t('personalCenter.reseller.markupRange') }}</div>
            <div class="mt-2 text-base font-bold text-foreground">{{ managementMarkupText }}</div>
          </div>
          <div class="rounded-xl border bg-secondary p-4">
            <div class="text-xs text-muted-foreground">{{ t('personalCenter.reseller.domainCount') }}</div>
            <div class="mt-2 text-base font-bold text-foreground">{{ managementDomains.length }}</div>
          </div>
        </div>

        <div v-if="!management?.opened || managementState.canApply" class="mt-5 rounded-xl border bg-secondary p-4">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 class="text-base font-bold text-foreground">
                {{ management?.opened ? t('personalCenter.reseller.reapplyTitle') : t('personalCenter.reseller.applyTitle') }}
              </h3>
              <p class="mt-1 text-sm text-muted-foreground">{{ applyNoticeText }}</p>
              <p v-if="management?.profile?.reject_reason" class="mt-2 text-sm text-red-600 dark:text-red-300">
                {{ t('personalCenter.reseller.rejectReason', { reason: management.profile.reject_reason }) }}
              </p>
            </div>
            <Button
              v-if="managementState.canApply"
              type="button"
              :disabled="submittingApply"
              class="font-bold"
              @click="handleApplyProfile"
            >
              {{ submittingApply ? t('personalCenter.reseller.applying') : t('personalCenter.reseller.applySubmit') }}
            </Button>
          </div>
          <Textarea
            v-if="managementState.canApply"
            v-model="applyForm.reason"
            rows="3"
            class="mt-4"
            :disabled="submittingApply"
            :placeholder="t('personalCenter.reseller.applyReasonPlaceholder')"
          />
        </div>

        <div v-if="managementState.canSubmitDomain" class="mt-5 rounded-xl border bg-secondary p-4">
          <h3 class="text-base font-bold text-foreground">{{ t('personalCenter.reseller.customDomainTitle') }}</h3>
          <form class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]" @submit.prevent="handleSubmitDomain">
            <Input
              v-model="domainForm.domain"
              type="text"
              class="h-11"
              :disabled="submittingDomain"
              :placeholder="t('personalCenter.reseller.customDomainPlaceholder')"
            />
            <Button
              type="submit"
              :disabled="submittingDomain"
              class="h-11 font-bold"
            >
              {{ submittingDomain ? t('personalCenter.reseller.submittingDomain') : t('personalCenter.reseller.submitDomain') }}
            </Button>
          </form>
        </div>

        <div class="mt-5">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-base font-bold text-foreground">{{ t('personalCenter.reseller.domainTitle') }}</h3>
            <Button type="button" variant="secondary" size="sm" @click="loadManagementSnapshot">
              {{ t('orders.filters.refresh') }}
            </Button>
          </div>
          <div v-if="managementDomains.length === 0" class="rounded-xl border border-dashed bg-secondary px-4 py-6 text-sm text-muted-foreground">
            {{ t('personalCenter.reseller.domainEmpty') }}
          </div>
          <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div v-for="item in managementDomains" :key="item.id" class="rounded-xl border bg-secondary p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="break-all font-mono text-sm font-bold text-foreground">{{ item.domain }}</div>
                  <div class="mt-2 flex flex-wrap gap-2 text-xs">
                    <Badge :variant="domainStatusVariant(item.status)" size="sm">
                      {{ domainStatusLabel(item.status) }}
                    </Badge>
                    <Badge :variant="domainVerificationVariant(item.verification_status)" size="sm">
                      {{ domainVerificationLabel(item.verification_status) }}
                    </Badge>
                    <Badge variant="neutral" size="sm">
                      {{ domainTypeLabel(item.type) }}
                    </Badge>
                  </div>
                </div>
                <Badge v-if="item.is_primary" variant="accent" size="sm">
                  {{ t('personalCenter.reseller.primaryDomain') }}
                </Badge>
              </div>
              <div v-if="item.verification_token" class="mt-4 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                <div>{{ t('personalCenter.reseller.verificationToken') }}</div>
                <div class="mt-1 break-all font-mono text-foreground">{{ item.verification_token }}</div>
              </div>
              <div class="mt-4 text-xs text-muted-foreground">
                {{ t('personalCenter.reseller.updatedAt') }} {{ formatDate(item.updated_at) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <ResellerSiteConfigPanel v-if="managementState.canSubmitDomain" />

    <ResellerProductSettingsPanel v-if="management?.opened && management?.profile?.status === RESELLER_PROFILE_STATUS_ACTIVE" />

    <div class="rounded-2xl border bg-card p-7 shadow-sm">
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-xl font-bold text-foreground">{{ t('personalCenter.reseller.title') }}</h2>
          <p class="mt-1 text-sm text-muted-foreground">{{ t('personalCenter.reseller.subtitle') }}</p>
        </div>
        <Badge variant="accent" size="sm">
          {{ t('personalCenter.tabs.reseller') }}
        </Badge>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="idx in 3" :key="idx" class="h-16 animate-pulse rounded-xl border bg-muted"></div>
      </div>

      <template v-else-if="dashboard?.opened">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="rounded-xl border bg-secondary p-4">
            <div class="text-xs text-muted-foreground">{{ t('personalCenter.reseller.primaryAvailable') }}</div>
            <div class="mt-2 text-lg font-bold text-foreground">{{ primaryBalanceText }}</div>
          </div>
          <div class="rounded-xl border bg-secondary p-4">
            <div class="text-xs text-muted-foreground">{{ t('personalCenter.reseller.currencyCount') }}</div>
            <div class="mt-2 text-lg font-bold text-foreground">{{ balances.length }}</div>
          </div>
          <div class="rounded-xl border bg-secondary p-4">
            <div class="text-xs text-muted-foreground">{{ t('personalCenter.reseller.settlementStatus') }}</div>
            <div class="mt-2">
              <Badge :variant="profileStatusVariant" size="sm">
                {{ profileStatusText }}
              </Badge>
            </div>
          </div>
        </div>

        <div class="mt-5">
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-base font-bold text-foreground">{{ t('personalCenter.reseller.balanceTitle') }}</h3>
            <Button type="button" variant="secondary" size="sm" @click="initialize">
              {{ t('orders.filters.refresh') }}
            </Button>
          </div>
          <div v-if="balances.length === 0" class="rounded-xl border border-dashed bg-secondary px-4 py-6 text-sm text-muted-foreground">
            {{ t('personalCenter.reseller.balanceEmpty') }}
          </div>
          <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div v-for="item in balances" :key="item.id" class="rounded-xl border bg-secondary p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-mono text-sm font-bold text-foreground">{{ item.currency }}</div>
                  <div class="mt-2 text-xs text-muted-foreground">{{ t('personalCenter.reseller.availableAmount') }}</div>
                  <div class="mt-1 font-mono text-base font-semibold text-foreground">{{ item.available_amount }}</div>
                </div>
                <Badge :variant="balanceStatusVariant(item.status)" size="sm">
                  {{ balanceStatusLabel(item.status) }}
                </Badge>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div class="text-muted-foreground">{{ t('personalCenter.reseller.lockedAmount') }}</div>
                  <div class="mt-1 font-mono text-muted-foreground">{{ item.locked_amount }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">{{ t('personalCenter.reseller.negativeAmount') }}</div>
                  <div class="mt-1 font-mono text-muted-foreground">{{ item.negative_amount }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="rounded-xl border border-dashed bg-secondary p-5">
        <p class="text-sm text-muted-foreground">{{ t('personalCenter.reseller.notOpened') }}</p>
      </div>
    </div>

    <div v-if="dashboard?.opened" class="rounded-2xl border bg-card p-7 shadow-sm">
      <h3 class="text-lg font-bold text-foreground">{{ t('personalCenter.reseller.withdrawTitle') }}</h3>
      <p class="mt-1 text-sm text-muted-foreground">{{ t('personalCenter.reseller.withdrawSubtitle') }}</p>
      <div
        v-if="!withdrawEnabled"
        class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
      >
        {{ withdrawDisabledReasonText }}
      </div>
      <form class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-5" @submit.prevent="handleApplyWithdraw">
        <div>
          <label class="mb-2 block text-sm font-medium text-muted-foreground">{{ t('personalCenter.reseller.withdrawAmountLabel') }}</label>
          <Input
            v-model="withdrawForm.amount"
            type="text"
            inputmode="decimal"
            class="h-11"
            :disabled="!withdrawEnabled || submittingWithdraw"
            :placeholder="t('personalCenter.reseller.withdrawAmountPlaceholder')"
          />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-muted-foreground">{{ t('personalCenter.reseller.withdrawCurrencyLabel') }}</label>
          <select
            v-if="balanceCurrencies.length > 0"
            v-model="withdrawForm.currency"
            :class="selectClass"
            :disabled="!withdrawEnabled || submittingWithdraw"
          >
            <option value="">{{ t('personalCenter.reseller.withdrawCurrencyPlaceholder') }}</option>
            <option v-for="currency in balanceCurrencies" :key="currency" :value="currency">{{ currency }}</option>
          </select>
          <Input
            v-else
            v-model="withdrawForm.currency"
            type="text"
            class="h-11"
            :disabled="!withdrawEnabled || submittingWithdraw"
            :placeholder="t('personalCenter.reseller.withdrawCurrencyPlaceholder')"
          />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-muted-foreground">{{ t('personalCenter.reseller.withdrawChannelLabel') }}</label>
          <Input
            v-model="withdrawForm.channel"
            type="text"
            class="h-11"
            :disabled="!withdrawEnabled || submittingWithdraw"
            :placeholder="t('personalCenter.reseller.withdrawChannelPlaceholder')"
          />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-muted-foreground">{{ t('personalCenter.reseller.withdrawAccountLabel') }}</label>
          <Input
            v-model="withdrawForm.account"
            type="text"
            class="h-11"
            :disabled="!withdrawEnabled || submittingWithdraw"
            :placeholder="t('personalCenter.reseller.withdrawAccountPlaceholder')"
          />
        </div>
        <div class="flex items-end">
          <Button
            type="submit"
            :disabled="submittingWithdraw || !withdrawEnabled"
            class="h-11 w-full px-5 font-bold"
          >
            {{ submittingWithdraw ? t('personalCenter.reseller.withdrawing') : t('personalCenter.reseller.withdrawSubmit') }}
          </Button>
        </div>
      </form>
    </div>

    <div v-if="dashboard?.opened" class="rounded-2xl border bg-card p-7 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-foreground">{{ t('personalCenter.reseller.ledgerTitle') }}</h3>
        <Button type="button" variant="secondary" size="sm" @click="loadLedgerEntries(ledgerPagination.page)">
          {{ t('orders.filters.refresh') }}
        </Button>
      </div>

      <div v-if="ledgerLoading" class="space-y-3">
        <div v-for="idx in 3" :key="idx" class="h-14 animate-pulse rounded-xl border bg-muted"></div>
      </div>
      <div v-else-if="ledgerEntries.length === 0" class="rounded-xl border border-dashed bg-secondary px-4 py-6 text-sm text-muted-foreground">
        {{ t('personalCenter.reseller.ledgerEmpty') }}
      </div>
      <div v-else class="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow class="bg-muted/50">
              <TableHead class="px-4">{{ t('personalCenter.reseller.ledgerTable.type') }}</TableHead>
              <TableHead class="px-4">{{ t('personalCenter.reseller.ledgerTable.amount') }}</TableHead>
              <TableHead class="px-4">{{ t('personalCenter.reseller.ledgerTable.status') }}</TableHead>
              <TableHead class="px-4">{{ t('personalCenter.reseller.ledgerTable.availableAt') }}</TableHead>
              <TableHead class="px-4">{{ t('personalCenter.reseller.ledgerTable.createdAt') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in ledgerEntries" :key="item.id">
              <TableCell class="px-4 text-xs text-muted-foreground">{{ ledgerTypeLabel(item.type) }}</TableCell>
              <TableCell class="px-4 font-mono text-xs text-foreground">{{ item.amount }} {{ item.currency }}</TableCell>
              <TableCell class="px-4">
                <Badge :variant="ledgerStatusVariant(item.status)" size="sm">
                  {{ ledgerStatusLabel(item.status) }}
                </Badge>
              </TableCell>
              <TableCell class="px-4 text-xs text-muted-foreground">{{ formatDate(item.available_at) }}</TableCell>
              <TableCell class="px-4 text-xs text-muted-foreground">{{ formatDate(item.created_at) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <PaginationNav
        :current-page="ledgerPagination.page"
        :total-pages="ledgerPagination.total_page"
        :loading="ledgerLoading"
        :scroll-top="false"
        @change-page="loadLedgerEntries"
      />
    </div>

    <div v-if="dashboard?.opened" class="rounded-2xl border bg-card p-7 shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-lg font-bold text-foreground">{{ t('personalCenter.reseller.withdrawRecordTitle') }}</h3>
        <Button type="button" variant="secondary" size="sm" @click="loadWithdraws(withdrawsPagination.page)">
          {{ t('orders.filters.refresh') }}
        </Button>
      </div>

      <div v-if="withdrawsLoading" class="space-y-3">
        <div v-for="idx in 3" :key="idx" class="h-14 animate-pulse rounded-xl border bg-muted"></div>
      </div>
      <div v-else-if="withdraws.length === 0" class="rounded-xl border border-dashed bg-secondary px-4 py-6 text-sm text-muted-foreground">
        {{ t('personalCenter.reseller.withdrawEmpty') }}
      </div>
      <div v-else class="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow class="bg-muted/50">
              <TableHead class="px-4">{{ t('personalCenter.reseller.withdrawTable.amount') }}</TableHead>
              <TableHead class="px-4">{{ t('personalCenter.reseller.withdrawTable.channel') }}</TableHead>
              <TableHead class="px-4">{{ t('personalCenter.reseller.withdrawTable.status') }}</TableHead>
              <TableHead class="px-4">{{ t('personalCenter.reseller.withdrawTable.createdAt') }}</TableHead>
              <TableHead class="px-4">{{ t('personalCenter.reseller.withdrawTable.processedAt') }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in withdraws" :key="item.id">
              <TableCell class="px-4 font-mono text-xs text-foreground">{{ item.amount }} {{ item.currency }}</TableCell>
              <TableCell class="px-4 text-xs text-muted-foreground">{{ item.channel }}</TableCell>
              <TableCell class="px-4">
                <Badge :variant="withdrawStatusVariant(item.status)" size="sm">
                  {{ withdrawStatusLabel(item.status) }}
                </Badge>
              </TableCell>
              <TableCell class="px-4 text-xs text-muted-foreground">{{ formatDate(item.created_at) }}</TableCell>
              <TableCell class="px-4 text-xs text-muted-foreground">{{ formatDate(item.processed_at) }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <PaginationNav
        :current-page="withdrawsPagination.page"
        :total-pages="withdrawsPagination.total_page"
        :loading="withdrawsLoading"
        :scroll-top="false"
        @change-page="loadWithdraws"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  resellerAPI,
  type ResellerDashboardData,
  type ResellerDomainData,
  type ResellerLedgerData,
  type ResellerManagementSnapshotData,
  type ResellerWithdrawData,
} from '../../api'
import {
  RESELLER_BALANCE_STATUS_DISABLED,
  RESELLER_BALANCE_STATUS_FROZEN_REVIEW,
  RESELLER_BALANCE_STATUS_NEGATIVE_BALANCE,
  RESELLER_BALANCE_STATUS_NORMAL,
  RESELLER_DOMAIN_STATUS_ACTIVE,
  RESELLER_DOMAIN_STATUS_DISABLED,
  RESELLER_DOMAIN_STATUS_PENDING_REVIEW,
  RESELLER_DOMAIN_TYPE_CUSTOM,
  RESELLER_DOMAIN_TYPE_SUBDOMAIN,
  RESELLER_DOMAIN_VERIFICATION_FAILED,
  RESELLER_DOMAIN_VERIFICATION_PENDING,
  RESELLER_DOMAIN_VERIFICATION_VERIFIED,
  RESELLER_LEDGER_STATUS_AVAILABLE,
  RESELLER_LEDGER_STATUS_CANCELED,
  RESELLER_LEDGER_STATUS_LOCKED,
  RESELLER_LEDGER_STATUS_PENDING_CONFIRM,
  RESELLER_LEDGER_STATUS_WITHDRAWN,
  RESELLER_PROFILE_STATUS_ACTIVE,
  RESELLER_PROFILE_STATUS_DISABLED,
  RESELLER_PROFILE_STATUS_PENDING_REVIEW,
  RESELLER_PROFILE_STATUS_REJECTED,
  RESELLER_WITHDRAW_STATUS_PAID,
  RESELLER_WITHDRAW_STATUS_PENDING,
  RESELLER_WITHDRAW_STATUS_REJECTED,
} from '../../constants/reseller'
import { pageAlertVariant, pageAlertToneClass, type PageAlert } from '../../utils/alerts'
import type { BadgeTone } from '../../utils/status'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import PaginationNav from '../../components/PaginationNav.vue'
import ResellerSiteConfigPanel from '../../components/reseller/ResellerSiteConfigPanel.vue'
import ResellerProductSettingsPanel from './ResellerProductSettingsPanel.vue'
import {
  getResellerFinanceStatusView,
  getResellerLedgerTypeKey,
  getResellerWithdrawDisabledReasonKey,
  isResellerWithdrawEnabled,
} from '../../utils/resellerFinance'
import {
  getResellerDomainStatusKey,
  getResellerManagementState,
  isResellerProfileActive,
} from '../../utils/resellerManagement'

const { t } = useI18n()

// 原生币种 select（含空值占位项）套用 Input 等价 token 样式
const selectClass =
  'h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const loading = ref(true)
const managementLoading = ref(true)
const ledgerLoading = ref(false)
const withdrawsLoading = ref(false)
const submittingApply = ref(false)
const submittingDomain = ref(false)
const submittingWithdraw = ref(false)
const management = ref<ResellerManagementSnapshotData | null>(null)
const dashboard = ref<ResellerDashboardData | null>(null)
const panelAlert = ref<PageAlert | null>(null)

const ledgerEntries = ref<ResellerLedgerData[]>([])
const withdraws = ref<ResellerWithdrawData[]>([])

const ledgerPagination = reactive({
  page: 1,
  page_size: 20,
  total: 0,
  total_page: 1,
})

const withdrawsPagination = reactive({
  page: 1,
  page_size: 20,
  total: 0,
  total_page: 1,
})

const withdrawForm = reactive({
  amount: '',
  currency: '',
  channel: '',
  account: '',
})

const applyForm = reactive({
  reason: '',
})

const domainForm = reactive({
  domain: '',
})

const managementDomains = computed<ResellerDomainData[]>(() => management.value?.domains || [])

const managementState = computed(() => getResellerManagementState(management.value))

const balances = computed(() => dashboard.value?.balances || [])

const balanceCurrencies = computed(() => {
  const values = balances.value.map((item) => item.currency).filter(Boolean)
  return Array.from(new Set(values))
})

const primaryBalanceText = computed(() => {
  const first = balances.value[0]
  if (!first) return '-'
  return `${first.available_amount} ${first.currency}`
})

const withdrawEnabled = computed(() => isResellerWithdrawEnabled(dashboard.value))

const withdrawDisabledReasonText = computed(() => {
  const key = getResellerWithdrawDisabledReasonKey(dashboard.value?.withdraw_disabled_reason)
  return t(`personalCenter.reseller.withdrawDisabledReason.${key}`)
})

const profileStatusView = computed(() => getResellerFinanceStatusView(dashboard.value?.profile))

const profileStatusText = computed(() => {
  const view = profileStatusView.value
  return t(`personalCenter.reseller.${view.namespace}.${view.key}`)
})

const profileStatusVariant = computed<BadgeTone>(() => profileStatusView.value.badgeTone)

const managementStatusText = computed(() => t(`personalCenter.reseller.managementStatus.${managementState.value.statusKey}`))

const managementStatusVariant = computed<BadgeTone>(() => {
  const status = management.value?.profile?.status
  if (status === RESELLER_PROFILE_STATUS_ACTIVE) return 'success'
  if (status === RESELLER_PROFILE_STATUS_PENDING_REVIEW) return 'warning'
  if (status === RESELLER_PROFILE_STATUS_REJECTED) return 'neutral'
  if (status === RESELLER_PROFILE_STATUS_DISABLED) return 'neutral'
  return managementState.value.canApply ? 'info' : 'neutral'
})

const managementMarkupText = computed(() => {
  const profile = management.value?.profile
  if (!profile || !isResellerProfileActive(profile)) return '-'
  return `${profile.default_markup_percent}% / ${profile.max_markup_percent}%`
})

const applyNoticeText = computed(() => {
  if (management.value?.opened && management.value.profile?.status === RESELLER_PROFILE_STATUS_REJECTED) {
    return t('personalCenter.reseller.reapplyNotice')
  }
  if (managementState.value.canApply) {
    return t('personalCenter.reseller.applyNotice')
  }
  return t('personalCenter.reseller.applyUnavailable')
})

const ensureWithdrawCurrency = () => {
  if (withdrawForm.currency || balanceCurrencies.value.length === 0) return
  const firstCurrency = balanceCurrencies.value[0]
  if (firstCurrency) {
    withdrawForm.currency = firstCurrency
  }
}

const formatDate = (raw?: string) => {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString()
}

const loadManagementSnapshot = async () => {
  const response = await resellerAPI.managementProfile()
  management.value = response.data.data || null
}

const loadDashboard = async () => {
  const response = await resellerAPI.dashboard()
  dashboard.value = response.data.data || null
  ensureWithdrawCurrency()
}

const loadLedgerEntries = async (page = 1) => {
  ledgerLoading.value = true
  try {
    const response = await resellerAPI.ledgerEntries({
      page,
      page_size: ledgerPagination.page_size,
    })
    ledgerEntries.value = response.data.data || []
    Object.assign(ledgerPagination, response.data.pagination || ledgerPagination)
  } catch {
    ledgerEntries.value = []
  } finally {
    ledgerLoading.value = false
  }
}

const loadWithdraws = async (page = 1) => {
  withdrawsLoading.value = true
  try {
    const response = await resellerAPI.withdraws({
      page,
      page_size: withdrawsPagination.page_size,
    })
    withdraws.value = response.data.data || []
    Object.assign(withdrawsPagination, response.data.pagination || withdrawsPagination)
  } catch {
    withdraws.value = []
  } finally {
    withdrawsLoading.value = false
  }
}

const reloadOpenedData = async () => {
  if (!dashboard.value?.opened) return
  await Promise.all([loadLedgerEntries(1), loadWithdraws(1)])
}

const initialize = async () => {
  loading.value = true
  managementLoading.value = true
  panelAlert.value = null
  try {
    await Promise.all([loadManagementSnapshot(), loadDashboard()])
    await reloadOpenedData()
  } catch (err: any) {
    management.value = null
    dashboard.value = null
    panelAlert.value = {
      level: 'error',
      message: err?.message || t('personalCenter.reseller.errors.loadFailed'),
    }
  } finally {
    loading.value = false
    managementLoading.value = false
  }
}

const handleApplyProfile = async () => {
  if (!managementState.value.canApply) {
    panelAlert.value = {
      level: 'warning',
      message: t('personalCenter.reseller.errors.applyUnavailable'),
    }
    return
  }

  submittingApply.value = true
  panelAlert.value = null
  try {
    await resellerAPI.apply({
      reason: applyForm.reason.trim(),
    })
    applyForm.reason = ''
    panelAlert.value = {
      level: 'success',
      message: t('personalCenter.reseller.applySuccess'),
    }
    await Promise.all([loadManagementSnapshot(), loadDashboard()])
    await reloadOpenedData()
  } catch (err: any) {
    panelAlert.value = {
      level: 'error',
      message: err?.message || t('personalCenter.reseller.errors.applyFailed'),
    }
  } finally {
    submittingApply.value = false
  }
}

const handleSubmitDomain = async () => {
  panelAlert.value = null
  if (!managementState.value.canSubmitDomain) {
    panelAlert.value = {
      level: 'warning',
      message: t('personalCenter.reseller.errors.domainProfileInactive'),
    }
    return
  }
  if (!domainForm.domain.trim()) {
    panelAlert.value = {
      level: 'warning',
      message: t('personalCenter.reseller.errors.domainRequired'),
    }
    return
  }

  submittingDomain.value = true
  try {
    await resellerAPI.submitDomain({
      domain: domainForm.domain.trim(),
    })
    domainForm.domain = ''
    panelAlert.value = {
      level: 'success',
      message: t('personalCenter.reseller.domainSubmitSuccess'),
    }
    await loadManagementSnapshot()
  } catch (err: any) {
    panelAlert.value = {
      level: 'error',
      message: err?.message || t('personalCenter.reseller.errors.domainSubmitFailed'),
    }
  } finally {
    submittingDomain.value = false
  }
}

const handleApplyWithdraw = async () => {
  panelAlert.value = null
  if (!withdrawEnabled.value) {
    panelAlert.value = {
      level: 'warning',
      message: withdrawDisabledReasonText.value,
    }
    return
  }
  if (!withdrawForm.amount.trim()) {
    panelAlert.value = {
      level: 'warning',
      message: t('personalCenter.reseller.errors.withdrawAmountRequired'),
    }
    return
  }
  if (!withdrawForm.currency.trim()) {
    panelAlert.value = {
      level: 'warning',
      message: t('personalCenter.reseller.errors.withdrawCurrencyRequired'),
    }
    return
  }
  if (!withdrawForm.channel.trim()) {
    panelAlert.value = {
      level: 'warning',
      message: t('personalCenter.reseller.errors.withdrawChannelRequired'),
    }
    return
  }
  if (!withdrawForm.account.trim()) {
    panelAlert.value = {
      level: 'warning',
      message: t('personalCenter.reseller.errors.withdrawAccountRequired'),
    }
    return
  }

  submittingWithdraw.value = true
  try {
    await resellerAPI.applyWithdraw({
      amount: withdrawForm.amount.trim(),
      currency: withdrawForm.currency.trim(),
      channel: withdrawForm.channel.trim(),
      account: withdrawForm.account.trim(),
    })
    withdrawForm.amount = ''
    withdrawForm.account = ''
    panelAlert.value = {
      level: 'success',
      message: t('personalCenter.reseller.withdrawSuccess'),
    }
    await Promise.all([loadDashboard(), loadLedgerEntries(1), loadWithdraws(1)])
  } catch (err: any) {
    panelAlert.value = {
      level: 'error',
      message: err?.message || t('personalCenter.reseller.errors.withdrawFailed'),
    }
  } finally {
    submittingWithdraw.value = false
  }
}

const balanceStatusLabel = (status?: string) => {
  if (status === RESELLER_BALANCE_STATUS_NORMAL) return t('personalCenter.reseller.balanceStatus.normal')
  if (status === RESELLER_BALANCE_STATUS_NEGATIVE_BALANCE) return t('personalCenter.reseller.balanceStatus.negativeBalance')
  if (status === RESELLER_BALANCE_STATUS_FROZEN_REVIEW) return t('personalCenter.reseller.balanceStatus.frozenReview')
  if (status === RESELLER_BALANCE_STATUS_DISABLED) return t('personalCenter.reseller.balanceStatus.disabled')
  return status || '-'
}

const balanceStatusVariant = (status?: string): BadgeTone => {
  if (status === RESELLER_BALANCE_STATUS_NORMAL) return 'success'
  if (status === RESELLER_BALANCE_STATUS_NEGATIVE_BALANCE) return 'warning'
  if (status === RESELLER_BALANCE_STATUS_FROZEN_REVIEW) return 'warning'
  return 'neutral'
}

const domainTypeLabel = (type?: string) => {
  if (type === RESELLER_DOMAIN_TYPE_SUBDOMAIN) return t('personalCenter.reseller.domainType.subdomain')
  if (type === RESELLER_DOMAIN_TYPE_CUSTOM) return t('personalCenter.reseller.domainType.custom')
  return type || '-'
}

const domainStatusLabel = (status?: string) => {
  const key = getResellerDomainStatusKey(status)
  return t(`personalCenter.reseller.domainStatus.${key}`)
}

const domainStatusVariant = (status?: string): BadgeTone => {
  if (status === RESELLER_DOMAIN_STATUS_ACTIVE) return 'success'
  if (status === RESELLER_DOMAIN_STATUS_PENDING_REVIEW) return 'warning'
  if (status === RESELLER_DOMAIN_STATUS_DISABLED) return 'neutral'
  return 'neutral'
}

const domainVerificationLabel = (status?: string) => {
  if (status === RESELLER_DOMAIN_VERIFICATION_PENDING) return t('personalCenter.reseller.domainVerification.pending')
  if (status === RESELLER_DOMAIN_VERIFICATION_VERIFIED) return t('personalCenter.reseller.domainVerification.verified')
  if (status === RESELLER_DOMAIN_VERIFICATION_FAILED) return t('personalCenter.reseller.domainVerification.failed')
  return status || '-'
}

const domainVerificationVariant = (status?: string): BadgeTone => {
  if (status === RESELLER_DOMAIN_VERIFICATION_VERIFIED) return 'success'
  if (status === RESELLER_DOMAIN_VERIFICATION_FAILED) return 'neutral'
  return 'warning'
}

const ledgerTypeLabel = (type?: string) => {
  const key = getResellerLedgerTypeKey(type)
  if (key) return t(`personalCenter.reseller.ledgerType.${key}`)
  return type || '-'
}

const ledgerStatusLabel = (status?: string) => {
  if (status === RESELLER_LEDGER_STATUS_PENDING_CONFIRM) return t('personalCenter.reseller.ledgerStatus.pendingConfirm')
  if (status === RESELLER_LEDGER_STATUS_AVAILABLE) return t('personalCenter.reseller.ledgerStatus.available')
  if (status === RESELLER_LEDGER_STATUS_LOCKED) return t('personalCenter.reseller.ledgerStatus.locked')
  if (status === RESELLER_LEDGER_STATUS_WITHDRAWN) return t('personalCenter.reseller.ledgerStatus.withdrawn')
  if (status === RESELLER_LEDGER_STATUS_CANCELED) return t('personalCenter.reseller.ledgerStatus.canceled')
  return status || '-'
}

const ledgerStatusVariant = (status?: string): BadgeTone => {
  if (status === RESELLER_LEDGER_STATUS_PENDING_CONFIRM) return 'warning'
  if (status === RESELLER_LEDGER_STATUS_AVAILABLE) return 'success'
  if (status === RESELLER_LEDGER_STATUS_LOCKED) return 'info'
  return 'neutral'
}

const withdrawStatusLabel = (status?: string) => {
  if (status === RESELLER_WITHDRAW_STATUS_PENDING) return t('personalCenter.reseller.withdrawStatus.pending')
  if (status === RESELLER_WITHDRAW_STATUS_REJECTED) return t('personalCenter.reseller.withdrawStatus.rejected')
  if (status === RESELLER_WITHDRAW_STATUS_PAID) return t('personalCenter.reseller.withdrawStatus.paid')
  return status || '-'
}

const withdrawStatusVariant = (status?: string): BadgeTone => {
  if (status === RESELLER_WITHDRAW_STATUS_PENDING) return 'warning'
  if (status === RESELLER_WITHDRAW_STATUS_PAID) return 'success'
  return 'neutral'
}

onMounted(() => {
  initialize()
})
</script>
