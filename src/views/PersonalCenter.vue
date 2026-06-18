<template>
  <div class="relative min-h-screen overflow-hidden bg-background text-foreground pt-24 pb-16">
    <div class="container relative z-10 mx-auto px-4">
      <header class="mb-8 rounded-3xl border bg-card p-6 shadow-xl backdrop-blur-sm lg:p-8">
        <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              {{ t('personalCenter.title') }}
            </p>
            <h1 class="mt-3 text-3xl font-black text-foreground lg:text-[2.1rem]">{{ userProfileStore.displayName }}</h1>
            <p class="mt-2 text-sm text-muted-foreground">{{ t('personalCenter.subtitle') }}</p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <div class="rounded-2xl border bg-secondary px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.16em] text-gray-400">{{ t('personalCenter.memberLevel.currentLevel') }}</p>
              <p class="mt-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <img v-if="isImagePath(userProfileStore.currentLevel?.icon)" :src="getImageUrl(userProfileStore.currentLevel!.icon)" class="h-4 w-4 object-contain" alt="" />
                <span v-else-if="userProfileStore.currentLevel?.icon">{{ userProfileStore.currentLevel.icon }}</span>
                <span>{{ levelName(userProfileStore.currentLevel) }}</span>
              </p>
            </div>
            <div class="rounded-2xl border bg-secondary px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.16em] text-gray-400">{{ t('personalCenter.tabs.orders') }}</p>
              <p class="mt-2 text-sm font-semibold text-muted-foreground">
                {{ userProfileStore.loadingOrders ? '-' : userProfileStore.ordersTotal }}
              </p>
            </div>
            <div class="rounded-2xl border bg-secondary px-4 py-3">
              <p class="text-[11px] uppercase tracking-[0.16em] text-gray-400">{{ t('personalCenter.overview.accountLabel') }}</p>
              <Badge class="mt-2" :variant="emailVerifiedVariant" size="sm">
                {{ emailVerifiedLabel }}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside class="lg:col-span-3">
          <div class="rounded-2xl border bg-card p-4 shadow-sm backdrop-blur-sm lg:sticky lg:top-24">
            <div class="hidden flex-col gap-2 lg:flex">
              <button
                v-for="item in sectionItems"
                :key="item.key"
                type="button"
                @click="switchSection(item.key)"
                class="group w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all"
                :class="currentSection === item.key
                  ? 'border-primary/40 bg-primary/10 text-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-primary hover:border-primary/45'"
              >
                <span class="flex items-center justify-between gap-3">
                  <span class="flex items-center gap-2">
                    <component :is="item.icon" class="h-4 w-4" />
                    <span>{{ t(item.label) }}</span>
                  </span>
                  <span
                    class="h-1.5 w-1.5 rounded-full transition-colors"
                    :class="currentSection === item.key ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400 dark:group-hover:bg-gray-500'"
                  ></span>
                </span>
              </button>
            </div>

            <div class="lg:hidden">
              <div class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="item in sectionItems"
                  :key="item.key"
                  type="button"
                  @click="switchSection(item.key)"
                  class="shrink-0 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors"
                  :class="currentSection === item.key
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-primary hover:border-primary/45'"
                >
                  <span class="flex items-center gap-1.5">
                    <component :is="item.icon" class="h-3.5 w-3.5" />
                    <span>{{ t(item.label) }}</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <section class="space-y-6 lg:col-span-9">
          <Alert
            v-if="globalAlert"
            :variant="pageAlertVariant(globalAlert.level)"
            :class="pageAlertToneClass(globalAlert.level)"
          >
            <AlertDescription>{{ globalAlert.message }}</AlertDescription>
          </Alert>

          <template v-if="currentSection === 'overview'">
            <!-- User info card -->
            <div class="rounded-2xl border bg-card p-6 shadow-sm">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-4">
                  <div class="flex h-14 w-14 items-center justify-center rounded-2xl border-primary/40 bg-primary/10 text-lg font-black text-primary">
                    {{ displayInitial }}
                  </div>
                  <div>
                    <p class="text-xs uppercase tracking-[0.18em] text-gray-500">{{ t('personalCenter.overview.accountLabel') }}</p>
                    <h2 class="mt-1 text-xl font-black text-foreground">{{ userProfileStore.displayName }}</h2>
                    <p class="mt-1 text-sm text-muted-foreground">{{ userProfileStore.profile?.email || '-' }}</p>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <Button as-child variant="secondary" size="sm">
                    <router-link to="/reseller">{{ t('resellerConsole.title') }}</router-link>
                  </Button>
                  <Badge :variant="emailVerifiedVariant" size="sm">
                    {{ emailVerifiedLabel }}
                  </Badge>
                </div>
              </div>
            </div>

            <!-- Member level card -->
            <div v-if="userProfileStore.memberLevels.length > 0" class="rounded-2xl border bg-card p-6 shadow-sm">
              <!-- Current level header -->
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex items-center gap-3.5">
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-primary/40 bg-primary/10 text-xl">
                    <img v-if="isImagePath(userProfileStore.currentLevel?.icon)" :src="getImageUrl(userProfileStore.currentLevel!.icon)" class="h-7 w-7 object-contain" alt="" />
                    <span v-else>{{ userProfileStore.currentLevel?.icon || '👤' }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{{ t('personalCenter.memberLevel.currentLevel') }}</p>
                    <p class="mt-0.5 truncate text-lg font-bold text-foreground">{{ levelName(userProfileStore.currentLevel) }}</p>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <Badge variant="accent" class="rounded-full px-3 py-1">
                    {{ t('personalCenter.memberLevel.discountRate') }}
                    {{ userProfileStore.currentLevel && userProfileStore.currentLevel.discount_rate < 100
                      ? t('personalCenter.memberLevel.discountOff', { n: userProfileStore.currentLevel.discount_rate / 10 })
                      : t('personalCenter.memberLevel.noDiscount')
                    }}
                  </Badge>
                  <Badge
                    v-if="!userProfileStore.nextLevel && userProfileStore.currentLevel"
                    variant="success"
                    class="rounded-full px-3 py-1"
                  >
                    {{ t('personalCenter.memberLevel.highestLevel') }}
                  </Badge>
                </div>
              </div>

              <!-- Next level upgrade progress -->
              <div v-if="userProfileStore.nextLevel" class="mt-5 rounded-xl bg-secondary p-4">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <!-- Next level info -->
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base opacity-60">
                      <img v-if="isImagePath(userProfileStore.nextLevel.icon)" :src="getImageUrl(userProfileStore.nextLevel.icon)" class="h-6 w-6 object-contain" alt="" />
                      <span v-else>{{ userProfileStore.nextLevel.icon || '⭐' }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{{ t('personalCenter.memberLevel.nextLevel') }}</p>
                      <div class="mt-0.5 flex items-center gap-2">
                        <span class="truncate text-sm font-bold text-muted-foreground">{{ levelName(userProfileStore.nextLevel) }}</span>
                        <span v-if="userProfileStore.nextLevel.discount_rate < 100" class="shrink-0 text-xs font-medium text-primary">
                          {{ t('personalCenter.memberLevel.discountOff', { n: userProfileStore.nextLevel.discount_rate / 10 }) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Progress bars -->
                <div v-if="userProfileStore.upgradeProgress" class="mt-3.5 space-y-3">
                  <div v-if="userProfileStore.upgradeProgress.rechargePercent !== null">
                    <div class="mb-1.5 flex items-center justify-between">
                      <span class="text-xs font-medium text-muted-foreground">{{ t('personalCenter.memberLevel.rechargeProgress') }}</span>
                      <span class="text-xs tabular-nums text-muted-foreground">
                        {{ userProfileStore.upgradeProgress.recharged.toFixed(2) }}
                        <span class="mx-0.5 opacity-40">/</span>
                        {{ userProfileStore.upgradeProgress.rechargeThreshold.toFixed(2) }}
                      </span>
                    </div>
                    <div class="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        class="absolute inset-y-0 left-0 rounded-full bg-[var(--ui-accent)] transition-all duration-700 ease-out"
                        :style="{ width: userProfileStore.upgradeProgress.rechargePercent + '%' }"
                      ></div>
                    </div>
                  </div>
                  <div v-if="userProfileStore.upgradeProgress.spendPercent !== null">
                    <div class="mb-1.5 flex items-center justify-between">
                      <span class="text-xs font-medium text-muted-foreground">{{ t('personalCenter.memberLevel.spendProgress') }}</span>
                      <span class="text-xs tabular-nums text-muted-foreground">
                        {{ userProfileStore.upgradeProgress.spent.toFixed(2) }}
                        <span class="mx-0.5 opacity-40">/</span>
                        {{ userProfileStore.upgradeProgress.spendThreshold.toFixed(2) }}
                      </span>
                    </div>
                    <div class="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        class="absolute inset-y-0 left-0 rounded-full bg-[var(--ui-accent)] transition-all duration-700 ease-out"
                        :style="{ width: userProfileStore.upgradeProgress.spendPercent + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border bg-card p-6 shadow-sm">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-lg font-bold text-foreground">{{ t('personalCenter.overview.recentOrdersTitle') }}</h3>
                <Button as-child variant="ghost" size="sm" class="rounded-full">
                  <router-link to="/me/orders">{{ t('personalCenter.overview.viewAllOrders') }}</router-link>
                </Button>
              </div>

              <div v-if="userProfileStore.loadingOrders" class="space-y-3">
                <div
                  v-for="idx in 3"
                  :key="idx"
                  class="h-16 animate-pulse rounded-xl border bg-muted"
                ></div>
              </div>

              <div v-else-if="userProfileStore.recentOrders.length === 0" class="rounded-xl border border-dashed bg-secondary px-4 py-5 text-sm text-muted-foreground">
                {{ t('personalCenter.overview.emptyOrders') }}
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="order in userProfileStore.recentOrders"
                  :key="order.order_no"
                  class="rounded-xl border bg-secondary px-4 py-3 transition-all transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div class="text-xs text-muted-foreground">{{ t('orders.orderNo') }}：{{ order.order_no }}</div>
                      <div class="mt-1 text-sm font-semibold text-foreground">
                        {{ formatMoney(order.total_amount, order.currency) }}
                      </div>
                      <div class="mt-1 text-xs text-muted-foreground">{{ formatDate(order.created_at) }}</div>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                      <Badge :variant="statusVariant(order.status)" size="sm">
                        {{ statusLabel(order.status) }}
                      </Badge>
                      <Button as-child variant="secondary" size="sm">
                        <router-link :to="`/orders/${order.order_no}`">{{ t('orders.viewDetails') }}</router-link>
                      </Button>
                      <Button v-if="order.status === 'pending_payment'" as-child size="sm">
                        <router-link :to="`/pay?order_no=${order.order_no}`">{{ t('orders.payNow') }}</router-link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <ProfilePanel v-else-if="currentSection === 'profile'" />
          <SecurityPanel v-else-if="currentSection === 'security'" />
          <OrdersPanel v-else-if="currentSection === 'orders'" />
          <WalletPanel v-else-if="currentSection === 'wallet'" />
          <AffiliatePanel v-else-if="currentSection === 'affiliate'" />
          <div v-else-if="currentSection === 'reseller'" class="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 class="text-xl font-bold text-foreground">{{ t('resellerConsole.title') }}</h2>
            <p class="mt-2 text-sm text-muted-foreground">{{ t('resellerConsole.dashboard.description') }}</p>
            <Button as-child class="mt-5">
              <router-link to="/reseller">{{ t('resellerConsole.nav.dashboard') }}</router-link>
            </Button>
          </div>
          <GiftCardPanel v-else-if="currentSection === 'giftCard'" />
          <ApiPanel v-else-if="currentSection === 'api'" />
          <OrdersPanel v-else />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Banknote, Home, ShoppingBag, Wallet, Gift, ShieldCheck, UserCircle, Megaphone, Key } from 'lucide-vue-next'
import { getImageUrl } from '../utils/image'
import { orderStatusLabel, orderStatusVariant } from '../utils/status'
import { pageAlertVariant, pageAlertToneClass, type PageAlert } from '../utils/alerts'
import { useUserProfileStore } from '../stores/userProfile'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ProfilePanel from './personal/ProfilePanel.vue'
import SecurityPanel from './personal/SecurityPanel.vue'
import OrdersPanel from './personal/OrdersPanel.vue'
import WalletPanel from './personal/WalletPanel.vue'
import GiftCardPanel from './personal/GiftCardPanel.vue'
import AffiliatePanel from './personal/AffiliatePanel.vue'
import ApiPanel from './personal/ApiPanel.vue'

type PersonalSection = 'overview' | 'profile' | 'security' | 'orders' | 'wallet' | 'giftCard' | 'affiliate' | 'reseller' | 'api'

const props = withDefaults(defineProps<{ section?: PersonalSection }>(), {
  section: 'overview',
})

const router = useRouter()
const { t, locale } = useI18n()
const userProfileStore = useUserProfileStore()

const sectionItems: Array<{ key: PersonalSection; label: string; icon: Component }> = [
  { key: 'overview', label: 'personalCenter.tabs.overview', icon: Home },
  { key: 'orders', label: 'personalCenter.tabs.orders', icon: ShoppingBag },
  { key: 'wallet', label: 'personalCenter.tabs.wallet', icon: Wallet },
  { key: 'affiliate', label: 'personalCenter.tabs.affiliate', icon: Megaphone },
  { key: 'reseller', label: 'personalCenter.tabs.reseller', icon: Banknote },
  { key: 'giftCard', label: 'personalCenter.tabs.giftCard', icon: Gift },
  { key: 'security', label: 'personalCenter.tabs.security', icon: ShieldCheck },
  { key: 'api', label: 'personalCenter.tabs.api', icon: Key },
  { key: 'profile', label: 'personalCenter.tabs.profile', icon: UserCircle },
]

const sectionRouteMap: Record<PersonalSection, string> = {
  overview: '/me',
  profile: '/me/profile',
  security: '/me/security',
  orders: '/me/orders',
  wallet: '/me/wallet',
  affiliate: '/me/affiliate',
  reseller: '/me/reseller',
  giftCard: '/me/gift-cards',
  api: '/me/api',
}

const currentSection = computed<PersonalSection>(() => props.section)
const globalAlert = ref<PageAlert | null>(null)

const displayInitial = computed(() => {
  const name = userProfileStore.displayName || ''
  const normalized = name.trim()
  if (!normalized) return 'U'
  return normalized.slice(0, 1).toUpperCase()
})

const switchSection = (section: PersonalSection) => {
  router.push(sectionRouteMap[section])
}

const statusLabel = (status?: string) => orderStatusLabel(t, status)
const statusVariant = (status?: string) => orderStatusVariant(status)

const formatMoney = (amount?: string, currency?: string) => {
  if (!amount) return '-'
  if (!currency) return amount
  return `${amount} ${currency}`
}

const formatDate = (raw?: string) => {
  if (!raw) return '-'
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString()
}

const emailVerifiedLabel = computed(() => {
  if (userProfileStore.profile?.email_verified_at) {
    return t('personalCenter.overview.emailVerified')
  }
  return t('personalCenter.overview.emailUnverified')
})

const emailVerifiedVariant = computed<'success' | 'warning'>(() => {
  return userProfileStore.profile?.email_verified_at ? 'success' : 'warning'
})

const isImagePath = (icon: string | undefined | null) => icon?.startsWith('/uploads/') || icon?.startsWith('http')

const levelName = (level: import('../api').PublicMemberLevel | null | undefined) => {
  if (!level) return t('personalCenter.memberLevel.defaultLevel')
  const loc = locale.value as string
  return level.name[loc] || level.name['zh-CN'] || level.name['en'] || level.slug || t('personalCenter.memberLevel.defaultLevel')
}

const initialize = async () => {
  globalAlert.value = null
  const [profileOk] = await Promise.all([
    userProfileStore.loadProfile(),
    userProfileStore.loadRecentOrders(5),
    userProfileStore.loadMemberLevels(),
  ])
  if (!profileOk) {
    globalAlert.value = {
      level: 'error',
      message: userProfileStore.profileError || t('personalCenter.common.loadFailed'),
    }
  }
}

onMounted(() => {
  initialize()
})
</script>
