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
          {{ t('navbar.personalCenter') }}
        </Badge>
      </div>

      <Card class="rounded-3xl p-7 shadow-lg backdrop-blur-sm sm:p-9">
        <div class="mb-8 text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{{ brandSiteName }}</p>
          <h1 class="mt-3 text-3xl font-black text-foreground">
            {{ step === 'totp' ? t('auth.login.totp.title') : t('auth.login.title') }}
          </h1>
          <p class="mt-2 text-sm text-muted-foreground">
            {{ step === 'totp' ? t('auth.login.totp.subtitle') : t('auth.login.subtitle') }}
          </p>
        </div>

        <form
          v-if="step === 'totp'"
          class="space-y-6"
          @submit.prevent="handleVerify2FA"
        >
          <div class="rounded-xl border bg-secondary px-4 py-2 text-center text-xs text-muted-foreground">
            {{ t('auth.login.totp.countdown', { seconds: challengeRemainingSeconds }) }}
          </div>

          <FormField
            v-if="totpMode === 'code'"
            :label="t('auth.login.totp.codeLabel')"
          >
            <template #default="{ id }">
              <Input
                :id="id"
                v-model="totpCode"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                class="h-11 text-center tracking-[0.4em]"
                :placeholder="t('auth.login.totp.codePlaceholder')"
              />
            </template>
          </FormField>

          <FormField
            v-else
            :label="t('auth.login.totp.recoveryLabel')"
          >
            <template #default="{ id }">
              <Input
                :id="id"
                v-model="recoveryCode"
                autocomplete="off"
                class="h-11"
                :placeholder="t('auth.login.totp.recoveryPlaceholder')"
              />
            </template>
          </FormField>

          <div class="text-center">
            <button
              type="button"
              class="text-muted-foreground transition-colors hover:text-foreground text-xs"
              @click="totpMode = totpMode === 'code' ? 'recovery' : 'code'"
            >
              {{ totpMode === 'code' ? t('auth.login.totp.useRecovery') : t('auth.login.totp.useCode') }}
            </button>
          </div>

          <Alert v-if="error" variant="destructive" class="text-center">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <Button type="submit" :disabled="userAuthStore.loading" class="h-11 w-full font-bold">
            {{ userAuthStore.loading ? t('auth.login.totp.verifying') : t('auth.login.totp.submit') }}
          </Button>

          <div class="text-center">
            <button
              type="button"
              class="text-muted-foreground transition-colors hover:text-foreground text-xs"
              @click="cancel2FA"
            >
              {{ t('auth.login.totp.cancel') }}
            </button>
          </div>
        </form>

        <form
          v-else
          class="space-y-6"
          @submit.prevent="handleLogin"
        >
          <FormField
            :label="t('auth.login.emailLabel')"
            :error="formValidation.getError('email')"
          >
            <template #icon>
              <Mail class="h-3.5 w-3.5" aria-hidden="true" />
            </template>
            <template #default="{ id, hasError, describedBy }">
              <Input
                :id="id"
                v-model="email"
                type="email"
                required
                class="h-11"
                :class="{ 'ring-2 ring-destructive/50': hasError }"
                :aria-invalid="hasError"
                :aria-describedby="describedBy"
                :placeholder="t('auth.login.emailPlaceholder')"
                @blur="formValidation.touchField('email', email)"
              />
            </template>
          </FormField>

          <FormField
            :label="t('auth.login.passwordLabel')"
            :error="formValidation.getError('password')"
          >
            <template #icon>
              <Lock class="h-3.5 w-3.5" aria-hidden="true" />
            </template>
            <template #default="{ id, hasError, describedBy }">
              <div class="relative">
                <Input
                  :id="id"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="h-11 pr-10"
                  :class="{ 'ring-2 ring-destructive/50': hasError }"
                  :aria-invalid="hasError"
                  :aria-describedby="describedBy"
                  :placeholder="t('auth.login.passwordPlaceholder')"
                  @blur="formValidation.touchField('password', password)"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  :aria-label="showPassword ? t('auth.common.hidePassword') : t('auth.common.showPassword')"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="h-4 w-4" aria-hidden="true" />
                  <Eye v-else class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </template>
          </FormField>

          <div v-if="loginCaptchaEnabled">
            <label class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldCheck class="h-3.5 w-3.5 opacity-60" />
              {{ t('auth.common.captchaLabel') }}
            </label>
            <ImageCaptcha
              v-if="captchaProvider === 'image'"
              ref="imageCaptchaRef"
              v-model="captchaPayload"
              :disabled="userAuthStore.loading"
              @config-stale="handleCaptchaConfigStale"
            />
            <TurnstileCaptcha
              v-else-if="captchaProvider === 'turnstile'"
              ref="turnstileRef"
              v-model="turnstileToken"
              :site-key="turnstileSiteKey"
            />
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <label class="inline-flex items-center gap-2">
              <input v-model="rememberMe" type="checkbox" class="h-4 w-4 accent-primary" />
              {{ t('auth.login.rememberMe') }}
            </label>
            <router-link
              v-if="emailVerificationEnabled"
              to="/auth/forgot"
              class="font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {{ t('auth.login.forgot') }}
            </router-link>
          </div>

          <Alert v-if="info" class="text-center border-success/40 text-success">
            <AlertDescription>{{ info }}</AlertDescription>
          </Alert>

          <Alert v-if="error" variant="destructive" class="text-center">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <Button type="submit" :disabled="userAuthStore.loading" class="h-11 w-full font-bold">
            <LogIn v-if="!userAuthStore.loading" class="h-4 w-4" />
            {{ userAuthStore.loading ? t('auth.login.submitting') : t('auth.login.submit') }}
          </Button>

          <div v-if="showTelegramWidget" class="space-y-3 pt-1">
            <div class="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <span class="h-px flex-1 border-t border-gray-200/80 dark:border-white/10"></span>
              <span>{{ t('auth.login.telegramOr') }}</span>
              <span class="h-px flex-1 border-t border-gray-200/80 dark:border-white/10"></span>
            </div>
            <div ref="telegramWidgetRef" class="flex justify-center"></div>
            <p class="text-center text-xs text-muted-foreground">
              {{ t('auth.login.telegramHint') }}
            </p>
          </div>
          <div v-else-if="showTelegramOidc" class="space-y-3 pt-1">
            <div class="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <span class="h-px flex-1 border-t border-gray-200/80 dark:border-white/10"></span>
              <span>{{ t('auth.login.telegramOr') }}</span>
              <span class="h-px flex-1 border-t border-gray-200/80 dark:border-white/10"></span>
            </div>
            <Button type="button" variant="secondary" class="h-11 w-full font-semibold" @click="startTelegramOidc">
              {{ t('auth.login.telegramOidcButton') }}
            </Button>
            <p class="text-center text-xs text-muted-foreground">
              {{ t('auth.login.telegramOidcHint') }}
            </p>
          </div>
          <div v-else-if="showMiniAppLoginHint" class="space-y-3 pt-1">
            <div class="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              <span class="h-px flex-1 border-t border-gray-200/80 dark:border-white/10"></span>
              <span>{{ t('auth.login.telegramOr') }}</span>
              <span class="h-px flex-1 border-t border-gray-200/80 dark:border-white/10"></span>
            </div>
            <p class="text-center text-xs text-muted-foreground">
              {{ attemptingMiniAppLogin ? t('auth.login.telegramMiniAppLoggingIn') : t('auth.login.telegramMiniAppHint') }}
            </p>
          </div>
          <div v-if="showTelegramMiniAppEntry" class="space-y-2 pt-1">
            <p class="text-center text-xs text-muted-foreground">
              {{ t('auth.login.telegramMiniAppEntryHint') }}
            </p>
            <Button type="button" variant="secondary" class="h-11 w-full font-semibold" @click="openTelegramMiniAppEntry">
              {{ t('auth.login.telegramMiniAppEntryAction') }}
            </Button>
          </div>
        </form>
      </Card>

      <div v-if="registrationEnabled" class="mt-4 text-center">
        <router-link
          to="/auth/register"
          class="text-muted-foreground transition-colors hover:text-foreground text-sm"
        >
          {{ t('auth.login.noAccount') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserAuthStore } from '../../stores/userAuth'
import { useI18n } from 'vue-i18n'
import { debounceAsync } from '../../utils/debounce'
import { useAppStore } from '../../stores/app'
import { useTelegramMiniAppStore } from '../../stores/telegramMiniApp'
import { buildTelegramMiniAppEntryLink, isTelegramUrlEnvironment, openTelegramCompatibleLink } from '../../utils/telegramMiniApp'
import { userAuthAPI } from '../../api'
import type { CaptchaPayload, TelegramAuthPayload } from '../../api'
import ImageCaptcha from '../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../components/captcha/TurnstileCaptcha.vue'
import FormField from '../../components/FormField.vue'
import { useFormValidation } from '../../composables/useFormValidation'
import { ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff, LogIn } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const router = useRouter()
const route = useRoute()
const userAuthStore = useUserAuthStore()
const appStore = useAppStore()
const telegramMiniAppStore = useTelegramMiniAppStore()
const { t } = useI18n()

const brandSiteName = computed(() => {
  const siteName = String(appStore.config?.brand?.site_name || '').trim()
  return siteName !== '' ? siteName : 'Dujiao-Next'
})

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(true)

const step = ref<'password' | 'totp'>('password')
const totpMode = ref<'code' | 'recovery'>('code')
const totpCode = ref('')
const recoveryCode = ref('')
const challengeRemainingSeconds = ref(0)
let challengeTimer: ReturnType<typeof setInterval> | null = null

const formValidation = useFormValidation(['email', 'password'])
formValidation.addRule('email', formValidation.requiredRule())
formValidation.addRule('email', formValidation.emailRule())
formValidation.addRule('password', formValidation.requiredRule())
const error = ref('')
const info = ref('')
const captchaPayload = ref<CaptchaPayload>({})
const turnstileToken = ref('')
const imageCaptchaRef = ref<InstanceType<typeof ImageCaptcha> | null>(null)
const turnstileRef = ref<InstanceType<typeof TurnstileCaptcha> | null>(null)
const telegramWidgetRef = ref<HTMLDivElement | null>(null)

const captchaConfig = computed(() => appStore.config?.captcha || null)
const captchaProvider = computed(() => String(captchaConfig.value?.provider || 'none'))
const loginCaptchaEnabled = computed(() => !!captchaConfig.value?.scenes?.login && captchaProvider.value !== 'none')
const turnstileSiteKey = computed(() => String(captchaConfig.value?.turnstile?.site_key || ''))
const telegramConfig = computed(() => appStore.config?.telegram_auth || null)
const telegramBotUsername = computed(() => String(telegramConfig.value?.bot_username || '').trim())
const telegramMiniAppURL = computed(() => String(telegramConfig.value?.mini_app_url || '').trim())
const telegramEnabled = computed(() => !!telegramConfig.value?.enabled && telegramBotUsername.value !== '')
const telegramLoginMode = computed(() => String(telegramConfig.value?.mode || '').trim())
const isWidgetMode = computed(() => telegramLoginMode.value === 'widget' || (telegramLoginMode.value === '' && telegramEnabled.value))
const registrationEnabled = computed(() => appStore.config?.registration_enabled !== false)
const emailVerificationEnabled = computed(() => appStore.config?.email_verification_enabled !== false)
const isTelegramUrlEnv = isTelegramUrlEnvironment()
const isTelegramMiniApp = computed(() => (telegramMiniAppStore.isMiniApp && telegramMiniAppStore.isReady) || isTelegramUrlEnv)
const miniAppInitData = computed(() => String(telegramMiniAppStore.initData || '').trim())
const showTelegramWidget = computed(() => isWidgetMode.value && telegramEnabled.value && !isTelegramMiniApp.value)
const showTelegramOidc = computed(() => telegramLoginMode.value === 'oidc' && telegramEnabled.value && !isTelegramMiniApp.value)
const showMiniAppLoginHint = computed(() => isTelegramMiniApp.value)
const telegramMiniAppEntryLink = computed(() => buildTelegramMiniAppEntryLink(telegramBotUsername.value, telegramMiniAppURL.value))
const showTelegramMiniAppEntry = computed(() => !isTelegramMiniApp.value && telegramMiniAppEntryLink.value !== '')
const telegramCallbackName = '__dujiaoUserTelegramLogin'
const miniAppLoginAttempted = ref(false)
const attemptingMiniAppLogin = ref(false)

const getCaptchaPayload = (): CaptchaPayload | undefined => {
  if (!loginCaptchaEnabled.value) return undefined
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

const redirectAfterLogin = () => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/me/orders'
  return router.push(redirect)
}

const openTelegramMiniAppEntry = () => {
  if (telegramMiniAppEntryLink.value === '') return
  openTelegramCompatibleLink(telegramMiniAppEntryLink.value)
}

const performLogin = async () => {
  error.value = ''
  if (!formValidation.validateAll({ email: email.value, password: password.value })) return

  if (loginCaptchaEnabled.value && captchaProvider.value === 'image') {
    if (!captchaPayload.value.captcha_id || !captchaPayload.value.captcha_code) {
      error.value = t('auth.common.captchaRequired')
      return
    }
  }

  if (loginCaptchaEnabled.value && captchaProvider.value === 'turnstile') {
    if (!turnstileToken.value) {
      error.value = t('auth.common.captchaRequired')
      return
    }
  }

  try {
    const result = await userAuthStore.login({
      email: email.value,
      password: password.value,
      remember_me: rememberMe.value,
      captcha_payload: getCaptchaPayload(),
    })
    if (result && result.requiresTotp) {
      enter2FAStep()
      return
    }
    await redirectAfterLogin()
  } catch (err: any) {
    error.value = err.message || t('auth.login.error')
    if (captchaProvider.value === 'image') {
      imageCaptchaRef.value?.refresh()
    }
    if (captchaProvider.value === 'turnstile') {
      turnstileRef.value?.reset()
      turnstileToken.value = ''
    }
  }
}

const handleLogin = debounceAsync(performLogin, 200)

const stopChallengeCountdown = () => {
  if (challengeTimer) {
    clearInterval(challengeTimer)
    challengeTimer = null
  }
}

const startChallengeCountdown = () => {
  stopChallengeCountdown()
  const tick = () => {
    const expiresAt = userAuthStore.challengeExpiresAt
    if (!expiresAt) {
      challengeRemainingSeconds.value = 0
      stopChallengeCountdown()
      return
    }
    const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
    challengeRemainingSeconds.value = diff
    if (diff <= 0) {
      stopChallengeCountdown()
      cancel2FA()
      error.value = t('auth.login.totp.expired')
    }
  }
  tick()
  challengeTimer = setInterval(tick, 1000)
}

const cancel2FA = () => {
  stopChallengeCountdown()
  userAuthStore.clearChallenge()
  step.value = 'password'
  totpCode.value = ''
  recoveryCode.value = ''
  challengeRemainingSeconds.value = 0
}

const performVerify2FA = async () => {
  error.value = ''
  if (totpMode.value === 'code') {
    const code = totpCode.value.trim()
    if (code === '') {
      error.value = t('auth.login.totp.codeRequired')
      return
    }
    try {
      await userAuthStore.verify2FA({ code })
      stopChallengeCountdown()
      await redirectAfterLogin()
    } catch (err: any) {
      error.value = err.message || t('auth.login.totp.verifyFailed')
      totpCode.value = ''
    }
    return
  }
  const rc = recoveryCode.value.trim()
  if (rc === '') {
    error.value = t('auth.login.totp.recoveryRequired')
    return
  }
  try {
    await userAuthStore.verify2FA({ recovery_code: rc })
    stopChallengeCountdown()
    await redirectAfterLogin()
  } catch (err: any) {
    error.value = err.message || t('auth.login.totp.verifyFailed')
    recoveryCode.value = ''
  }
}

const handleVerify2FA = debounceAsync(performVerify2FA, 200)

const buildTelegramPayload = (raw: any): TelegramAuthPayload | null => {
  const id = Number(raw?.id)
  const authDate = Number(raw?.auth_date)
  const hash = String(raw?.hash || '').trim()
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(authDate) || authDate <= 0 || hash === '') {
    return null
  }
  return {
    id,
    first_name: String(raw?.first_name || '').trim(),
    last_name: String(raw?.last_name || '').trim(),
    username: String(raw?.username || '').trim(),
    photo_url: String(raw?.photo_url || '').trim(),
    auth_date: authDate,
    hash,
  }
}

