<template>
  <div class="min-h-screen bg-background text-foreground pt-24 pb-16">
    <div class="container mx-auto px-4">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-black text-foreground mb-2">{{ t('rechargeOrder.title') }}</h1>
          <p class="text-muted-foreground text-sm">{{ t('rechargeOrder.subtitle') }}</p>
        </div>
        <router-link to="/me/orders" class="text-muted-foreground transition-colors hover:text-foreground text-sm">{{ t('rechargeOrder.backList') }}</router-link>
      </div>

      <div v-if="loading" class="h-40 border bg-muted rounded-2xl animate-pulse"></div>

      <EmptyState
        v-else-if="!recharge"
        icon="alert"
        :title="t('rechargeOrder.notFound')"
        :action-label="t('errorBoundary.retry')"
        @action="loadDetail()"
      />

      <div v-else class="space-y-6">
        <!-- 头部信息 -->
        <div class="bg-card rounded-2xl p-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ t('personalCenter.wallet.rechargeNoLabel') }}</div>
              <div class="text-sm font-semibold text-foreground mt-1">{{ recharge.recharge_no }}</div>
              <div class="text-xs text-muted-foreground mt-2">{{ t('rechargeOrder.createdAtLabel') }}：{{ formatDate(recharge.created_at) }}</div>
            </div>
            <div class="flex flex-col items-start md:items-end gap-2">
              <div class="text-xs uppercase tracking-wider text-muted-foreground">{{ t('rechargeOrder.rechargeAmount') }}</div>
              <div class="text-lg font-bold text-foreground">{{ formatMoney(recharge.amount, recharge.currency) }}</div>
            </div>
            <div class="flex items-center gap-3">
              <Badge :variant="rechargeStatusVariant(recharge.status)" size="sm">
                {{ rechargeStatusText(recharge.status) }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- 金额明细 -->
        <div class="bg-card rounded-2xl p-6">
          <h2 class="text-lg font-bold mb-4">{{ t('rechargeOrder.amountTitle') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div class="bg-secondary border rounded-xl p-4">
              <div class="text-xs text-muted-foreground">{{ t('rechargeOrder.rechargeAmount') }}</div>
              <div class="text-foreground font-mono mt-1">{{ formatMoney(recharge.amount, recharge.currency) }}</div>
            </div>
            <div class="bg-secondary border rounded-xl p-4">
              <div class="text-xs text-muted-foreground">{{ t('payment.feeRateLabel') }}</div>
              <div class="text-foreground font-mono mt-1">{{ feeRateDisplay }}</div>
            </div>
            <div class="bg-secondary border rounded-xl p-4">
              <div class="text-xs text-muted-foreground">{{ t('payment.feeAmountLabel') }}</div>
              <div class="text-foreground font-mono mt-1">{{ formatMoney(recharge.fee_amount, recharge.currency) }}</div>
            </div>
            <div class="bg-secondary border rounded-xl p-4">
              <div class="text-xs text-muted-foreground">{{ t('personalCenter.wallet.payAmountLabel') }}</div>
              <div class="text-foreground font-mono mt-1 font-bold">{{ formatMoney(recharge.payable_amount, recharge.currency) }}</div>
            </div>
          </div>
        </div>

        <!-- 时间信息 -->
        <div class="bg-card rounded-2xl p-6">
          <h2 class="text-lg font-bold mb-4">{{ t('rechargeOrder.timeTitle') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div class="bg-secondary border rounded-xl p-4">
              <div class="text-xs text-muted-foreground">{{ t('rechargeOrder.createdAtLabel') }}</div>
              <div class="text-foreground font-mono mt-1">{{ formatDate(recharge.created_at) }}</div>
            </div>
            <div v-if="recharge.paid_at" class="bg-secondary border rounded-xl p-4">
              <div class="text-xs text-muted-foreground">{{ t('rechargeOrder.paidAtLabel') }}</div>
              <div class="text-foreground font-mono mt-1">{{ formatDate(recharge.paid_at) }}</div>
            </div>
            <div v-if="payment?.expires_at" class="bg-secondary border rounded-xl p-4">
              <div class="text-xs text-muted-foreground">{{ t('payment.expiresAt') }}</div>
              <div class="text-foreground font-mono mt-1">{{ formatDate(payment.expires_at) }}</div>
            </div>
          </div>
        </div>

        <!-- 备注 -->
        <div v-if="recharge.remark" class="bg-card rounded-2xl p-6">
          <h2 class="text-lg font-bold mb-2">{{ t('rechargeOrder.remarkLabel') }}</h2>
          <p class="text-sm text-muted-foreground">{{ recharge.remark }}</p>
        </div>

        <!-- 支付区域（仅待支付状态） -->
        <div v-if="isPending" class="bg-card rounded-2xl p-6">
          <h2 class="text-lg font-bold mb-4">{{ t('rechargeOrder.paymentTitle') }}</h2>
          <div v-if="isPending" class="mb-3 text-xs text-muted-foreground">
            {{ t('personalCenter.wallet.pendingHint') }}
          </div>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div v-if="showQRCode" class="rounded-xl border bg-secondary p-4">
              <div class="mb-3 text-sm font-semibold text-foreground">{{ t('payment.qrTitle') }}</div>
              <div class="flex items-center justify-center">
                <img :src="qrImageUrl" alt="Recharge QR" class="h-52 w-52 object-contain" />
              </div>
              <div v-if="qrUsingPayLinkFallback" class="mt-3 text-xs text-muted-foreground">
                {{ t('payment.qrFallbackHint') }}
              </div>
            </div>
            <div class="rounded-xl border bg-secondary p-4">
              <div v-if="hasCryptoPaymentDetails" class="space-y-2 rounded-xl border bg-white/5 p-3 text-sm">
                <div
                  v-for="item in cryptoPaymentDetails"
                  :key="item.key"
                  class="flex flex-col gap-1 border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <span class="text-xs text-muted-foreground">{{ item.label }}</span>
                  <span class="min-w-0 font-semibold text-foreground break-all">
                    {{ item.value }}
                    <span v-if="item.detail" class="ml-1 font-normal text-muted-foreground">({{ item.detail }})</span>
                  </span>
                </div>
                <div v-if="cryptoWalletAddress" class="flex flex-wrap items-center gap-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" @click="handleCopyWalletAddress">
                    {{ t('payment.copyWalletAddress') }}
                  </Button>
                  <span v-if="walletAddressCopied" class="text-xs text-emerald-500">{{ t('payment.copied') }}</span>
                </div>
              </div>
              <div class="mt-4 flex flex-wrap items-center gap-3">
                <Button v-if="payLink" type="button" variant="secondary" size="sm" @click="handleOpenPayLink">
                  {{ t('payment.openPayLink') }}
                </Button>
                <Button type="button" variant="secondary" size="sm" :disabled="checkingPayment" @click="checkPayment">
                  {{ checkingPayment ? t('personalCenter.wallet.checkingPayStatus') : t('personalCenter.wallet.checkPayStatus') }}
                </Button>
              </div>
              <div v-if="payLink" class="mt-3 text-xs text-muted-foreground break-all">
                {{ t('payment.payLinkLabel') }}：{{ payLink }}
              </div>
              <div v-if="showTelegramPayHint" class="mt-3 text-xs text-muted-foreground">
                {{ t('payment.telegramExternalHint') }}
              </div>
            </div>
          </div>
        </div>

        <!-- 支付成功提示 -->
        <div v-if="recharge.status === 'success'" class="bg-card rounded-2xl p-6 border-l-4 border-green-500">
          <p class="text-sm font-semibold text-foreground">{{ t('personalCenter.wallet.rechargeSuccess') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { walletAPI } from '../api/wallet'
import { useTelegramMiniAppStore } from '../stores/telegramMiniApp'
import { copyText } from '../utils/clipboard'
import { basisPointsToPercent, rateToBasisPoints } from '../utils/money'
import type { BadgeTone } from '../utils/status'
import QRCode from 'qrcode'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import EmptyState from '../components/EmptyState.vue'

const { t } = useI18n()
const route = useRoute()
const telegramMiniAppStore = useTelegramMiniAppStore()

const loading = ref(true)
const checkingPayment = ref(false)
const recharge = ref<any>(null)
const payment = ref<any>(null)
const pollTimer = ref<number | null>(null)
const walletAddressCopied = ref(false)
const walletAddressCopiedTimer = ref<number | null>(null)
const qrImageUrl = ref('')
const qrRenderVersion = ref(0)

const rechargeNo = computed(() => String(route.params.recharge_no || '').trim())

const isPending = computed(() => {
  const status = String(recharge.value?.status || '').toLowerCase()
  return status === 'pending' || status === 'initiated'
})

const payLink = computed(() => String(payment.value?.pay_url || '').trim())
const interactionMode = computed(() => String(payment.value?.interaction_mode || '').toLowerCase())
const isTelegramMiniApp = computed(() => telegramMiniAppStore.isMiniApp && telegramMiniAppStore.isReady)
const showTelegramPayHint = computed(() => isTelegramMiniApp.value && Boolean(payLink.value))

const qrCodeContent = computed(() => String(payment.value?.qr_code || '').trim())
const qrFallbackContent = computed(() => {
  if (interactionMode.value === 'redirect') return ''
  if (qrCodeContent.value) return ''
  return payLink.value
})
const qrDisplayContent = computed(() => qrCodeContent.value || qrFallbackContent.value)
const qrUsingPayLinkFallback = computed(() => Boolean(!qrCodeContent.value && qrFallbackContent.value))
const showQRCode = computed(() => interactionMode.value !== 'redirect' && Boolean(qrImageUrl.value))
const cryptoWalletAddress = computed(() => String(payment.value?.wallet_address || '').trim())
const cryptoChainAmount = computed(() => String(payment.value?.chain_amount || '').trim())
const cryptoChain = computed(() => String(payment.value?.chain || '').trim())
const cryptoTokenID = computed(() => String(payment.value?.token_id || '').trim())
const cryptoTokenLabel = computed(() => {
  const tokenID = cryptoTokenID.value
  if (!tokenID) return ''
  const parts = tokenID.split('-').filter(Boolean)
  return String(parts[parts.length - 1] || tokenID).toUpperCase()
})
const cryptoTokenDetail = computed(() => {
  if (!cryptoTokenID.value) return ''
  return cryptoTokenID.value.toUpperCase() === cryptoTokenLabel.value ? '' : cryptoTokenID.value
})
const formatCryptoChain = (value: string) => {
  const normalized = value.trim().toLowerCase()
  const labels: Record<string, string> = {
    tron: 'TRON',
    trc20: 'TRON',
    base: 'Base',
    ethereum: 'Ethereum',
    eth: 'Ethereum',
    bsc: 'BNB Smart Chain',
    polygon: 'Polygon',
  }
  return labels[normalized] || value
}
const cryptoPaymentDetails = computed(() => {
  const details: Array<{ key: string; label: string; value: string; detail?: string }> = []
  if (cryptoTokenLabel.value) {
    details.push({ key: 'token', label: t('payment.cryptoToken'), value: cryptoTokenLabel.value, detail: cryptoTokenDetail.value })
  }
  if (cryptoChain.value) {
    details.push({ key: 'chain', label: t('payment.cryptoChain'), value: formatCryptoChain(cryptoChain.value) })
  }
  if (cryptoChainAmount.value) {
    details.push({ key: 'amount', label: t('payment.cryptoAmount'), value: cryptoChainAmount.value })
  }
  if (cryptoWalletAddress.value) {
    details.push({ key: 'wallet_address', label: t('payment.walletAddress'), value: cryptoWalletAddress.value })
  }
  return details
})
const hasCryptoPaymentDetails = computed(() => cryptoPaymentDetails.value.length > 0)

const feeRateDisplay = computed(() => {
  const rate = rateToBasisPoints(recharge.value?.fee_rate ?? payment.value?.fee_rate)
  if (rate === null) return '0.00%'
  return `${basisPointsToPercent(rate)}%`
})

const rechargeStatusText = (status?: string) => {
  const normalized = String(status || '').toLowerCase()
  const key = `personalCenter.wallet.rechargeStatus.${normalized}`
  const translated = t(key)
  if (translated === key) return normalized || '-'
  return translated
}

const rechargeStatusVariant = (status?: string): BadgeTone => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'success') return 'success'
  if (normalized === 'failed' || normalized === 'expired') return 'danger'
  return 'warning'
}

const formatMoney = (amount?: string, currency?: string) => {
  if (amount === null || amount === undefined || amount === '') return '-'
  if (currency === null || currency === undefined || currency === '') return String(amount)
  return `${amount} ${currency}`
}

const formatDate = (raw?: string) => {
  if (!raw) return ''
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw
  return date.toLocaleString()
}

const syncPayload = (payload: any) => {
  recharge.value = payload?.recharge || recharge.value
  const paymentData = payload?.payment || (payload?.payment_id != null ? {
    id: payload.payment_id,
    provider_type: payload.provider_type,
    channel_type: payload.channel_type,
    interaction_mode: payload.interaction_mode,
    pay_url: payload.pay_url,
    qr_code: payload.qr_code,
    expires_at: payload.expires_at,
    status: payload.status,
  } : undefined)
  if (paymentData) {
    payment.value = paymentData
  }
}

const loadDetail = async () => {
  if (!rechargeNo.value) return
  loading.value = true
  try {
    const response = await walletAPI.rechargeDetail(rechargeNo.value)
    const payload = response.data.data || {}
    syncPayload(payload)
  } catch {
    recharge.value = null
  } finally {
    loading.value = false
  }
}

const refreshStatus = async (silent = false) => {
  if (!rechargeNo.value) return
  try {
    const response = await walletAPI.rechargeDetail(rechargeNo.value)
    const payload = response.data.data || {}
    syncPayload(payload)

    const status = String(recharge.value?.status || '').toLowerCase()
    if (status === 'success' || status === 'failed' || status === 'expired') {
      stopPolling()
    } else {
      startPolling()
    }
  } catch (err: any) {
    if (!silent) {
      console.error('Failed to refresh recharge status:', err)
    }
  }
}

const checkPayment = async () => {
  const paymentID = Number(payment.value?.id || payment.value?.payment_id || 0)
  if (!Number.isFinite(paymentID) || paymentID <= 0) return
  checkingPayment.value = true
  try {
    const response = await walletAPI.captureRechargePayment(paymentID)
    const payload = response.data.data || {}
    syncPayload(payload)
    await refreshStatus(true)
  } catch (err: any) {
    console.error('Failed to check payment:', err)
  } finally {
    checkingPayment.value = false
  }
}

const startPolling = () => {
  if (!isPending.value || pollTimer.value) return
  pollTimer.value = window.setInterval(() => {
    void refreshStatus(true)
  }, 5000)
}

const stopPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
    pollTimer.value = null
  }
}

const handleOpenPayLink = () => {
  if (!payLink.value) return
  if (isTelegramMiniApp.value) {
    try {
      window.Telegram?.WebApp?.openLink?.(payLink.value)
    } catch {
      window.open(payLink.value, '_blank')
    }
  } else {
    window.open(payLink.value, '_blank')
  }
}

const handleCopyWalletAddress = async () => {
  if (!cryptoWalletAddress.value) return
  try {
    await copyText(cryptoWalletAddress.value)
    walletAddressCopied.value = true
    if (walletAddressCopiedTimer.value) {
      window.clearTimeout(walletAddressCopiedTimer.value)
    }
    walletAddressCopiedTimer.value = window.setTimeout(() => {
      walletAddressCopied.value = false
      walletAddressCopiedTimer.value = null
    }, 1500)
  } catch {
    window.alert(t('payment.copyFailed'))
  }
}

const renderQRCodeImage = async () => {
  const qr = qrDisplayContent.value
  const currentVersion = qrRenderVersion.value + 1
  qrRenderVersion.value = currentVersion
  if (!qr) {
    qrImageUrl.value = ''
    return
  }
  if (qr.startsWith('data:image/')) {
    qrImageUrl.value = qr
    return
  }
  const isImageURL = /^https?:\/\/.+\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(qr)
  if (isImageURL) {
    qrImageUrl.value = qr
    return
  }
  try {
    const dataURL = await QRCode.toDataURL(qr, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
    if (currentVersion !== qrRenderVersion.value) return
    qrImageUrl.value = dataURL
  } catch {
    if (currentVersion !== qrRenderVersion.value) return
    qrImageUrl.value = ''
  }
}

watch(() => qrDisplayContent.value, () => { void renderQRCodeImage() }, { immediate: true })

onMounted(async () => {
  await loadDetail()
  if (isPending.value) {
    startPolling()
    // Auto-redirect for redirect mode
    if (payLink.value && interactionMode.value === 'redirect') {
      handleOpenPayLink()
    }
  }
})

onUnmounted(() => {
  stopPolling()
  if (walletAddressCopiedTimer.value) {
    window.clearTimeout(walletAddressCopiedTimer.value)
    walletAddressCopiedTimer.value = null
  }
})
</script>
