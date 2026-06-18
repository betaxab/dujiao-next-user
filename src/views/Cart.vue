<template>
  <div class="min-h-screen bg-background text-foreground pt-24 pb-16">
    <div class="container mx-auto px-4">
      <div class="mb-8">
        <h1 class="mb-2 text-3xl font-black text-foreground">{{ t('cart.title') }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('cart.subtitle') }}</p>
      </div>

      <CheckoutSteps class="mb-8" current-step="cart" />

      <!-- Empty State -->
      <EmptyState
        v-if="cartItems.length === 0"
        icon="cart"
        :title="t('cart.empty')"
        :action-label="t('cart.emptyAction')"
        action-to="/products"
      />

      <div v-else class="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div class="space-y-4 lg:col-span-2">
          <article
            v-for="item in cartItems"
            :key="cartItemKey(item)"
            class="rounded-2xl border bg-card text-card-foreground p-4 md:p-5"
          >
            <div class="flex gap-4 md:gap-5">
              <div
                class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border bg-muted transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <SmartImage
                  :src="cartItemImage(item)"
                  :alt="getLocalizedText(item.title)"
                  img-class="h-full w-full object-cover"
                />
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <router-link
                      :to="`/products/${item.slug}`"
                      class="text-base md:text-lg font-bold text-primary hover:underline line-clamp-1"
                    >
                      {{ getLocalizedText(item.title) }}
                    </router-link>
                    <p class="mt-1 text-sm text-muted-foreground">{{ t('cart.priceLabel') }}：{{ formatPrice(item.priceAmount, totalCurrency) }}</p>
                    <p v-if="itemSkuDisplay(item)" class="mt-1 text-xs text-muted-foreground truncate">{{ t('cart.skuLabel') }}：{{ itemSkuDisplay(item) }}</p>
                    <p v-if="itemStockHint(item)" class="mt-1 text-xs text-muted-foreground">{{ itemStockHint(item) }}</p>
                    <div class="mt-2 md:mt-3 flex flex-wrap gap-2">
                      <Badge
                        :variant="item.purchaseType === 'guest' ? 'warning' : 'success'"
                        size="xs"
                        class="uppercase tracking-wider"
                      >
                        {{ item.purchaseType === 'guest' ? t('productPurchase.guest') : t('productPurchase.member') }}
                      </Badge>
                      <Badge
                        :variant="item.fulfillmentType === 'auto' ? 'info' : 'neutral'"
                        size="xs"
                        class="uppercase tracking-wider"
                      >
                        {{ item.fulfillmentType === 'auto' ? t('products.fulfillmentType.auto') : t('products.fulfillmentType.manual') }}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="removeWithUndo(item)"
                    class="shrink-0 min-w-[44px] min-h-[44px] text-muted-foreground hover:text-destructive hover:bg-transparent"
                  >
                    <Trash2 class="md:hidden" />
                    <span class="hidden md:inline">{{ t('cart.remove') }}</span>
                  </Button>
                </div>

                <div class="mt-3 md:mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3 md:pt-4">
                  <div class="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      @click="updateQty(item, item.quantity - 1)"
                      :disabled="item.quantity <= itemPurchaseMin(item)"
                      class="h-10 w-10 rounded-lg text-base font-medium"
                    >
                      -
                    </Button>
                    <input
                      type="number"
                      :id="`cart-qty-${item.productId}`"
                      :name="`cart-qty-${item.productId}`"
                      :value="item.quantity"
                      @change="handleQtyChange(item, $event)"
                      :min="itemPurchaseMin(item)"
                      :max="itemMaxQuantity(item)"
                      class="cart-qty-input w-12 text-center text-sm font-mono text-foreground bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      @click="updateQty(item, item.quantity + 1)"
                      :disabled="item.quantity >= itemMaxQuantity(item)"
                      class="h-10 w-10 rounded-lg text-base font-medium"
                    >
                      +
                    </Button>
                  </div>

                  <div class="text-right">
                    <p class="text-xs uppercase tracking-wider text-muted-foreground">{{ t('checkout.totalPriceLabel') }}</p>
                    <p class="text-sm font-semibold text-foreground">{{ itemSubtotal(item) }}</p>
                  </div>
                </div>
                <p v-if="quantityWarning(item)" class="mt-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
                  {{ quantityWarning(item) }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div class="h-fit rounded-2xl border bg-card text-card-foreground p-6 lg:sticky lg:top-24">
          <h2 class="mb-4 text-lg font-bold text-foreground">{{ t('cart.summaryTitle') }}</h2>
          <div class="space-y-3 text-sm text-muted-foreground">
            <div class="flex items-center justify-between">
              <span>{{ t('cart.itemsCount') }}</span>
              <span class="font-mono text-foreground">{{ totalItems }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span>{{ t('cart.totalLabel') }}</span>
              <span class="theme-price-sm text-foreground">{{ formatPrice(totalAmount, totalCurrency) }}</span>
            </div>
            <div class="rounded-lg border bg-secondary p-3 text-xs text-muted-foreground">
              {{ t('cart.disclaimer') }}
            </div>
          </div>

          <div class="mt-6 space-y-2">
            <Button as-child size="lg" class="w-full font-semibold">
              <router-link to="/checkout">
                {{ t('cart.checkout') }}
              </router-link>
            </Button>
            <Button as-child variant="secondary" size="lg" class="w-full font-semibold">
              <router-link to="/products">
                {{ t('cart.emptyAction') }}
              </router-link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCartStore, type CartItem } from '../stores/cart'
import { useAppStore } from '../stores/app'
import { amountToCents, centsToAmount, parseInteger } from '../utils/money'
import { buildSkuDisplayText, normalizeSkuId } from '../utils/sku'
import { refreshCartStockSnapshots, cartItemPurchaseLimit as itemPurchaseLimit, cartItemPurchaseMin as itemPurchaseMin } from '../utils/cartStock'
import { getImageUrl } from '../utils/image'
import { useLocalized } from '../composables/useProduct'
import { toast } from '../composables/useToast'
import { Trash2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import EmptyState from '../components/EmptyState.vue'
import SmartImage from '../components/SmartImage.vue'
import CheckoutSteps from '../components/checkout/CheckoutSteps.vue'

const cartStore = useCartStore()
const appStore = useAppStore()
const { t } = useI18n()

const { getLocalizedText, siteCurrency, formatPrice } = useLocalized()
const totalCurrency = computed(() => siteCurrency.value || 'CNY')

const cartItems = computed(() => cartStore.items)
const totalItems = computed(() => cartStore.totalItems)
const quantityWarnings = ref<Record<string, string>>({})
const totalAmount = computed(() => {
  const totalCents = cartItems.value.reduce((sum, item) => {
    const amountCents = amountToCents(item.priceAmount)
    const qty = parseInteger(item.quantity)
    if (amountCents === null || qty === null) return sum
    return sum + amountCents * qty
  }, 0)
  return centsToAmount(totalCents)
})

const removeWithUndo = (item: CartItem) => {
  const removedItem = { ...item }
  cartStore.removeItem(item.productId, item.skuId)
  toast.info(t('cart.removed'), {
    duration: 5000,
    action: {
      label: t('cart.undo'),
      onClick: () => {
        cartStore.addItem(removedItem, removedItem.quantity)
      },
    },
  })
}

const itemSubtotal = (item: CartItem) => {
  const amountCents = amountToCents(item.priceAmount)
  const qty = parseInteger(item.quantity)
  if (amountCents === null || qty === null) {
    return formatPrice('-', totalCurrency.value)
  }
  return formatPrice(centsToAmount(amountCents * qty), totalCurrency.value)
}

const updateQty = (item: CartItem, qty: number) => {
  const key = cartItemKey(item)
  quantityWarnings.value[key] = ''
  const max = itemMaxQuantity(item)
  const available = itemAvailableStock(item)
  const purchaseLimit = itemPurchaseLimit(item)
  const purchaseMin = itemPurchaseMin(item)
  if (qty < purchaseMin) {
    if (purchaseMin > 1) {
      quantityWarnings.value[key] = t('cart.minPurchaseNotMet', { count: purchaseMin })
    }
    return
  }
  if (qty > max) {
    if (max <= 0) {
      quantityWarnings.value[key] = t('cart.stockOut')
    } else if (purchaseLimit !== null && max === purchaseLimit && (available === null || purchaseLimit < available)) {
      quantityWarnings.value[key] = t('cart.maxPurchaseExceeded', { count: purchaseLimit })
    } else {
      quantityWarnings.value[key] = t('cart.stockExceeded', { count: max })
    }
    return
  }
  cartStore.updateQuantity(item.productId, qty, item.skuId)
}

const handleQtyChange = (item: CartItem, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value, 10)
  const purchaseMin = itemPurchaseMin(item)
  if (!Number.isFinite(value) || value < purchaseMin) {
    target.value = String(item.quantity)
    return
  }
  updateQty(item, value)
  target.value = String(item.quantity)
}

const cartItemKey = (item: CartItem) => `${item.productId}:${normalizeSkuId(item.skuId)}`

const itemSkuDisplay = (item: CartItem) => buildSkuDisplayText({
  skuCode: item.skuCode,
  specValues: item.skuSpecValues,
  fallback: t('productDetail.skuFallback'),
  locale: appStore.locale,
})

const cartItemImage = (item: CartItem) => {
  const rawImage = String(item.image || '').trim()
  if (!rawImage) return ''
  return getImageUrl(rawImage)
}

const normalizeStockNumber = (value: unknown) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return 0
  return Math.max(Math.floor(numberValue), 0)
}

