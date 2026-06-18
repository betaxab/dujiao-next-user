<template>
  <div class="relative flex min-h-screen items-center justify-center bg-background text-foreground theme-auth-page px-4 py-16 sm:px-6">
    <div class="relative z-10 w-full max-w-lg">
      <div class="mb-4 flex items-center justify-between px-1">
        <Button as-child variant="ghost" size="sm" class="rounded-full gap-1 text-muted-foreground">
          <router-link to="/">
            <ArrowLeft class="h-4 w-4" />
            {{ t('auth.login.backHome') }}
          </router-link>
        </Button>
        <Badge variant="neutral" size="sm" class="rounded-full">
          {{ t('auth.forgot.title') }}
        </Badge>
      </div>

      <Card class="rounded-3xl p-7 shadow-lg backdrop-blur-sm sm:p-9">
        <div class="mb-8 text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{{ brandSiteName }}</p>
          <h1 class="mt-3 text-3xl font-black text-foreground">{{ t('auth.forgot.title') }}</h1>
          <p class="mt-2 text-sm text-muted-foreground">{{ t('auth.forgot.subtitle') }}</p>
        </div>

        <Alert v-if="!emailVerificationEnabled" variant="destructive" class="text-center">
          <AlertDescription class="block">
            <p class="text-sm font-medium">{{ t('auth.forgot.disabled') }}</p>
            <router-link to="/auth/login" class="mt-3 inline-block text-muted-foreground transition-colors hover:text-foreground text-sm">
              {{ t('auth.forgot.backLogin') }}
            </router-link>
          </AlertDescription>
        </Alert>

        <form v-else class="space-y-6" @submit.prevent="handleReset">
          <div>
            <label class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Mail class="h-3.5 w-3.5 opacity-60" />
              {{ t('auth.forgot.emailLabel') }}
            </label>
            <Input
              v-model="email"
              type="email"
              required
              class="h-11"
              :placeholder="t('auth.forgot.emailPlaceholder')"
            />
          </div>

          <div v-if="sendCodeCaptchaEnabled">
            <label class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldCheck class="h-3.5 w-3.5 opacity-60" />
              {{ t('auth.common.captchaLabel') }}
            </label>
            <ImageCaptcha
              v-if="captchaProvider === 'image'"
              ref="imageCaptchaRef"
              v-model="captchaPayload"
              :disabled="sending || countdown > 0"
              @config-stale="handleCaptchaConfigStale"
            />
            <TurnstileCaptcha
              v-else-if="captchaProvider === 'turnstile'"
              ref="turnstileRef"
              v-model="turnstileToken"
              :site-key="turnstileSiteKey"
            />
          </div>

          <div>
            <label class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldCheck class="h-3.5 w-3.5 opacity-60" />
              {{ t('auth.forgot.codeLabel') }}
            </label>
            <div class="flex flex-col gap-2 sm:flex-row">
              <Input
                v-model="code"
                type="text"
                required
                class="h-11 min-w-0 flex-1"
                :placeholder="t('auth.forgot.codePlaceholder')"
              />
              <Button
                type="button"
                variant="secondary"
                class="h-11 whitespace-nowrap"
                @click="handleSendCode"
                :disabled="sending || countdown > 0"
              >
                {{ countdown > 0 ? t('auth.common.countdown', { seconds: countdown }) : t('auth.common.sendCode') }}
              </Button>
            </div>
          </div>

          <div>
            <label class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <KeyRound class="h-3.5 w-3.5 opacity-60" />
              {{ t('auth.forgot.newPasswordLabel') }}
            </label>
            <Input
              v-model="newPassword"
              type="password"
              required
              class="h-11"
              :placeholder="t('auth.forgot.newPasswordPlaceholder')"
            />
          </div>

          <Alert v-if="error" variant="destructive" class="text-center">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <Button type="submit" :disabled="userAuthStore.loading" class="h-11 w-full font-bold">
            <RotateCw v-if="!userAuthStore.loading" class="h-4 w-4" />
            {{ userAuthStore.loading ? t('auth.forgot.submitting') : t('auth.forgot.submit') }}
          </Button>
        </form>
      </Card>

      <div class="mt-4 text-center">
        <router-link
          to="/auth/login"
          class="text-muted-foreground transition-colors hover:text-foreground text-sm"
        >
          {{ t('auth.forgot.backLogin') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserAuthStore } from '../../stores/userAuth'
import { useI18n } from 'vue-i18n'
import { debounceAsync } from '../../utils/debounce'
import { useAppStore } from '../../stores/app'
import type { CaptchaPayload } from '../../api'
import ImageCaptcha from '../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../components/captcha/TurnstileCaptcha.vue'
import { ArrowLeft, Mail, ShieldCheck, KeyRound, RotateCw } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const router = useRouter()
const userAuthStore = useUserAuthStore()
const appStore = useAppStore()
const { t } = useI18n()

const brandSiteName = computed(() => {
  const siteName = String(appStore.config?.brand?.site_name || '').trim()
  return siteName !== '' ? siteName : 'Dujiao-Next'
})

const emailVerificationEnabled = computed(() => appStore.config?.email_verification_enabled !== false)

const email = ref('')
const code = ref('')
const newPassword = ref('')
const error = ref('')
const sending = ref(false)
const countdown = ref(0)
const captchaPayload = ref<CaptchaPayload>({})
const turnstileToken = ref('')
const imageCaptchaRef = ref<InstanceType<typeof ImageCaptcha> | null>(null)
const turnstileRef = ref<InstanceType<typeof TurnstileCaptcha> | null>(null)
let timer: number | undefined

const captchaConfig = computed(() => appStore.config?.captcha || null)
const captchaProvider = computed(() => String(captchaConfig.value?.provider || 'none'))
const sendCodeCaptchaEnabled = computed(() => !!captchaConfig.value?.scenes?.reset_send_code && captchaProvider.value !== 'none')
const turnstileSiteKey = computed(() => String(captchaConfig.value?.turnstile?.site_key || ''))

const startCountdown = () => {
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }, 1000)
}