const enter2FAStep = () => {
  step.value = 'totp'
  totpMode.value = 'code'
  totpCode.value = ''
  recoveryCode.value = ''
  startChallengeCountdown()
}

const handleTelegramAuth = async (raw: any) => {
  error.value = ''
  const payload = buildTelegramPayload(raw)
  if (!payload) {
    error.value = t('auth.login.telegramInvalidPayload')
    return
  }
  try {
    const result = await userAuthStore.telegramLogin(payload)
    if (result && result.requiresTotp) {
      enter2FAStep()
      return
    }
    await redirectAfterLogin()
  } catch (err: any) {
    error.value = err.message || t('auth.login.telegramLoginFailed')
  }
}

const tryTelegramMiniAppLogin = async () => {
  if (!isTelegramMiniApp.value || miniAppInitData.value === '' || miniAppLoginAttempted.value || attemptingMiniAppLogin.value) {
    return
  }

  miniAppLoginAttempted.value = true
  attemptingMiniAppLogin.value = true
  error.value = ''

  try {
    const result = await userAuthStore.telegramMiniAppLogin(miniAppInitData.value)
    if (result && result.requiresTotp) {
      enter2FAStep()
      return
    }
    await redirectAfterLogin()
  } catch (err: any) {
    error.value = err.message || t('auth.login.telegramLoginFailed')
  } finally {
    attemptingMiniAppLogin.value = false
  }
}