const normalizeManualStockTotal = (value: unknown) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return 0
  const integerValue = Math.floor(numberValue)
  if (integerValue === -1) return -1
  return Math.max(integerValue, 0)
}

const hasItemStockSnapshot = (item: CartItem) => Boolean(String(item.skuStockSnapshotAt || '').trim())

const shouldEnforceItemStock = (item: CartItem) => {
  if (item.skuStockQuantityHidden === true) return false
  if (item.fulfillmentType === 'auto') return true
  if (item.fulfillmentType === 'upstream') return true
  if (item.fulfillmentType !== 'manual') return false
  if (!hasItemStockSnapshot(item)) return false
  const total = normalizeManualStockTotal(item.skuManualStockTotal)
  if (total === -1) return false
  if (item.skuStockEnforced === true) return true
  if (item.skuStockEnforced === false) return false
  return true
}

const itemAvailableStock = (item: CartItem) => {
  if (item.skuStockQuantityHidden === true) {
    return item.skuStockStatus === 'out_of_stock' ? 0 : null
  }
  if (!shouldEnforceItemStock(item)) return null
  if (item.fulfillmentType === 'upstream') {
    const upstreamStock = Number(item.skuUpstreamStock ?? 0)
    if (upstreamStock === -1) return null
    return Math.max(upstreamStock, 0)
  }
  if (item.fulfillmentType === 'auto') {
    return normalizeStockNumber(item.skuAutoStockAvailable)
  }
  const total = normalizeManualStockTotal(item.skuManualStockTotal)
  if (total === -1) return null
  return total
}

