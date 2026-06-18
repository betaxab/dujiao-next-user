<template>
  <div
    class="product-detail-page min-h-screen bg-background text-foreground pt-24 pb-16">
    <div class="container mx-auto px-4">
      <!-- Loading Skeleton -->
      <div v-if="loading" class="space-y-8">
        <div class="h-5 w-48 rounded theme-skeleton"></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-card border rounded-3xl overflow-hidden">
          <div class="p-4 md:p-8 bg-secondary border-r">
            <div class="h-[300px] md:h-[500px] rounded-xl theme-skeleton"></div>
            <div class="mt-4 flex gap-3 overflow-hidden">
              <div v-for="i in 4" :key="i" class="w-16 h-16 rounded-lg theme-skeleton shrink-0"></div>
            </div>
          </div>
          <div class="p-6 md:p-12 space-y-6">
            <div class="h-3 w-24 rounded theme-skeleton"></div>
            <div class="h-10 w-3/4 rounded theme-skeleton"></div>
            <div class="flex gap-2">
              <div class="h-6 w-16 rounded-full theme-skeleton"></div>
              <div class="h-6 w-16 rounded-full theme-skeleton"></div>
              <div class="h-6 w-16 rounded-full theme-skeleton"></div>
            </div>
            <div class="h-14 w-48 rounded theme-skeleton"></div>
            <div class="h-4 w-full rounded theme-skeleton"></div>
            <div class="h-4 w-2/3 rounded theme-skeleton"></div>
            <div class="flex gap-4 mt-8">
              <div class="h-14 flex-1 rounded-xl theme-skeleton"></div>
              <div class="h-14 flex-1 rounded-xl theme-skeleton"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Product Content -->
      <div v-else-if="product">
        <BreadcrumbNav
          class="mb-8"
          :items="[
            { label: t('nav.home'), to: '/' },
            { label: t('nav.products'), to: '/products' },
            { label: getLocalizedText(product.title) },
          ]"
        />

        <!-- Main Info Card -->
        <div
          class="bg-card backdrop-blur-xl border rounded-3xl overflow-hidden mb-8 shadow-2xl">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <!-- Product Images (Left) -->
            <ProductImageGallery
              :images="images"
              :current-image="currentImage"
              :product-title="getLocalizedText(product.title)"
              @update:current-image="currentImage = $event"
            />

            <!-- Product Info (Right) -->
            <div class="p-6 md:p-8 lg:p-12 flex flex-col justify-center">
              <div class="mb-6">
                <div v-if="categoryName" class="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
                  {{ t('productDetail.categoryLabel') }} · {{ categoryName }}
                </div>

                <div v-if="product.tags && product.tags.length > 0" class="mb-4 flex flex-wrap gap-2">
                  <Badge
                    v-for="(tag, index) in product.tags"
                    :key="index"
                    variant="neutral"
                  >
                    {{ tag }}
                  </Badge>
                </div>

                <h1 class="mb-4 text-2xl md:text-3xl lg:text-5xl font-black leading-tight text-foreground">
                  {{ getLocalizedText(product.title) }}
                </h1>

                <div class="mb-6 flex flex-wrap items-center gap-2">
                  <Badge :variant="product.purchase_type === 'guest' ? 'warning' : 'success'">
                    <UserPlus v-if="product.purchase_type === 'guest'" class="h-3 w-3" />
                    <Lock v-else class="h-3 w-3" />
                    {{ getPurchaseTypeLabel(product.purchase_type) }}
                  </Badge>

                  <Badge :variant="product.fulfillment_type === 'auto' ? 'info' : 'neutral'">
                    <Zap v-if="product.fulfillment_type === 'auto'" class="h-3 w-3" />
                    <Pencil v-else class="h-3 w-3" />
                    {{ getFulfillmentTypeLabel(product.fulfillment_type) }}
                  </Badge>

                  <Badge :variant="getStockBadgeVariant(product.stock_status)">
                    {{ getStockStatusLabel(product) }}
                  </Badge>
                </div>

                <div class="mb-8 border-b pb-8" ref="priceSection">
                  <div class="mb-3 flex flex-wrap items-center gap-2">
                    <span class="text-sm text-muted-foreground">{{ t('products.price') }}</span>
                    <Badge v-if="(selectedSku && hasSkuPromotionPrice(selectedSku)) || (!selectedSku && hasPromotionPrice(product))" variant="danger">
                      {{ t('products.promotionTag') }}
                    </Badge>
                    <Badge v-if="showSelectedSkuMemberBadge" variant="warning">
                      {{ t('products.memberPriceTag') }}
                    </Badge>
                    <Badge v-if="hasSelectedSkuWholesalePrice" variant="success">
                      {{ t('products.wholesaleTag') }}
                    </Badge>
                  </div>
                  <div v-if="selectedSku && hasSelectedSkuWholesalePrice" class="space-y-2">
                    <div class="flex flex-wrap items-end gap-4">
                      <span
                        class="theme-price-lg"
                        :class="selectedSkuWholesaleFinalIsMember ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'"
                      >
                        {{ formatPrice(selectedSkuWholesaleFinalPrice!, siteCurrency) }}
                      </span>
                      <span class="theme-price-original">
                        {{ formatPrice(selectedSku.price_amount, siteCurrency) }}
                      </span>
                    </div>
                    <p
                      class="text-sm font-medium"
                      :class="selectedSkuWholesaleFinalIsMember ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'"
                    >
                      {{ selectedSkuWholesaleFinalIsMember ? t('products.memberPriceTag') : t('products.wholesaleTag') }} ·
                      {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - Number(selectedSkuWholesaleFinalPrice), siteCurrency) }}
                    </p>
                  </div>
                  <!-- 选中 SKU 且有促销价 -->
                  <div v-else-if="selectedSku && hasSkuPromotionPrice(selectedSku)" class="space-y-2">
                    <div class="flex flex-wrap items-end gap-4">
                      <span v-if="selectedSkuPromotionFinalIsMember" class="theme-price-lg text-amber-600 dark:text-amber-300">
                        {{ formatPrice(selectedSkuPromotionFinalPrice!, siteCurrency) }}
                      </span>
                      <span v-else class="theme-price-lg text-rose-600 dark:text-rose-300">
                        {{ formatPrice(selectedSkuPromotionPrice!, siteCurrency) }}
                      </span>
                      <span class="theme-price-original">
                        {{ formatPrice(selectedSku.price_amount, siteCurrency) }}
                      </span>
                    </div>
                    <p v-if="selectedSkuPromotionFinalIsMember" class="text-sm font-medium text-amber-600 dark:text-amber-300">
                      {{ t('products.memberPriceTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - Number(selectedSkuPromotionFinalPrice), siteCurrency) }}
                    </p>
                    <p v-else class="text-sm font-medium text-rose-500 dark:text-rose-300">
                      {{ t('products.saveAmount') }} {{ formatPrice(getSkuPromotionSaveAmount(selectedSku), siteCurrency) }}
                    </p>
                  </div>
                  <!-- 选中 SKU 有会员价但无促销价 -->
                  <div v-else-if="selectedSku && hasMemberPrice" class="space-y-2">
                    <div class="flex flex-wrap items-end gap-4">
                      <span class="theme-price-lg text-amber-600 dark:text-amber-300">
                        {{ formatPrice(selectedSkuMemberPrice!, siteCurrency) }}
                      </span>
                      <span class="theme-price-original">
                        {{ formatPrice(selectedSku.price_amount, siteCurrency) }}
                      </span>
                    </div>
                    <p class="text-sm font-medium text-amber-600 dark:text-amber-300">
                      {{ t('products.memberPriceTag') }} · {{ t('products.saveAmount') }} {{ formatPrice(Number(selectedSku.price_amount) - selectedSkuMemberPrice!, siteCurrency) }}
                    </p>
                  </div>
                  <!-- 选中 SKU 但无促销价也无会员价 -->
                  <div v-else-if="selectedSku" class="flex items-end gap-4">
                    <span class="theme-price-lg text-primary">
                      {{ formatPrice(selectedSku.price_amount, siteCurrency) }}
                    </span>
                  </div>
                  <!-- 未选 SKU，产品级有促销价 -->
                  <div v-else-if="hasPromotionPrice(product)" class="space-y-2">
                    <div class="flex flex-wrap items-end gap-4">
                      <span class="theme-price-lg text-rose-600 dark:text-rose-300">
                        {{ formatPrice(getPromotionPriceAmount(product), siteCurrency) }}
                      </span>
                      <span class="theme-price-original">
                        {{ formatPrice(product.price_amount, siteCurrency) }}
                      </span>
                    </div>
                    <p class="text-sm font-medium text-rose-500 dark:text-rose-300">
                      {{ t('products.saveAmount') }} {{ formatPrice(getPromotionSaveAmount(product), siteCurrency) }}
                    </p>
                  </div>
                  <!-- 未选 SKU，无促销 -->
                  <div v-else class="flex items-end gap-4">
                    <span class="theme-price-lg text-primary">
                      {{ formatPrice(product.price_amount, siteCurrency) }}
                    </span>
                  </div>
                </div>

                <!-- 批发价规则展示 -->
                <div v-if="hasWholesalePrices(product)" class="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                  <h2 class="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {{ t('products.wholesaleRulesTitle') }}
                  </h2>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="tier in getWholesalePrices(product)" :key="tier.min_quantity" class="rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {{ formatWholesaleTier(tier) }}
                    </span>
                  </div>
                </div>

                <!-- 活动规则展示 -->
                <div v-if="hasPromotionRules(product)" class="mb-8 rounded-xl border border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-950/20 px-4 py-3">
                  <h2 class="mb-2 text-sm font-bold text-orange-700 dark:text-orange-300 flex items-center gap-1.5">
                    <Tag class="w-4 h-4" />
                    {{ t('products.promotionRulesTitle') }}
                  </h2>
                  <ul class="space-y-1">
                    <li v-for="rule in getPromotionRules(product)" :key="rule.id" class="text-sm text-orange-600 dark:text-orange-300/90 flex items-center gap-1.5">
                      <span class="w-1 h-1 rounded-full bg-orange-400 dark:bg-orange-500 shrink-0"></span>
                      <span>{{ formatPromotionRule(rule) }}</span>
                    </li>
                  </ul>
                </div>

                <div v-if="activeSkus.length" class="mb-8">
                  <h2 class="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    {{ t('productDetail.skuTitle') }}
                  </h2>
                  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      v-for="sku in activeSkus"
                      :key="sku.id"
                      type="button"
                      class="flex flex-col items-start rounded-xl border px-3 py-2 text-sm transition-all min-h-[44px]"
                      :class="[
                        normalizeSkuId(sku.id) === selectedSkuId ? 'border-primary/40 bg-primary/10 ring-1 ring-primary/30' : 'border bg-secondary text-foreground',
                        isSkuPurchasable(sku) ? 'hover:-translate-y-0.5' : 'cursor-not-allowed opacity-55 border-dashed',
                      ]"
                      :disabled="!isSkuPurchasable(sku)"
                      @click="selectedSkuId = normalizeSkuId(sku.id)"
                    >
                      <span class="font-semibold leading-tight">{{ skuDisplayText(sku) }}</span>
                      <span
                        class="mt-1 rounded-full border px-2 py-0.5 text-[11px]"
                        :class="skuStockBadgeClass(sku)"
                      >
                        {{ skuStockText(sku) }}
                      </span>
                    </button>
                  </div>
                  <p v-if="requiresSKUSelection" class="mt-2 text-xs text-amber-500">
                    {{ t('productDetail.skuRequired') }}
                  </p>
                </div>

                <div class="mb-8">
                  <h2 class="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    {{ t('productDetail.description') }}
                  </h2>
                  <p class="text-lg leading-relaxed text-muted-foreground">
                    {{ getLocalizedText(product.description) }}
                  </p>
                </div>
              </div>

              <!-- Quantity Selector -->
                <div class="mb-8">
                  <h2 class="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    {{ t('productDetail.quantity') }}
                  </h2>
                  <div class="flex items-center rounded-lg border overflow-hidden w-fit">
                    <button
                      type="button"
                      class="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
                      :disabled="quantity <= quantityEffectiveMin"
                      @click="quantity = Math.max(quantityEffectiveMin, quantity - 1)"
                    >
                      <Minus class="w-4 h-4" :stroke-width="2.5" />
                    </button>
                    <input
                      type="text"
                      inputmode="numeric"
                      class="w-14 h-10 text-center text-sm font-semibold text-foreground border-x bg-transparent outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      :value="quantity"
                      @change="handleQuantityInput($event)"
                      @keydown.enter.prevent="($event.target as HTMLInputElement)?.blur()"
                    />
                    <button
                      type="button"
                      class="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
                      :disabled="quantityEffectiveLimit !== null && quantity >= quantityEffectiveLimit"
                      @click="quantity = quantity + 1"
                    >
                      <Plus class="w-4 h-4" :stroke-width="2.5" />
                    </button>
                  </div>
                </div>

              <!-- Purchase Actions (Desktop + original position) -->
              <div ref="purchaseActionsRef" class="mt-auto space-y-6">
                <Alert v-if="cannotPurchaseReason" variant="destructive">
                  <AlertDescription class="font-semibold">{{ cannotPurchaseReason }}</AlertDescription>
                </Alert>
                <Alert v-if="purchaseWarning" class="border-warning/40 text-warning">
                  <AlertDescription class="font-semibold text-warning">{{ purchaseWarning }}</AlertDescription>
                </Alert>

                <div class="space-y-3">
                  <Button v-if="requiresLogin" class="w-full h-12 font-bold" @click="goLogin">
                    {{ t('productDetail.loginToBuy') }}
                  </Button>
                  <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="secondary" class="h-12 font-bold" :disabled="!canPurchase" @click="addToCart">
                      {{ t('productDetail.addToCart') }}
                    </Button>
                    <Button class="h-12 font-bold" :disabled="!canPurchase" @click="buyNow">
                      {{ t('productDetail.buyNow') }}
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <!-- Details Content Card -->
        <div v-if="product.content"
          class="bg-card backdrop-blur-xl border rounded-3xl overflow-hidden mb-12 p-6 md:p-8 lg:p-12 relative">
          <h2
            class="text-2xl font-bold mb-8 text-foreground flex items-center gap-3 border-b pb-6">
            <span class="w-1.5 h-8 bg-primary rounded-full"></span>
            {{ t('productDetail.details') }}
          </h2>
          <div v-html="processHtmlForDisplay(getLocalizedText(product.content))"
            class="prose prose-gray dark:prose-invert prose-lg max-w-none theme-prose">
          </div>
        </div>

        <!-- Related Posts -->
        <section v-if="relatedPosts.length"
          class="bg-card backdrop-blur-xl border rounded-3xl overflow-hidden mb-12 p-6 md:p-8 lg:p-12 relative">
          <h2 class="text-2xl font-bold text-foreground mb-8 flex items-center gap-3 border-b pb-6">
            <span class="w-1.5 h-8 bg-primary rounded-full"></span>
            {{ t('productDetail.relatedPosts') }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <router-link
              v-for="rp in relatedPosts"
              :key="rp.id"
              :to="`/blog/${rp.slug}`"
              class="group bg-card backdrop-blur-md border rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div v-if="rp.thumbnail" class="h-32 overflow-hidden relative">
                <img :src="getImageUrl(rp.thumbnail)" :alt="getLocalizedText(rp.title)" loading="lazy"
                  class="h-full w-full object-cover transition-transform group-hover:scale-110" />
              </div>
              <div class="p-5 flex flex-col flex-1">
                <h3 class="font-semibold text-foreground line-clamp-2 mb-2">{{ getLocalizedText(rp.title) }}</h3>
                <p v-if="rp.summary" class="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                  {{ getLocalizedText(rp.summary) }}
                </p>
                <time class="mt-auto text-xs text-muted-foreground font-mono">
                  {{ formatRelatedPostDate(rp.published_at) }}
                </time>
              </div>
            </router-link>
          </div>
        </section>

        <!-- Back Button -->
        <div class="mb-12 text-center">
          <router-link to="/products"
            class="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-current pb-1">
            <ArrowLeft class="w-5 h-5" />
            <span>{{ t('productDetail.backToProducts') }}</span>
          </router-link>
        </div>

        <!-- Mobile Fixed Purchase Bar -->
        <ProductMobileBar
          :visible="showMobileBar && !!product && !loading"
          :requires-login="requiresLogin"
          :can-purchase="canPurchase"
          :show-member-price="mobileBarShowMemberPrice"
          :member-price-display="mobileBarMemberPriceDisplay"
          :show-sku-promotion-price="mobileBarShowSkuPromotionPrice"
          :sku-promotion-price-display="mobileBarSkuPromotionPriceDisplay"
          :show-sku-price="mobileBarShowSkuPrice"
          :sku-price-display="mobileBarSkuPriceDisplay"
          :show-product-promotion-price="mobileBarShowProductPromotionPrice"
          :product-promotion-price-display="mobileBarProductPromotionPriceDisplay"
          :product-price-display="mobileBarProductPriceDisplay"
          @add-to-cart="addToCart"
          @buy-now="buyNow"
          @go-login="goLogin"
        />
      </div>

      <!-- Error State -->
      <EmptyState
        v-else
        size="lg"
        icon="alert"
        :title="t('productDetail.notFound')"
      >
        <template #action>
          <Button class="rounded-full h-10" @click="loadProduct">
            <RotateCw />
            {{ t('errorBoundary.retry') }}
          </Button>
          <Button variant="secondary" as-child class="rounded-full h-10">
            <router-link to="/products">{{ t('productDetail.backToProducts') }}</router-link>
          </Button>
        </template>
      </EmptyState>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Lock, Minus, Pencil, Plus, RotateCw, Tag, UserPlus, Zap } from 'lucide-vue-next'
import { useAppStore } from '../stores/app'
import { productAPI } from '../api'
import { getImageUrl } from '../utils/image'
import { processHtmlForDisplay } from '../utils/content'
import { useCartStore } from '../stores/cart'
import { useBuyNowStore } from '../stores/buyNow'
import { useUserAuthStore } from '../stores/userAuth'
import { useUserProfileStore } from '../stores/userProfile'
import { debounceAsync } from '../utils/debounce'
import { useHead } from '@unhead/vue'
// centsToAmount used internally by composable
import { buildSkuDisplayText, normalizeSkuId } from '../utils/sku'
import { resolveSkuAvailableStock, resolveSkuStockDisplay, type PublicStockDisplay } from '../utils/publicStock'
import { useLocalized, useProductLabels } from '../composables/useProduct'
import { toast } from '../composables/useToast'
import ProductImageGallery from '../components/product/ProductImageGallery.vue'
import ProductMobileBar from '../components/product/ProductMobileBar.vue'
import BreadcrumbNav from '../components/BreadcrumbNav.vue'
import EmptyState from '../components/EmptyState.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()
const cartStore = useCartStore()
const buyNowStore = useBuyNowStore()
const userAuthStore = useUserAuthStore()
const userProfileStore = useUserProfileStore()

const { getLocalizedText, siteCurrency, formatPrice } = useLocalized()
const { getPurchaseTypeLabel, getFulfillmentTypeLabel, getStockBadgeVariant, getStockStatusLabel, hasPromotionPrice, getPromotionPriceAmount, getPromotionSaveAmount, hasSkuPromotionPrice, getSkuPromotionPriceAmount, getSkuPromotionSaveAmount, hasPromotionRules, getPromotionRules, hasWholesalePrices, getWholesalePrices, resolveWholesalePriceAmount, resolveMemberPriceAmount } = useProductLabels()

const formatPromotionRule = (rule: any) => {
  const amount = formatPrice(rule.min_amount, siteCurrency.value)
  const value = rule.type === 'percent' ? String(rule.value) : formatPrice(rule.value, siteCurrency.value)
  const hasMin = Number(rule.min_amount) > 0
  switch (rule.type) {
    case 'percent':
      return hasMin ? t('products.promotionHintPercent', { amount, value }) : t('products.promotionHintPercentNoMin', { value })
    case 'fixed':
      return hasMin ? t('products.promotionHintFixed', { amount, value }) : t('products.promotionHintFixedNoMin', { value })
    case 'special_price':
      return hasMin ? t('products.promotionHintSpecial', { amount, value }) : t('products.promotionHintSpecialNoMin', { value })
    default:
      return rule.name || ''
  }
}

const loading = ref(true)
const product = ref<any>(null)
const relatedPosts = computed<any[]>(() => product.value?.related_posts || [])
const formatRelatedPostDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(appStore.locale, { year: 'numeric', month: 'long', day: 'numeric' })
}
const currentImage = ref<string>('')
const selectedSkuId = ref(0)
const quantity = ref(1)
const purchaseWarning = ref('')
const purchaseActionsRef = ref<HTMLElement | null>(null)
const showMobileBar = ref(false)
let observer: IntersectionObserver | null = null

const activeSkus = computed(() => {
  const rows = Array.isArray(product.value?.skus) ? product.value.skus : []
  return rows.filter((sku: any) => Boolean(sku?.is_active))
})

const selectedSku = computed(() => {
  if (selectedSkuId.value <= 0) return null
  return activeSkus.value.find((sku: any) => normalizeSkuId(sku?.id) === selectedSkuId.value) || null
})

// 会员价相关
const userMemberLevelId = computed(() => {
  return Number(userAuthStore.user?.member_level_id || 0)
})

const currentMemberDiscountRate = computed(() => {
  if (!userMemberLevelId.value) return 0
  const level = userProfileStore.memberLevels.find((item: any) => Number(item?.id || 0) === userMemberLevelId.value)
  return Number(level?.discount_rate || 0)
})

const ensureMemberLevels = () => {
  if (userMemberLevelId.value > 0 && userProfileStore.memberLevels.length === 0) {
    void userProfileStore.loadMemberLevels()
  }
}

const getMemberPriceForSku = (skuId: number, basePrice: any): number | null => {
  const price = resolveMemberPriceAmount(product.value, skuId, basePrice, userMemberLevelId.value, currentMemberDiscountRate.value)
  return price === null ? null : Number(price)
}

const selectedSkuMemberPrice = computed(() => {
  if (!selectedSku.value) return null
  const skuId = normalizeSkuId(selectedSku.value.id)
  return getMemberPriceForSku(skuId, selectedSku.value.price_amount)
})

const hasMemberPrice = computed(() => {
  if (!selectedSkuMemberPrice.value) return false
  const basePrice = Number(selectedSku.value?.price_amount || 0)
  return selectedSkuMemberPrice.value < basePrice
})

const selectedSkuWholesalePrice = computed(() => {
  if (!product.value || !selectedSku.value) return null
  return resolveWholesalePriceAmount(product.value, selectedSku.value.price_amount, quantity.value)
})

const hasSelectedSkuWholesalePrice = computed(() => {
  if (!selectedSku.value || !selectedSkuWholesalePrice.value) return false
  const comparisonPrice = hasSkuPromotionPrice(selectedSku.value)
    ? Number(getSkuPromotionPriceAmount(selectedSku.value))
    : Number(selectedSku.value.price_amount || 0)
  return Number(selectedSkuWholesalePrice.value) < comparisonPrice
})

const selectedSkuWholesaleMemberPrice = computed(() => {
  if (!product.value || !selectedSku.value || !selectedSkuWholesalePrice.value) return null
  const skuId = normalizeSkuId(selectedSku.value.id)
  return getMemberPriceForSku(skuId, selectedSkuWholesalePrice.value)
})

const selectedSkuWholesaleFinalIsMember = computed(() => {
  return hasSelectedSkuWholesalePrice.value && selectedSkuWholesaleMemberPrice.value !== null
})

const selectedSkuWholesaleFinalPrice = computed(() => {
  if (!hasSelectedSkuWholesalePrice.value || selectedSkuWholesalePrice.value === null) return null
  if (selectedSkuWholesaleMemberPrice.value !== null) return selectedSkuWholesaleMemberPrice.value
  return selectedSkuWholesalePrice.value
})

const selectedSkuPromotionPrice = computed(() => {
  if (!selectedSku.value || !hasSkuPromotionPrice(selectedSku.value)) return null
  return getSkuPromotionPriceAmount(selectedSku.value)
})

const selectedSkuPromotionMemberPrice = computed(() => {
  if (!product.value || !selectedSku.value || selectedSkuPromotionPrice.value === null) return null
  const skuId = normalizeSkuId(selectedSku.value.id)
  return getMemberPriceForSku(skuId, selectedSkuPromotionPrice.value)
})

const selectedSkuPromotionFinalIsMember = computed(() => selectedSkuPromotionMemberPrice.value !== null)

const selectedSkuPromotionFinalPrice = computed(() => {
  if (selectedSkuPromotionPrice.value === null) return null
  if (selectedSkuPromotionMemberPrice.value !== null) return selectedSkuPromotionMemberPrice.value
  return selectedSkuPromotionPrice.value
})

const showSelectedSkuMemberBadge = computed(() => {
  if (!selectedSku.value) return false
  if (hasSelectedSkuWholesalePrice.value) return selectedSkuWholesaleFinalIsMember.value
  if (hasSkuPromotionPrice(selectedSku.value)) return selectedSkuPromotionFinalIsMember.value
  return hasMemberPrice.value
})

const formatWholesaleTier = (tier: any) => {
  return t('products.wholesaleTier', {
    count: Number(tier?.min_quantity || 0),
    price: formatPrice(tier?.unit_price, siteCurrency.value),
  })
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

const normalizeOptionalLimitNumber = (value: unknown) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return null
  const integerValue = Math.floor(numberValue)
  if (integerValue <= 0) return null
  return integerValue
}

const shouldEnforceSkuStock = (sku: any) => {
  if (!sku) return false
  if (sku?.stock_quantity_hidden === true || product.value?.stock_quantity_hidden === true) return false
  if (product.value?.fulfillment_type === 'auto') return true
  if (product.value?.fulfillment_type === 'upstream') return true
  if (product.value?.fulfillment_type !== 'manual') return false
  const total = normalizeManualStockTotal(sku?.manual_stock_total)
  if (total === -1) return false
  return true
}

const skuAvailableStock = (sku: any) => {
  if (!sku) return 0
  if (!shouldEnforceSkuStock(sku) && !sku?.stock_quantity_hidden) return null
  return resolveSkuAvailableStock(product.value, sku)
}

const isSkuPurchasable = (sku: any) => {
  const available = skuAvailableStock(sku)
  if (available === null) return true
  return available > 0
}

const skuStockText = (sku: any) => {
  const display = resolveSkuStockDisplay(product.value, sku)
  return formatSkuStockDisplay(display)
}

const formatSkuStockDisplay = (display: PublicStockDisplay) => {
  switch (display.kind) {
    case 'unlimited':
      return t('productDetail.skuStockUnlimited')
    case 'out':
      return t('productDetail.skuStockOut')
    case 'remaining':
      return t('productDetail.skuStockRemaining', { count: display.count })
    case 'low_stock':
      return t('productDetail.skuStockLow')
    case 'hidden':
      return t('productDetail.skuStockHidden')
    case 'range':
      return t('productDetail.skuStockRange', { min: display.min, max: display.max })
    case 'range_plus':
      return t('productDetail.skuStockRangePlus', { min: display.min })
    case 'in_stock':
    default:
      return t('productDetail.skuStockInStock')
  }
}

const skuStockBadgeClass = (sku: any) => {
  const display = resolveSkuStockDisplay(product.value, sku)
  if (display.kind === 'unlimited' || display.kind === 'hidden') return 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
  if (display.kind === 'out') return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-300'
  if (display.kind === 'low_stock' || (display.kind === 'range' && display.max <= 5)) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
}

const quantityEffectiveLimit = computed(() => {
  const sku = selectedSku.value
  const available = skuAvailableStock(sku)
  const productLimit = normalizeOptionalLimitNumber(product.value?.max_purchase_quantity)
  let limit: number | null = productLimit
  if (available !== null) {
    limit = limit === null ? available : Math.min(limit, available)
  }
  return limit
})

const quantityEffectiveMin = computed(() => {
  const productMin = normalizeOptionalLimitNumber(product.value?.min_purchase_quantity)
  return productMin && productMin > 0 ? productMin : 1
})

const handleQuantityInput = (event: Event) => {
  const val = parseInt((event.target as HTMLInputElement).value, 10)
  const minimum = quantityEffectiveMin.value
  if (isNaN(val) || val < minimum) {
    quantity.value = minimum
  } else if (quantityEffectiveLimit.value !== null && val > quantityEffectiveLimit.value) {
    quantity.value = quantityEffectiveLimit.value
  } else {
    quantity.value = val
  }
}

const purchaseType = computed(() => product.value?.purchase_type || 'member')
const requiresLogin = computed(() => purchaseType.value === 'member' && !userAuthStore.isAuthenticated)
const requiresSKUSelection = computed(() => activeSkus.value.length > 1 && !selectedSku.value)
const stockBelowMinPurchase = computed(() => {
  const limit = quantityEffectiveLimit.value
  if (limit === null) return false
  return limit < quantityEffectiveMin.value
})
const canPurchase = computed(() => {
  if (!product.value) return false
  if (activeSkus.value.length === 0) return false
  if (product.value.is_sold_out) return false
  if (requiresSKUSelection.value) return false
  if (product.value.stock_status === 'out_of_stock') return false
  if (selectedSku.value && !isSkuPurchasable(selectedSku.value)) return false
  if (stockBelowMinPurchase.value) return false
  return true
})
const cannotPurchaseReason = computed(() => {
  if (!product.value) return ''
  if (requiresLogin.value) return ''
  if (requiresSKUSelection.value) return t('productDetail.skuRequired')
  if (stockBelowMinPurchase.value) return t('productDetail.stockBelowMinPurchase', { count: quantityEffectiveMin.value })
  if (canPurchase.value) return ''
  return t('productDetail.stockUnavailable')
})
const categoryName = computed(() => {
  const category = product.value?.category?.name
  return category ? getLocalizedText(category) : ''
})

const images = computed(() => {
  if (!product.value?.images) return []
  let imageArray: string[] = []
  if (Array.isArray(product.value.images)) {
    imageArray = product.value.images
  } else if (product.value.images.images && Array.isArray(product.value.images.images)) {
    imageArray = product.value.images.images
  }
  return imageArray.map(img => getImageUrl(img))
})

const skuDisplayText = (sku: any) => {
  return buildSkuDisplayText({
    skuCode: sku?.sku_code,
    specValues: sku?.spec_values,
    fallback: t('productDetail.skuFallback'),
    locale: appStore.locale,
  })
}

const syncSelectedSku = () => {
  const rows = activeSkus.value
  if (rows.length === 0) {
    selectedSkuId.value = 0
    return
  }
  if (rows.length === 1) {
    selectedSkuId.value = normalizeSkuId(rows[0]?.id)
    return
  }
  if (rows.some((sku: any) => normalizeSkuId(sku?.id) === selectedSkuId.value)) {
    return
  }
  const firstAvailable = rows.find((sku: any) => isSkuPurchasable(sku))
  if (firstAvailable) {
    selectedSkuId.value = normalizeSkuId(firstAvailable?.id)
    return
  }
  selectedSkuId.value = normalizeSkuId(rows[0]?.id)
}

const selectedCartQuantity = () => {
  if (!product.value || !selectedSku.value) return 0
  const productId = Number(product.value.id || 0)
  const skuId = normalizeSkuId(selectedSku.value?.id)
  if (productId <= 0 || skuId <= 0) return 0
  const matched = cartStore.items.find((item) => item.productId === productId && normalizeSkuId(item.skuId) === skuId)
  return Number(matched?.quantity || 0)
}

const addToCart = () => {
  if (!product.value) return
  if (!canPurchase.value) return
  purchaseWarning.value = ''
  if (requiresLogin.value) {
    router.push(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  const sku = selectedSku.value
  const available = skuAvailableStock(sku)
  const cartQty = selectedCartQuantity()
  const nextQuantity = cartQty + quantity.value
  const productLimit = normalizeOptionalLimitNumber(product.value?.max_purchase_quantity)
  let effectiveLimit: number | null = productLimit
  if (available !== null) {
    effectiveLimit = effectiveLimit === null ? available : Math.min(effectiveLimit, available)
  }
  if (effectiveLimit !== null && nextQuantity > effectiveLimit) {
    if (available !== null && effectiveLimit === available && (productLimit === null || available <= productLimit)) {
      purchaseWarning.value = available > 0
        ? (cartQty > 0
            ? t('productDetail.addCartStockExceededWithCart', { count: available, cartCount: cartQty })
            : t('productDetail.addCartStockExceeded', { count: available }))
        : t('productDetail.stockUnavailable')
      return
    }
    purchaseWarning.value = cartQty > 0
      ? t('productDetail.addCartLimitExceededWithCart', { count: effectiveLimit, cartCount: cartQty })
      : t('productDetail.addCartLimitExceeded', { count: effectiveLimit })
    return
  }
  cartStore.addItem({
    productId: product.value.id,
    skuId: normalizeSkuId(sku?.id),
    skuCode: String(sku?.sku_code || ''),
    skuSpecValues: (sku?.spec_values && typeof sku.spec_values === 'object') ? sku.spec_values : undefined,
    skuManualStockTotal: normalizeManualStockTotal(sku?.manual_stock_total),
    skuManualStockLocked: normalizeStockNumber(sku?.manual_stock_locked),
    skuManualStockSold: normalizeStockNumber(sku?.manual_stock_sold),
    skuAutoStockAvailable: normalizeStockNumber(sku?.auto_stock_available),
    skuUpstreamStock: normalizeManualStockTotal(sku?.upstream_stock),
    skuStockStatus: String(sku?.stock_status || ''),
    skuStockDisplayMode: String(sku?.stock_display_mode || product.value?.stock_display_mode || ''),
    skuStockDisplay: String(sku?.stock_display || ''),
    skuStockRangeMin: normalizeStockNumber(sku?.stock_range_min) || undefined,
    skuStockRangeMax: normalizeStockNumber(sku?.stock_range_max) || undefined,
    skuStockQuantityHidden: Boolean(sku?.stock_quantity_hidden || product.value?.stock_quantity_hidden),
    skuStockEnforced: shouldEnforceSkuStock(sku),
    slug: product.value.slug,
    title: product.value.title,
    priceAmount: String(sku?.price_amount || product.value.price_amount || '0.00'),
    wholesalePrices: Array.isArray(product.value.wholesale_prices) ? product.value.wholesale_prices : undefined,
    image: images.value[0],
    minPurchaseQuantity: normalizeOptionalLimitNumber(product.value.min_purchase_quantity) ?? undefined,
    maxPurchaseQuantity: normalizeOptionalLimitNumber(product.value.max_purchase_quantity) ?? undefined,
    purchaseType: product.value.purchase_type,
    fulfillmentType: product.value.fulfillment_type,
    manualFormSchema: product.value.manual_form_schema || {},
    paymentChannelIds: Array.isArray(product.value.payment_channel_ids) && product.value.payment_channel_ids.length > 0 ? product.value.payment_channel_ids : undefined,
    quantity: quantity.value,
  }, quantity.value)
  toast.success(t('toast.addedToCart'))
}

const buyNow = () => {
  purchaseWarning.value = ''
  if (!canPurchase.value) return
  if (!product.value) return
  if (requiresLogin.value) {
    router.push(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  const sku = selectedSku.value
  const available = skuAvailableStock(sku)
  const productLimit = normalizeOptionalLimitNumber(product.value?.max_purchase_quantity)
  let limit: number | null = productLimit
  if (available !== null) {
    limit = limit === null ? available : Math.min(limit, available)
  }
  if (limit !== null && quantity.value > limit) {
    purchaseWarning.value = available !== null && limit === available
      ? (available > 0 ? t('productDetail.addCartStockExceeded', { count: available }) : t('productDetail.stockUnavailable'))
      : t('productDetail.addCartLimitExceeded', { count: limit })
    return
  }

  buyNowStore.setItem({
    productId: product.value.id,
    skuId: normalizeSkuId(sku?.id),
    skuCode: String(sku?.sku_code || ''),
    skuSpecValues: (sku?.spec_values && typeof sku.spec_values === 'object') ? sku.spec_values : undefined,
    skuManualStockTotal: normalizeManualStockTotal(sku?.manual_stock_total),
    skuManualStockLocked: normalizeStockNumber(sku?.manual_stock_locked),
    skuManualStockSold: normalizeStockNumber(sku?.manual_stock_sold),
    skuAutoStockAvailable: normalizeStockNumber(sku?.auto_stock_available),
    skuUpstreamStock: normalizeManualStockTotal(sku?.upstream_stock),
    skuStockStatus: String(sku?.stock_status || ''),
    skuStockDisplayMode: String(sku?.stock_display_mode || product.value?.stock_display_mode || ''),
    skuStockDisplay: String(sku?.stock_display || ''),
    skuStockRangeMin: normalizeStockNumber(sku?.stock_range_min) || undefined,
    skuStockRangeMax: normalizeStockNumber(sku?.stock_range_max) || undefined,
    skuStockQuantityHidden: Boolean(sku?.stock_quantity_hidden || product.value?.stock_quantity_hidden),
    skuStockEnforced: shouldEnforceSkuStock(sku),
    slug: product.value.slug,
    title: product.value.title,
    priceAmount: String(sku?.price_amount || product.value.price_amount || '0.00'),
    wholesalePrices: Array.isArray(product.value.wholesale_prices) ? product.value.wholesale_prices : undefined,
    image: images.value[0],
    minPurchaseQuantity: normalizeOptionalLimitNumber(product.value.min_purchase_quantity) ?? undefined,
    maxPurchaseQuantity: normalizeOptionalLimitNumber(product.value.max_purchase_quantity) ?? undefined,
    purchaseType: product.value.purchase_type,
    fulfillmentType: product.value.fulfillment_type,
    manualFormSchema: product.value.manual_form_schema || {},
    paymentChannelIds: Array.isArray(product.value.payment_channel_ids) && product.value.payment_channel_ids.length > 0 ? product.value.payment_channel_ids : undefined,
    quantity: quantity.value,
  })
  router.push('/checkout?mode=buynow')
}

// Mobile bar price display computed properties
const mobileBarShowMemberPrice = computed(() => {
  if (!selectedSku.value) return false
  if (hasSelectedSkuWholesalePrice.value) return selectedSkuWholesaleFinalIsMember.value
  if (hasSkuPromotionPrice(selectedSku.value)) return selectedSkuPromotionFinalIsMember.value
  return hasMemberPrice.value
})
const mobileBarMemberPriceDisplay = computed(() => {
  if (hasSelectedSkuWholesalePrice.value && selectedSkuWholesaleFinalIsMember.value) {
    return formatPrice(selectedSkuWholesaleFinalPrice.value, siteCurrency.value)
  }
  if (selectedSku.value && hasSkuPromotionPrice(selectedSku.value) && selectedSkuPromotionFinalIsMember.value) {
    return formatPrice(selectedSkuPromotionFinalPrice.value, siteCurrency.value)
  }
  if (!selectedSkuMemberPrice.value) return ''
  return formatPrice(selectedSkuMemberPrice.value, siteCurrency.value)
})
const mobileBarShowSkuPromotionPrice = computed(() => {
  if (mobileBarShowMemberPrice.value) return false
  if (hasSelectedSkuWholesalePrice.value) return false
  return !!selectedSku.value && hasSkuPromotionPrice(selectedSku.value)
})
const mobileBarSkuPromotionPriceDisplay = computed(() => {
  if (!selectedSku.value) return ''
  return formatPrice(getSkuPromotionPriceAmount(selectedSku.value), siteCurrency.value)
})
const mobileBarShowSkuPrice = computed(() => {
  if (mobileBarShowMemberPrice.value || mobileBarShowSkuPromotionPrice.value) return false
  return !!selectedSku.value
})
const mobileBarSkuPriceDisplay = computed(() => {
  if (!selectedSku.value) return ''
  return formatPrice(selectedSku.value.price_amount, siteCurrency.value)
})
const mobileBarShowProductPromotionPrice = computed(() => {
  if (selectedSku.value) return false
  return product.value ? hasPromotionPrice(product.value) : false
})
const mobileBarProductPromotionPriceDisplay = computed(() => {
  if (!product.value) return ''
  return formatPrice(getPromotionPriceAmount(product.value), siteCurrency.value)
})
const mobileBarProductPriceDisplay = computed(() => {
  if (!product.value) return ''
  return formatPrice(product.value.price_amount, siteCurrency.value)
})

const goLogin = () => {
  router.push(`/auth/login?redirect=${encodeURIComponent(route.fullPath)}`)
}

const loadProduct = async () => {
  loading.value = true
  try {
    const slug = route.params.slug as string
    const response = await productAPI.detail(slug)
    product.value = response.data.data || null
    if (images.value.length > 0) {
      currentImage.value = images.value[0] || ''
    }
    syncSelectedSku()
    // Setup IntersectionObserver after product loads
    await nextTick()
    setupMobileBarObserver()
  } catch (error) {
    console.error('Failed to load product:', error)
    product.value = null
    selectedSkuId.value = 0
  } finally {
    loading.value = false
  }
}

const setupMobileBarObserver = () => {
  if (observer) observer.disconnect()
  if (!purchaseActionsRef.value) return
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry) {
        showMobileBar.value = !entry.isIntersecting
      }
    },
    { threshold: 0.1 }
  )
  observer.observe(purchaseActionsRef.value)
}

const debouncedLoadProduct = debounceAsync(loadProduct, 300)

const canonicalUrl = computed(() => {
  if (!product.value?.slug) return ''
  const fromConfig = String(appStore.config?.brand?.site_url || '').trim().replace(/\/+$/, '')
  const base = fromConfig || window.location.origin.replace(/\/+$/, '')
  return `${base}/products/${product.value.slug}`
})

useHead({
  title: () => product.value ? getLocalizedText(product.value.title) : '',
  link: () => {
    if (!canonicalUrl.value) return []
    return [{ rel: 'canonical', href: canonicalUrl.value }]
  },
  meta: () => {
    if (!product.value) return []
    const seoMeta = product.value.seo_meta || {}
    const seoKeywords = getLocalizedText(seoMeta.keywords) || (typeof seoMeta.keywords === 'string' ? seoMeta.keywords : '')
    const seoDescription = getLocalizedText(seoMeta.description) || (typeof seoMeta.description === 'string' ? seoMeta.description : '')
    const tags = []

    if (seoKeywords) tags.push({ name: 'keywords', content: seoKeywords })
    if (seoDescription) tags.push({ name: 'description', content: seoDescription })

    tags.push({ property: 'og:type', content: 'product' })
    if (product.value.title) {
      tags.push({ property: 'og:title', content: getLocalizedText(product.value.title) })
    }
    if (seoDescription) {
      tags.push({ property: 'og:description', content: seoDescription })
    }
    if (images.value && images.value.length > 0) {
      tags.push({ property: 'og:image', content: images.value[0] })
    }
    if (canonicalUrl.value) {
      tags.push({ property: 'og:url', content: canonicalUrl.value })
    }

    tags.push({ name: 'twitter:card', content: 'summary_large_image' })
    if (product.value.title) {
      tags.push({ name: 'twitter:title', content: getLocalizedText(product.value.title) })
    }
    if (seoDescription) {
      tags.push({ name: 'twitter:description', content: seoDescription })
    }
    if (images.value && images.value.length > 0) {
      tags.push({ name: 'twitter:image', content: images.value[0] })
    }

    return tags
  },
  script: () => {
    if (!product.value) return []
    const title = getLocalizedText(product.value.title)
    const seoMeta = product.value.seo_meta || {}
    const description = getLocalizedText(seoMeta.description) || (typeof seoMeta.description === 'string' ? seoMeta.description : '')
    const priceAmount = product.value.price_amount || '0'
    const currency = siteCurrency.value || 'CNY'

    const jsonLd: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
      url: canonicalUrl.value || window.location.href,
      offers: {
        '@type': 'Offer',
        price: priceAmount,
        priceCurrency: currency,
        availability: product.value.stock_status === 'out_of_stock'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      },
    }
    if (description) jsonLd.description = description
    if (images.value.length > 0) jsonLd.image = images.value
    if (product.value.category?.name) {
      jsonLd.category = getLocalizedText(product.value.category.name)
    }

    return [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify(jsonLd),
    }]
  },
})

onMounted(() => {
  loadProduct()
  ensureMemberLevels()
})

watch(userMemberLevelId, () => {
  ensureMemberLevels()
})

watch(
  () => selectedSkuId.value,
  () => {
    purchaseWarning.value = ''
    quantity.value = quantityEffectiveMin.value
  }
)

watch(quantityEffectiveMin, (minimum) => {
  if (minimum > quantity.value) {
    quantity.value = minimum
  }
})

watch(quantityEffectiveLimit, (limit) => {
  if (limit !== null && quantity.value > limit) {
    quantity.value = Math.max(quantityEffectiveMin.value, limit)
  }
})

onUnmounted(() => {
  debouncedLoadProduct.cancel()
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>