const clearTelegramWidget = () => {
  if (telegramWidgetRef.value) {
    telegramWidgetRef.value.innerHTML = ''
  }
}

const startTelegramOidc = async () => {
  error.value = ''
  try {
    sessionStorage.removeItem('tg_oidc_intent')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    if (redirect) {
      sessionStorage.setItem('tg_oidc_redirect', redirect)
    } else {
      sessionStorage.removeItem('tg_oidc_redirect')
    }
    const res = await userAuthAPI.telegramOidcStart()
    const url = String(res?.data?.data?.auth_url || '')
    if (!url) {
      error.value = t('auth.login.telegramLoginFailed')
      return
    }
    window.location.href = url
  } catch (err: any) {
    error.value = err?.message || t('auth.login.telegramLoginFailed')
  }
}

const renderTelegramWidget = () => {
  if (telegramLoginMode.value === 'oidc') {
    clearTelegramWidget()
    return
  }
  if (!showTelegramWidget.value || !telegramWidgetRef.value) {
    clearTelegramWidget()
    return
  }
  clearTelegramWidget()
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', telegramBotUsername.value)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-userpic', 'false')
  script.setAttribute('data-request-access', 'write')
  script.setAttribute('data-onauth', `${telegramCallbackName}(user)`)
  script.onerror = () => {
    error.value = t('auth.login.telegramWidgetLoadFailed')
  }
  telegramWidgetRef.value.appendChild(script)
}

onMounted(async () => {
  await appStore.loadConfig(true)
  const win = window as Window & Record<string, any>
  win[telegramCallbackName] = handleTelegramAuth
  renderTelegramWidget()

  if (route.query.tg2fa === '1' && userAuthStore.challengeToken) {
    enter2FAStep()
    const nextQuery = { ...route.query }
    delete nextQuery.tg2fa
    router.replace({ path: route.path, query: nextQuery })
  }

  const reason = typeof route.query.reason === 'string' ? route.query.reason : ''
  if (reason === 'password_changed') {
    info.value = t('auth.login.passwordChangedTip')
    const nextQuery = { ...route.query }
    delete nextQuery.reason
    router.replace({ path: route.path, query: nextQuery })
  }

  await tryTelegramMiniAppLogin()
})

watch([showTelegramWidget, telegramBotUsername], () => {
  renderTelegramWidget()
})

watch([isTelegramMiniApp, miniAppInitData], () => {
  void tryTelegramMiniAppLogin()
})

onUnmounted(() => {
  const win = window as Window & Record<string, any>
  delete win[telegramCallbackName]
  clearTelegramWidget()
  stopChallengeCountdown()
})
</script>