const itemMaxQuantity = (item: CartItem) => {
  const available = itemAvailableStock(item)
  const purchaseLimit = itemPurchaseLimit(item)
  if (available === null && purchaseLimit === null) return Number.MAX_SAFE_INTEGER
  if (available === null) return purchaseLimit || 0
  if (purchaseLimit === null) return Math.max(available, 0)
  return Math.max(Math.min(available, purchaseLimit), 0)
}

const itemStockHint = (item: CartItem) => {
  const available = itemAvailableStock(item)
  const purchaseLimit = itemPurchaseLimit(item)
  const maxQuantity = itemMaxQuantity(item)
  if (available === null) return ''
  if (available <= 0) return t('cart.stockOut')
  if (purchaseLimit !== null && maxQuantity === purchaseLimit && purchaseLimit < available) {
    return t('cart.maxPurchaseExceeded', { count: purchaseLimit })
  }
  return t('cart.stockRemaining', { count: available })
}

const quantityWarning = (item: CartItem) => quantityWarnings.value[cartItemKey(item)] || ''

onMounted(() => {
  void refreshCartStockSnapshots(cartStore)
})
</script>
<style scoped>
.cart-qty-input {
  appearance: textfield;
}
.cart-qty-input::-webkit-outer-spin-button,
.cart-qty-input::-webkit-inner-spin-button {
  appearance: none;
  margin: 0;
}
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}
</style>
