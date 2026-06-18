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
          {{ t('auth.register.title') }}
        </Badge>
      </div>

      <Card class="rounded-3xl p-7 shadow-lg backdrop-blur-sm sm:p-9">
        <div v-if="!registrationEnabled" class="py-8 text-center">
          <p class="text-sm text-muted-foreground">{{ t('auth.register.registrationDisabled') }}</p>
          <router-link to="/auth/login" class="mt-4 inline-block text-primary hover:underline text-sm font-semibold">
            {{ t('auth.register.hasAccount') }}
          </router-link>
        </div>

        <template v-else>
        <div class="mb-8 text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{{ brandSiteName }}</p>
          <h1 class="mt-3 text-3xl font-black text-foreground">{{ t('auth.register.title') }}</h1>
          <p class="mt-2 text-sm text-muted-foreground">{{ t('auth.register.subtitle') }}</p>
        </div>

        <form class="space-y-6" @submit.prevent="handleRegister">
          <div>
            <label class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Mail class="h-3.5 w-3.5 opacity-60" />
              {{ t('auth.register.emailLabel') }}
            </label>
            <div v-if="emailDomainSelectionRequired" class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,auto)]">
              <Input
                v-model="emailLocalPart"
                type="text"
                required
                autocomplete="username"
                class="h-11"
                :class="{ 'ring-2 ring-destructive/50': formValidation.hasError('email') }"
                :placeholder="t('auth.register.emailLocalPlaceholder')"
                @blur="touchRegistrationEmail"
              />
              <Select v-model="selectedEmailDomain" @update:model-value="touchRegistrationEmail">
                <SelectTrigger class="h-11 w-full" :class="{ 'ring-2 ring-destructive/50': formValidation.hasError('email') }">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="domain in allowedEmailDomains" :key="domain" :value="domain">
                    @{{ domain }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              v-else
              v-model="email"
              type="email"
              required
              class="h-11"
              :class="{ 'ring-2 ring-destructive/50': formValidation.hasError('email') }"
              :placeholder="t('auth.register.emailPlaceholder')"
              @blur="touchRegistrationEmail"
            />
            <p v-if="formValidation.hasError('email')" class="mt-1.5 text-xs text-destructive">
              {{ formValidation.getError('email') }}
            </p>
            <p v-else-if="emailDomainSelectionRequired" class="mt-1.5 text-xs text-muted-foreground">
              {{ t('auth.register.emailDomainSelectHint') }}
            </p>
            <p v-else-if="emailDomainAllowlistEnabled" class="mt-1.5 text-xs text-muted-foreground">
              {{ allowedEmailDomains.length > 0
                ? t('auth.register.allowedEmailDomainsHint', { domains: allowedEmailDomainsText })
                : t('auth.register.noAllowedEmailDomainsHint') }}
            </p>
          </div>

          <div>
            <label class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <Lock class="h-3.5 w-3.5 opacity-60" />
              {{ t('auth.register.passwordLabel') }}
            </label>
            <div class="relative">
              <Input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="h-11 pr-10"
                :class="{ 'ring-2 ring-destructive/50': formValidation.hasError('password') }"
                :placeholder="t('auth.register.passwordPlaceholder')"
                @blur="formValidation.touchField('password', password)"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <p v-if="formValidation.hasError('password')" class="mt-1.5 text-xs text-destructive">
              {{ formValidation.getError('password') }}
            </p>
            <div v-if="password && !formValidation.hasError('password')" class="mt-2 flex items-center gap-2">
              <div class="flex flex-1 gap-1">
                <div class="h-1 flex-1 rounded-full transition-colors" :class="passwordStrength === 'weak' ? 'bg-red-400' : passwordStrength === 'medium' ? 'bg-yellow-400' : 'bg-green-400'" />
                <div class="h-1 flex-1 rounded-full transition-colors" :class="passwordStrength === 'medium' ? 'bg-yellow-400' : passwordStrength === 'strong' ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'" />
                <div class="h-1 flex-1 rounded-full transition-colors" :class="passwordStrength === 'strong' ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'" />
              </div>
              <span class="text-[11px] font-medium" :class="passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-yellow-500' : 'text-green-500'">
                {{ t(`formValidation.passwordStrength.${passwordStrength}`) }}
              </span>
            </div>
          </div>

          <div v-if="emailVerificationEnabled && sendCodeCaptchaEnabled">
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

          <div v-if="emailVerificationEnabled">
            <label class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <ShieldCheck class="h-3.5 w-3.5 opacity-60" />
              {{ t('auth.register.codeLabel') }}
            </label>
            <div class="flex flex-col gap-2 sm:flex-row">
              <Input
                v-model="code"
                type="text"
                required
                class="h-11 min-w-0 flex-1"
                :placeholder="t('auth.register.codePlaceholder')"
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

          <label class="flex items-start gap-3 rounded-xl border bg-secondary px-4 py-3 text-sm text-muted-foreground transition-colors">
            <input
              v-model="agreed"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary dark:border-white/20 dark:bg-black/20"
            />
            <span class="leading-6">
              {{ t('auth.register.agreementPrefix') }}
              <router-link to="/privacy" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary hover:underline">
                {{ t('footer.privacy') }}
              </router-link>
              {{ t('auth.register.agreementAnd') }}
              <router-link to="/terms" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary hover:underline">
                {{ t('footer.terms') }}
              </router-link>
            </span>
          </label>

          <Alert v-if="error" variant="destructive" class="text-center">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>

          <Button
            type="submit"
            :disabled="userAuthStore.loading || !agreed"
            class="h-11 w-full font-bold"
          >
            <UserPlus v-if="!userAuthStore.loading" class="h-4 w-4" />
            {{ userAuthStore.loading ? t('auth.register.creating') : t('auth.register.create') }}
          </Button>
        </form>
        </template>
      </Card>

      <div class="mt-4 text-center">
        <router-link
          to="/auth/login"
          class="text-muted-foreground transition-colors hover:text-foreground text-sm"
        >
          {{ t('auth.register.hasAccount') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserAuthStore } from '../../stores/userAuth'
import { useI18n } from 'vue-i18n'
import { debounceAsync } from '../../utils/debounce'
import { useAppStore } from '../../stores/app'
import type { CaptchaPayload } from '../../api'
import ImageCaptcha from '../../components/captcha/ImageCaptcha.vue'
import TurnstileCaptcha from '../../components/captcha/TurnstileCaptcha.vue'
import { useFormValidation, getPasswordStrength } from '../../composables/useFormValidation'
import { ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff, UserPlus } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const router = useRouter()
const userAuthStore = useUserAuthStore()
const appStore = useAppStore()
const { t } = useI18n()

const brandSiteName = computed(() => {
  const siteName = String(appStore.config?.brand?.site_name || '').trim()
  return siteName !== '' ? siteName : 'Dujiao-Next'
})

const email = ref('')
const emailLocalPart = ref('')
const selectedEmailDomain = ref('')
const password = ref('')
const showPassword = ref(false)
const code = ref('')
const agreed = ref(false)

const passwordStrength = computed(() => getPasswordStrength(password.value))
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
const sendCodeCaptchaEnabled = computed(() => !!captchaConfig.value?.scenes?.register_send_code && captchaProvider.value !== 'none')
const turnstileSiteKey = computed(() => String(captchaConfig.value?.turnstile?.site_key || ''))
const registrationEnabled = computed(() => appStore.config?.registration_enabled !== false)
const emailVerificationEnabled = computed(() => appStore.config?.email_verification_enabled !== false)
const emailDomainAllowlistEnabled = computed(() => appStore.config?.email_domain_allowlist_enabled === true)
const allowedEmailDomains = computed(() => {
  const raw = appStore.config?.allowed_email_domains
  if (!Array.isArray(raw)) return []

  const seen = new Set<string>()
  const domains: string[] = []
  raw
    .map((item) => String(item || '').trim().replace(/^@+/, '').toLowerCase())
    .filter(Boolean)
    .forEach((domain) => {
      if (seen.has(domain)) return
      seen.add(domain)
      domains.push(domain)
    })
  return domains
})
const allowedEmailDomainsText = computed(() => allowedEmailDomains.value.join(', '))
const emailDomainSelectionRequired = computed(() => emailDomainAllowlistEnabled.value && allowedEmailDomains.value.length > 0)

watch(allowedEmailDomains, (domains) => {
  if (domains.length === 0) {
    selectedEmailDomain.value = ''
    return
  }
  if (!domains.includes(selectedEmailDomain.value)) {
    selectedEmailDomain.value = domains[0] || ''
  }
}, { immediate: true })

const registrationEmail = computed(() => {
  if (!emailDomainSelectionRequired.value) return email.value.trim()
  const localPart = emailLocalPart.value.trim()
  const domain = selectedEmailDomain.value.trim()
  if (!localPart || !domain) return ''
  return `${localPart}@${domain}`
})

const getEmailDomain = (value: string): string => {
  const normalized = value.trim().toLowerCase()
  const at = normalized.lastIndexOf('@')
  if (at <= 0 || at === normalized.length - 1) return ''
  return normalized.slice(at + 1)
}

const emailDomainRule = (value: string): string | null => {
  if (!emailDomainAllowlistEnabled.value) return null
  const domain = getEmailDomain(value)
  if (!domain) return null
  if (allowedEmailDomains.value.length === 0) {
    return t('auth.register.errors.emailDomainUnavailable')
  }
  if (allowedEmailDomains.value.includes(domain)) return null
  return t('auth.register.errors.emailDomainNotAllowed', { domains: allowedEmailDomainsText.value })
}

const touchRegistrationEmail = () => {
  formValidation.touchField('email', registrationEmail.value)
}

const formValidation = useFormValidation(['email', 'password'])
formValidation.addRule('email', formValidation.requiredRule())
formValidation.addRule('email', formValidation.emailRule())
formValidation.addRule('email', emailDomainRule)
formValidation.addRule('password', formValidation.requiredRule())
formValidation.addRule('password', formValidation.minLengthRule(6))

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
  const currentEmail = registrationEmail.value
  if (!currentEmail) {
    error.value = t('auth.register.errors.emailRequired')
    return
  }
  touchRegistrationEmail()
  if (formValidation.hasError('email')) return
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
      email: currentEmail,
      purpose: 'register',
      captcha_payload: getCaptchaPayload(),
    })
    startCountdown()
  } catch (err: any) {
    error.value = err.message || t('auth.register.errors.sendCodeFailed')
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

const performRegister = async () => {
  error.value = ''
  const currentEmail = registrationEmail.value
  if (!formValidation.validateAll({ email: currentEmail, password: password.value })) return
  if (emailVerificationEnabled.value && !code.value) return
  if (!agreed.value) {
    error.value = t('auth.register.errors.agreementRequired')
    return
  }
  try {
    await userAuthStore.register({
      email: currentEmail,
      password: password.value,
      code: emailVerificationEnabled.value ? code.value : '',
      agreement_accepted: agreed.value,
    })
    router.push('/me/orders')
  } catch (err: any) {
    error.value = err.message || t('auth.register.errors.registerFailed')
  }
}

const handleSendCode = debounceAsync(performSendCode, 200)
const handleRegister = debounceAsync(performRegister, 200)

onMounted(async () => {
  await appStore.loadConfig(true)
})
</script>