const getCaptchaPayload = (): CaptchaPayload | undefined => {
  if (!sendCodeCaptchaEnabled.value) return undefined
  if (captchaProvider.value === 'image') {
    return {
      captcha_id: captchaPayload.value.captcha_id || '',
      captcha_code: captchaPayload.value.captcha_code || '',
    }
  }
  if (captchaProvider.value === 'turnstile') {
    return {
      turnstile_token: turnstileToken.value,
    }
  }
  return undefined
}

const handleCaptchaConfigStale = async () => {
  await appStore.loadConfig(true)
  captchaPayload.value = {}
  turnstileToken.value = ''
}

const performSendCode = async () => {
  error.value = ''
  if (!email.value) {
    error.value = t('auth.forgot.errors.emailRequired')
    return
  }
  if (countdown.value > 0) return

  if (sendCodeCaptchaEnabled.value && captchaProvider.value === 'image') {
    if (!captchaPayload.value.captcha_id || !captchaPayload.value.captcha_code) {
      error.value = t('auth.common.captchaRequired')
      return
    }
  }
  if (sendCodeCaptchaEnabled.value && captchaProvider.value === 'turnstile') {
    if (!turnstileToken.value) {
      error.value = t('auth.common.captchaRequired')
      return
    }
  }

  sending.value = true
  try {
    await userAuthStore.sendVerifyCode({
      email: email.value,
      purpose: 'reset',
      captcha_payload: getCaptchaPayload(),
    })
    startCountdown()
  } catch (err: any) {
    error.value = err.message || t('auth.forgot.errors.sendCodeFailed')
    if (captchaProvider.value === 'image') {
      imageCaptchaRef.value?.refresh()
    }
    if (captchaProvider.value === 'turnstile') {
      turnstileRef.value?.reset()
      turnstileToken.value = ''
    }
  } finally {
    sending.value = false
  }
}

const performReset = async () => {
  error.value = ''
  if (!email.value || !code.value || !newPassword.value) return
  try {
    await userAuthStore.forgotPassword({
      email: email.value,
      code: code.value,
      new_password: newPassword.value
    })
    router.push('/auth/login')
  } catch (err: any) {
    error.value = err.message || t('auth.forgot.errors.resetFailed')
  }
}

const handleSendCode = debounceAsync(performSendCode, 200)
const handleReset = debounceAsync(performReset, 200)

onMounted(async () => {
  await appStore.loadConfig(true)
})
</script>
