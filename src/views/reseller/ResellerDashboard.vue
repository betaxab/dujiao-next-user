<template>
  <div class="space-y-6">
    <ResellerSectionHeader
      :title="t('resellerConsole.dashboard.title')"
      :description="t('resellerConsole.dashboard.description')"
    >
      <template #actions>
        <Button v-if="primaryDomainUrl" as-child variant="outline" size="sm">
          <a :href="primaryDomainUrl" target="_blank" rel="noopener noreferrer">
            <ExternalLink class="h-4 w-4" />
            {{ t('resellerConsole.dashboard.visitStore') }}
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" @click="initialize">
          <RotateCw class="h-4 w-4" />
          {{ t('orders.filters.refresh') }}
        </Button>
      </template>
    </ResellerSectionHeader>

    <ResellerPageState v-if="profileLoading || dashboardLoading || ordersLoading" loading :title="t('resellerConsole.common.loading')" />

    <template v-else-if="profileState.profileStatus !== 'active'">
      <Card class="overflow-hidden p-6 sm:p-8">
        <div class="mx-auto max-w-xl text-center">
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Rocket class="h-7 w-7" />
          </span>
          <h2 class="mt-4 text-xl font-black text-foreground">{{ t('resellerConsole.dashboard.inactiveTitle') }}</h2>
          <p class="mt-2 text-sm text-muted-foreground">{{ t('resellerConsole.dashboard.inactiveDescription') }}</p>
          <ul class="mx-auto mt-5 max-w-md space-y-2 text-left">
            <li v-for="(benefit, i) in benefits" :key="i" class="flex items-start gap-2 text-sm text-foreground">
              <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <span>{{ benefit }}</span>
            </li>
          </ul>
          <Button as-child class="mt-6">
            <RouterLink to="/reseller/apply">{{ t('resellerConsole.nav.apply') }}</RouterLink>
          </Button>
        </div>
      </Card>
    </template>

    <template v-else>
      <!-- 概览头 -->
      <Card class="p-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{{ t('resellerConsole.dashboard.storeLabel') }}</p>
            <h2 class="mt-1 break-all font-mono text-lg font-black text-foreground">{{ primaryDomain || t('resellerConsole.dashboard.noDomain') }}</h2>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <ResellerStatusBadge :label="settlementText" tone="info" dot />
            <ResellerStatusBadge :label="t('resellerConsole.dashboard.statusActive')" tone="success" dot />
          </div>
        </div>
      </Card>

      <!-- 指标卡 -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ResellerMetricCard :label="t('resellerConsole.dashboard.orderTotal')" :value="stats?.total || 0" :icon="ShoppingBag" tone="accent" />
        <ResellerMetricCard :label="t('resellerConsole.orders.paidOrders')" :value="paidCount" :hint="paidRatioText" :icon="CheckCircle2" tone="success" />
        <ResellerMetricCard :label="t('personalCenter.reseller.primaryAvailable')" :value="primaryBalanceText" :icon="Banknote" tone="info" />
        <ResellerMetricCard :label="t('resellerConsole.dashboard.domainCount')" :value="profileSnapshot?.domains?.length || 0" :icon="Globe" tone="neutral" />
      </div>

      <!-- 可视化:订单状态分布 + 多币种余额 -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card class="p-5">
          <h3 class="mb-4 text-sm font-bold text-foreground">{{ t('resellerConsole.dashboard.orderDistribution') }}</h3>
          <ResellerDonut
            v-if="statusSegments.length"
            :segments="statusSegments"
            :center-value="stats?.total || 0"
            :center-label="t('resellerConsole.dashboard.orderTotal')"
          />
          <p v-else class="py-6 text-center text-sm text-muted-foreground">{{ t('resellerConsole.orders.empty') }}</p>
        </Card>

        <Card class="p-5">
          <h3 class="mb-4 text-sm font-bold text-foreground">{{ t('resellerConsole.dashboard.balanceOverview') }}</h3>
          <ResellerDonut
            v-if="balanceSegments.length"
            :segments="balanceSegments"
            :center-value="balances.length"
            :center-label="t('personalCenter.reseller.currencyCount')"
          />
          <p v-else class="py-6 text-center text-sm text-muted-foreground">{{ t('personalCenter.reseller.balanceEmpty') }}</p>
        </Card>
      </div>

      <!-- 快捷入口 -->
      <section>
        <h3 class="mb-3 text-sm font-bold text-foreground">{{ t('resellerConsole.dashboard.quickActions') }}</h3>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <RouterLink
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
              <component :is="action.icon" class="h-5 w-5" />
            </span>
            <span class="min-w-0 text-sm font-semibold text-foreground">{{ action.label }}</span>
          </RouterLink>
        </div>
      </section>

      <!-- 最近订单 -->
      <Card class="p-5">
        <div class="mb-4 flex items-center justify-between gap-3">
          <h3 class="text-base font-bold text-foreground">{{ t('resellerConsole.orders.title') }}</h3>
          <RouterLink to="/reseller/orders" class="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            {{ t('resellerConsole.dashboard.viewOrders') }}
            <ChevronRight class="h-4 w-4" />
          </RouterLink>
        </div>

        <ResellerPageState v-if="recentOrders.length === 0" :title="t('resellerConsole.orders.empty')" :icon="ShoppingBag" />

        <template v-else>
          <!-- 桌面表 -->
          <ResellerDataTable class="hidden lg:block">
            <TableHeader>
              <TableRow class="bg-muted/50">
                <TableHead class="px-4">{{ t('resellerConsole.orders.orderNo') }}</TableHead>
                <TableHead class="px-4">{{ t('resellerConsole.orders.status') }}</TableHead>
                <TableHead class="px-4 text-right">{{ t('resellerConsole.orders.totalAmount') }}</TableHead>
                <TableHead class="px-4 text-right">{{ t('resellerConsole.orders.profitAmount') }}</TableHead>
                <TableHead class="px-4">{{ t('resellerConsole.orders.createdAt') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in recentOrders" :key="row.order_no">
                <TableCell class="px-4 py-3 font-mono text-xs text-foreground">{{ row.order_no }}</TableCell>
                <TableCell class="px-4 py-3"><ResellerStatusBadge :label="statusLabel(row.status)" :tone="statusTone(row.status)" /></TableCell>
                <TableCell class="px-4 py-3 text-right font-mono text-xs">{{ formatResellerConsoleAmount(row.total_amount, row.currency) }}</TableCell>
                <TableCell class="px-4 py-3 text-right font-mono text-xs">{{ formatResellerConsoleAmount(row.profit_amount, row.currency) }}</TableCell>
                <TableCell class="px-4 py-3 text-xs text-muted-foreground">{{ formatResellerConsoleDate(row.created_at) }}</TableCell>
              </TableRow>
            </TableBody>
          </ResellerDataTable>

          <!-- 移动卡片 -->
          <div class="space-y-3 lg:hidden">
            <RouterLink
              v-for="row in recentOrders"
              :key="row.order_no"
              :to="`/reseller/orders/${encodeURIComponent(row.order_no)}`"
              class="block"
            >
              <ResellerRecordCard>
                <template #header>
                  <span class="min-w-0 truncate font-mono text-xs font-semibold text-foreground">{{ row.order_no }}</span>
                  <ResellerStatusBadge :label="statusLabel(row.status)" :tone="statusTone(row.status)" />
                </template>
                <div>
                  <dt class="text-muted-foreground">{{ t('resellerConsole.orders.totalAmount') }}</dt>
                  <dd class="mt-0.5 font-mono text-foreground">{{ formatResellerConsoleAmount(row.total_amount, row.currency) }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">{{ t('resellerConsole.orders.profitAmount') }}</dt>
                  <dd class="mt-0.5 font-mono text-foreground">{{ formatResellerConsoleAmount(row.profit_amount, row.currency) }}</dd>
                </div>
              </ResellerRecordCard>
            </RouterLink>
          </div>
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Banknote,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe,
  Rocket,
  RotateCw,
  Settings,
  ShoppingBag,
  Tag,
  Upload,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ResellerDataTable from '../../components/reseller-console/ResellerDataTable.vue'
import ResellerDonut from '../../components/reseller-console/ResellerDonut.vue'
import ResellerMetricCard from '../../components/reseller-console/ResellerMetricCard.vue'
import ResellerPageState from '../../components/reseller-console/ResellerPageState.vue'
import ResellerRecordCard from '../../components/reseller-console/ResellerRecordCard.vue'
import ResellerSectionHeader from '../../components/reseller-console/ResellerSectionHeader.vue'
import ResellerStatusBadge, { type ResellerBadgeTone } from '../../components/reseller-console/ResellerStatusBadge.vue'
import { useResellerFinance } from '../../composables/reseller/useResellerFinance'
import { useResellerOrders } from '../../composables/reseller/useResellerOrders'
import { useResellerProfile } from '../../composables/reseller/useResellerProfile'
import {
  formatResellerConsoleAmount,
  formatResellerConsoleDate,
  resellerCurrencyColor,
  resellerOrderStatusColor,
  resellerOrderStatusTone,
} from '../../utils/resellerConsole'

const { t, te } = useI18n()
const { loading: profileLoading, snapshot: profileSnapshot, state: profileState, load: loadProfile } = useResellerProfile()
const finance = useResellerFinance()
const { dashboardLoading, dashboard, balances, loadDashboard, loadBalances } = finance
const { loading: ordersLoading, rows: recentOrders, stats, load: loadOrders, loadStats } = useResellerOrders()

const primaryDomainObj = computed(() => {
  const domains = profileSnapshot.value?.domains || []
  return domains.find((d) => d.is_primary) || domains[0] || null
})
const primaryDomain = computed(() => primaryDomainObj.value?.domain || '')
const primaryDomainUrl = computed(() => (primaryDomain.value ? `https://${primaryDomain.value}` : ''))

const settlementText = computed(() => {
  const status = profileSnapshot.value?.profile?.settlement_status
  const key = `personalCenter.reseller.settlementStatusMap.${status}`
  return status && te(key) ? t(key) : t('personalCenter.reseller.settlementStatus')
})

const benefits = computed(() => [
  t('resellerConsole.dashboard.benefit1'),
  t('resellerConsole.dashboard.benefit2'),
  t('resellerConsole.dashboard.benefit3'),
])

const paidCount = computed(() => stats.value?.by_status?.paid || 0)
const paidRatioText = computed(() => {
  const total = stats.value?.total || 0
  if (total <= 0) return ''
  return `${((paidCount.value / total) * 100).toFixed(0)}%`
})

const primaryBalanceText = computed(() => {
  const first = balances.value[0] || dashboard.value?.balances?.[0]
  if (!first) return '-'
  return formatResellerConsoleAmount(first.available_amount, first.currency)
})

const statusSegments = computed(() => {
  const byStatus = stats.value?.by_status || {}
  return Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ value: count, color: resellerOrderStatusColor(status), label: statusLabel(status) }))
})

const balanceSegments = computed(() =>
  balances.value
    .map((b, i) => ({ value: Number(b.available_amount) || 0, color: resellerCurrencyColor(i), label: b.currency }))
    .filter((s) => s.value > 0),
)

const quickActions = computed(() => [
  { to: '/reseller/withdraws', label: t('resellerConsole.nav.withdraws'), icon: Upload },
  { to: '/reseller/domains', label: t('resellerConsole.nav.domains'), icon: Globe },
  { to: '/reseller/products', label: t('resellerConsole.nav.products'), icon: Tag },
  { to: '/reseller/site', label: t('resellerConsole.nav.site'), icon: Settings },
])

const statusLabel = (status?: string) => {
  if (!status) return '-'
  const key = `resellerConsole.orders.statusMap.${status}`
  return te(key) ? t(key) : status
}
const statusTone = (status?: string) => resellerOrderStatusTone(status) as ResellerBadgeTone

const initialize = async () => {
  await Promise.all([loadProfile(), loadDashboard(), loadBalances(), loadStats(), loadOrders({ page: 1, page_size: 5 })])
}

onMounted(initialize)
</script>
