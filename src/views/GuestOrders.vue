<template>
  <div class="min-h-screen bg-background text-foreground pt-24 pb-16">
    <div class="container mx-auto px-4">
      <div class="mb-8">
        <h1 class="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          <ClipboardList class="w-8 h-8 opacity-70" />
          {{ t('guestOrders.title') }}
        </h1>
        <p class="text-muted-foreground text-sm">{{ t('guestOrders.subtitle') }}</p>
      </div>

      <div class="bg-card rounded-2xl p-6 mb-8">
        <div v-if="hasSavedAuth"
          class="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-muted-foreground bg-secondary border rounded-xl px-4 py-3">
          <span>{{ t('guestOrders.savedHint', { email: savedAuth.email || '-' }) }}</span>
          <button type="button" @click="clearSaved"
            class="text-muted-foreground transition-colors hover:text-foreground text-xs underline decoration-gray-300 dark:decoration-white/20">
            {{ t('guestOrders.clearSaved') }}
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input v-model="email" type="email" class="h-11" :placeholder="t('guestOrders.emailPlaceholder')" />
          <Input v-model="orderPassword" type="password" class="h-11" :placeholder="t('guestOrders.passwordPlaceholder')" />
          <Input v-model="orderNo" type="text" class="h-11" :placeholder="t('guestOrders.orderNoPlaceholder')" />
          <Button @click="handleSearch" :disabled="loading" class="h-11 px-6 font-bold">
            <Search class="h-4 w-4" />
            {{ loading ? t('guestOrders.searching') : t('guestOrders.search') }}
          </Button>
        </div>
        <p class="text-xs text-muted-foreground mt-3">{{ t('guestOrders.tip') }}</p>
        <Alert v-if="error" variant="destructive" class="mt-4">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </div>

      <EmptyState
        v-if="orders.length === 0 && !loading"
        icon="order"
        :description="emptyMessage"
      />

      <div v-else class="space-y-4">
        <div v-for="order in orders" :key="order.order_no"
          class="bg-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ t('orders.orderNo') }}：{{ order.order_no }}</div>
            <div class="text-lg font-bold text-foreground mt-1">{{ formatMoney(order.total_amount,
              order.currency) }}</div>
            <div v-if="hasDiscount(order)" class="text-xs text-muted-foreground mt-1">
              <span v-if="hasDiscountAmount(order.discount_amount)" class="text-rose-600 dark:text-rose-300">
                {{ t('orderDetail.couponDiscountLabel') }}：{{ formatDiscountMoney(order.discount_amount, order.currency) }}
              </span>
              <span v-if="hasDiscountAmount(order.promotion_discount_amount)" class="ml-2 text-rose-600 dark:text-rose-300">
                {{ t('orderDetail.promotionDiscountLabel') }}：{{ formatDiscountMoney(order.promotion_discount_amount,
                  order.currency) }}
              </span>
            </div>
            <div class="text-xs text-muted-foreground mt-1">{{ formatDate(order.created_at) }}</div>
          </div>
          <div class="flex items-center gap-3">
            <Badge :variant="statusVariant(order.status)" size="sm">
              {{ statusLabel(order.status) }}
            </Badge>
            <Button as-child variant="secondary" size="sm">
              <router-link :to="`/guest/orders/${order.order_no}`">
                <Eye class="h-4 w-4 opacity-60" />
                {{ t('guestOrders.viewDetails') }}
              </router-link>
            </Button>
            <Button v-if="order.status === 'pending_payment'" as-child size="sm">
              <router-link :to="`/pay?guest=1&order_no=${order.order_no}`">
                <CreditCard class="h-4 w-4" />
                {{ t('guestOrders.payNow') }}
              </router-link>
            </Button>
          </div>
        </div>
      </div>

      <PaginationNav
        :current-page="pagination.page"
        :total-pages="pagination.total_page"
        :loading="loading"
        @change-page="changePage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { guestOrderAPI } from '../api'
