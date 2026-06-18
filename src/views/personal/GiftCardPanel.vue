<template>
  <div class="space-y-6 gift-card-panel-enter">
    <div class="rounded-2xl border bg-card p-7 shadow-sm overflow-hidden">
      <div class="relative">
        <div class="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl"></div>
        <div class="pointer-events-none absolute -bottom-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-sky-400/10 blur-2xl"></div>
        <div class="relative">
          <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 class="text-xl font-bold text-foreground">{{ t('personalCenter.giftCard.title') }}</h2>
              <p class="mt-1 text-sm text-muted-foreground">{{ t('personalCenter.giftCard.subtitle') }}</p>
            </div>
            <Badge variant="accent" size="sm">
              {{ t('personalCenter.tabs.giftCard') }}
            </Badge>
          </div>

          <Alert v-if="panelAlert" class="mb-5" :variant="pageAlertVariant(panelAlert.level)" :class="pageAlertToneClass(panelAlert.level)">
            <AlertDescription>{{ panelAlert.message }}</AlertDescription>
          </Alert>

          <div
            v-if="lastRedeem"
            class="mb-6 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4 shadow-sm success-burst dark:border-emerald-500/20 dark:bg-emerald-500/10"
          >
            <div class="flex items-start gap-3">
              <div class="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
                <Check class="h-4 w-4" />
              </div>
              <div class="flex-1 space-y-2">
                <h3 class="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{{ t('personalCenter.giftCard.successTitle') }}</h3>
                <div class="grid grid-cols-1 gap-2 text-xs text-emerald-700/90 dark:text-emerald-200 md:grid-cols-3">
                  <div>
                    <div class="opacity-75">{{ t('personalCenter.giftCard.successCode') }}</div>
                    <div class="mt-0.5 font-mono">{{ String(lastRedeem.gift_card?.code || '-').toUpperCase() }}</div>
                  </div>
                  <div>
                    <div class="opacity-75">{{ t('personalCenter.giftCard.successAmount') }}</div>
                    <div class="mt-0.5 font-semibold">{{ redeemedAmountText }}</div>
                  </div>
                  <div>
                    <div class="opacity-75">{{ t('personalCenter.giftCard.successBalance') }}</div>
                    <div class="mt-0.5 font-semibold">{{ currentBalanceText }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form class="space-y-4" @submit.prevent="submitRedeem">
            <div>
              <label class="mb-2 block text-sm font-medium text-muted-foreground">{{ t('personalCenter.giftCard.codeLabel') }}</label>
              <Input
                v-model="redeemForm.code"
                type="text"
                maxlength="80"
                autocomplete="off"
                :placeholder="t('personalCenter.giftCard.codePlaceholder')"
                class="h-11 font-mono uppercase tracking-[0.08em]"
              />
            </div>

            <div v-if="redeemCaptchaEnabled" class="rounded-xl border bg-secondary px-4 py-3">
              <p class="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{{ t('auth.common.captchaLabel') }}</p>
              <div class="mt-2">
                <ImageCaptcha
                  v-if="captchaProvider === 'image'"
                  ref="imageCaptchaRef"
                  v-model="captchaPayload"
                  :disabled="submitting"
                  @config-stale="handleCaptchaConfigStale"
                />
                <TurnstileCaptcha
                  v-else-if="captchaProvider === 'turnstile'"
                  ref="turnstileRef"
                  v-model="turnstileToken"
                  :site-key="turnstileSiteKey"
                />
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" :disabled="submitting" class="h-11 px-5 font-bold">
                {{ submitting ? t('personalCenter.giftCard.redeeming') : t('personalCenter.giftCard.redeemButton') }}
              </Button>
              <Button type="button" variant="secondary" :disabled="submitting" class="h-11 font-semibold" @click="resetForm">
                {{ t('personalCenter.giftCard.resetButton') }}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { giftCardAPI, type CaptchaPayload, type GiftCardRedeemResult } from '../../api'
import { useAppStore } from '../../stores/app'
import { pageAlertVariant, pageAlertToneClass, type PageAlert } from '../../utils/alerts'
import ImageCaptcha from '../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../components/captcha/TurnstileCaptcha.vue'
import { Check } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const { t } = useI18n()
const appStore = useAppStore()

const redeemForm = reactive({
  code: '',
})
const submitting = ref(false)
const panelAlert = ref<PageAlert | null>(null)
const lastRedeem = ref<GiftCardRedeemResult | null>(null)

const captchaPayload = ref<CaptchaPayload>({})
const turnstileToken = ref('')
const imageCaptchaRef = ref<InstanceType<typeof ImageCaptcha> | null>(null)
const turnstileRef = ref<InstanceType<typeof TurnstileCaptcha> | null>(null)

const captchaConfig = computed(() => appStore.config?.captcha || null)
const captchaProvider = computed(() => String(captchaConfig.value?.provider || 'none'))
const redeemCaptchaEnabled = computed(() => {
  return !!captchaConfig.value?.scenes?.gift_card_redeem && captchaProvider.value !== 'none'
})
const turnstileSiteKey = computed(() => String(captchaConfig.value?.turnstile?.site_key || ''))

const redeemedAmountText = computed(() => {
  const rawAmount = String(lastRedeem.value?.wallet_delta || lastRedeem.value?.gift_card?.amount || '').trim()
  const currency = String(lastRedeem.value?.gift_card?.currency || appStore.config?.currency || 'CNY').trim()
  if (!rawAmount) return '-'
  return `${rawAmount} ${currency}`
})

const currentBalanceText = computed(() => {
  const balance = String(lastRedeem.value?.wallet?.balance || '').trim()
  const currency = String(lastRedeem.value?.gift_card?.currency || appStore.config?.currency || 'CNY').trim()
  if (!balance) return '-'
  return `${balance} ${currency}`
})

const getCaptchaPayload = (): CaptchaPayload | undefined => {
  if (!redeemCaptchaEnabled.value) return undefined
  if (captchaProvider.value === 'image') {
    return {
      captcha_id: captchaPayload.value.captcha_id || '',
      captcha_code: captchaPayload.value.captcha_code || '',
    }
  }
  if (captchaProvider.value === 'turnstile') {
    return {
      turnstile_token: turnstileToken.value || '',
    }
  }
  return undefined
}

const resetCaptcha = () => {
  captchaPayload.value = {}
  turnstileToken.value = ''
  imageCaptchaRef.value?.refresh()
  turnstileRef.value?.reset()
}

const resetForm = () => {
  redeemForm.code = ''
  panelAlert.value = null
  lastRedeem.value = null
  resetCaptcha()
}

const handleCaptchaConfigStale = async () => {
  await appStore.loadConfig(true)
  captchaPayload.value = {}
  turnstileToken.value = ''
}

const ensureCaptchaPassed = () => {
  if (!redeemCaptchaEnabled.value) return true
  if (captchaProvider.value === 'image') {
    return Boolean(captchaPayload.value.captcha_id && captchaPayload.value.captcha_code)
  }
  if (captchaProvider.value === 'turnstile') {
    return Boolean(turnstileToken.value)
  }
  return false
}

const submitRedeem = async () => {
  panelAlert.value = null
  const code = String(redeemForm.code || '').trim().toUpperCase()
  if (!code) {
    panelAlert.value = {
      level: 'warning',
      message: t('personalCenter.giftCard.errors.codeRequired'),
    }
    return
  }
  if (!ensureCaptchaPassed()) {
    panelAlert.value = {
      level: 'warning',
      message: t('auth.common.captchaRequired'),
    }
    return
  }

  submitting.value = true
  try {
    const response = await giftCardAPI.redeem({
      code,
      captcha_payload: getCaptchaPayload(),
    })
    const payload = response.data.data || ({} as GiftCardRedeemResult)
    lastRedeem.value = payload
    panelAlert.value = {
      level: 'success',
      message: t('personalCenter.giftCard.redeemSuccess', {
        amount: String(payload.wallet_delta || payload.gift_card?.amount || ''),
        currency: String(payload.gift_card?.currency || appStore.config?.currency || 'CNY'),
      }),
    }
    redeemForm.code = ''
    resetCaptcha()
  } catch (err: any) {
    panelAlert.value = {
      level: 'error',
      message: err?.message || t('personalCenter.giftCard.errors.redeemFailed'),
    }
    if (captchaProvider.value === 'image') {
      imageCaptchaRef.value?.refresh()
    }
    if (captchaProvider.value === 'turnstile') {
      turnstileRef.value?.reset()
      turnstileToken.value = ''
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (!appStore.config) {
    void appStore.loadConfig()
  }
})
</script>

<style scoped>
.gift-card-panel-enter {
  animation: gift-card-panel-enter 0.45s ease both;
}

.success-burst {
  animation: gift-card-success-burst 0.45s ease both;
}

@keyframes gift-card-panel-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gift-card-success-burst {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