import { useI18n } from 'vue-i18n'
import { orderStatusVariant, orderStatusLabel } from '../utils/status'
import { debounceAsync } from '../utils/debounce'
import { amountToCents } from '../utils/money'
import { ClipboardList, Search, Eye, CreditCard } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import EmptyState from '../components/EmptyState.vue'
import PaginationNav from '../components/PaginationNav.vue'

const savedAuth = ref<{ email: string; order_password: string }>({ email: '', order_password: '' })
const email = ref('')
const orderPassword = ref('')
const orderNo = ref('')
const loading = ref(false)
const error = ref('')
const orders = ref<any[]>([])
const pagination = ref({
  page: 1,
  page_size: 20,
  total: 0,
  total_page: 1,
})
const { t } = useI18n()

const loadSavedAuth = () => {
  const saved = localStorage.getItem('guest_order_auth')
  const parsed = saved ? JSON.parse(saved) : {}
  savedAuth.value = {
    email: parsed.email || '',
    order_password: parsed.order_password || '',
  }
  email.value = savedAuth.value.email
  orderPassword.value = savedAuth.value.order_password
}

const hasSavedAuth = computed(() => Boolean(savedAuth.value.email || savedAuth.value.order_password))

const persistAuth = () => {
  const payload = {
    email: email.value,
    order_password: orderPassword.value,
  }
  localStorage.setItem('guest_order_auth', JSON.stringify(payload))
  savedAuth.value = payload
}

const clearSaved = () => {
  localStorage.removeItem('guest_order_auth')
  savedAuth.value = { email: '', order_password: '' }
  email.value = ''
  orderPassword.value = ''
  orderNo.value = ''
  orders.value = []
  pagination.value = {
    page: 1,
    page_size: 20,
    total: 0,
    total_page: 1,
  }
  error.value = ''
}

const handleSearch = async () => {
  error.value = ''
  if (!email.value || !orderPassword.value) {
    error.value = t('guestOrders.errors.missing')
    return
  }
  persistAuth()
  await debouncedLoadOrders(1)
}

const loadOrders = async (page: number) => {
  loading.value = true
  try {
    const response = await guestOrderAPI.list({
      email: email.value,
      order_password: orderPassword.value,
      order_no: orderNo.value || undefined,
      page,
      page_size: pagination.value.page_size,
    })
    orders.value = response.data.data || []
    pagination.value = response.data.pagination || pagination.value
    if (orderNo.value && orders.value.length === 0) {
      error.value = t('guestOrders.errors.notFound')
    }
  } catch (err: any) {
    orders.value = []
    error.value = err.message || t('guestOrders.errors.searchFailed')
  } finally {
    loading.value = false
  }
}

const debouncedLoadOrders = debounceAsync(loadOrders, 300)

const emptyMessage = computed(() => {
  if (orderNo.value) {
    return t('guestOrders.emptyOrderNo')
  }
  return t('guestOrders.empty')
})

const changePage = (page: number) => {
  if (page < 1 || page > pagination.value.total_page) return
  debouncedLoadOrders(page)
}

const statusLabel = (status: string) => orderStatusLabel(t, status)

const formatMoney = (amount?: string, currency?: string) => {
  if (amount === null || amount === undefined || amount === '') return '-'
  if (currency === null || currency === undefined || currency === '') {
    return String(amount)
  }
  return `${amount} ${currency}`
}

const formatDiscountMoney = (amount?: string, currency?: string) => {
  return hasDiscountAmount(amount) ? `-${formatMoney(amount, currency)}` : formatMoney(amount, currency)
}

const hasDiscountAmount = (amount?: string) => {
  if (amount === null || amount === undefined || amount === '') return false
  const valueCents = amountToCents(amount)
  return valueCents !== null && valueCents > 0
}

const hasDiscount = (order: any) => {
  if (!order) return false
  return hasDiscountAmount(order.discount_amount) || hasDiscountAmount(order.promotion_discount_amount)
}

const statusVariant = (status: string) => orderStatusVariant(status)

const formatDate = (raw?: string) => {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString()
}

onMounted(() => {
  loadSavedAuth()
  if (hasSavedAuth.value) {
    debouncedLoadOrders(1)
  }
})

onUnmounted(() => {
  debouncedLoadOrders.cancel()
})
</script>
