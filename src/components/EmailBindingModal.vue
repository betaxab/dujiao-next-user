<template>
  <div class="fixed inset-0 z-[9999] flex items-center justify-center theme-page p-4" v-if="isOpen">
    <!-- Backdrop, rigid, non-clickable to close -->
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"></div>

    <!-- Modal Content -->
    <div
      class="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden transform transition-all">
      <!-- Header -->
      <div class="px-6 py-6 border-b border-gray-100 dark:border-gray-800 text-center space-y-2">
        <h3 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          {{ t('personalCenter.security.bindEmailRequiredTitle') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ t('personalCenter.security.bindEmailRequiredDesc') }}
        </p>
      </div>

      <!-- Form -->
      <div class="p-6 space-y-5">
        <form @submit.prevent="submitBinding" class="space-y-4">
          <!-- Email Input -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('auth.login.emailLabel') }}
            </label>
            <div class="relative">
              <input v-model="form.email" type="email" required
                class="w-full px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all duration-200"
                :placeholder="t('auth.login.emailPlaceholder')" />
            </div>
          </div>

          <!-- Captcha (Conditionally Rendered) -->
          <div v-if="sendCodeCaptchaEnabled" class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('auth.common.captchaLabel') }}
            </label>
            <ImageCaptcha
              v-if="captchaProvider === 'image'"
              ref="imageCaptchaRef"
              v-model="captchaPayload"
              :disabled="isSending || countdown > 0"
              @config-stale="handleCaptchaConfigStale"
            />
            <TurnstileCaptcha
              v-else-if="captchaProvider === 'turnstile'"
              ref="turnstileRef"
              v-model="turnstileToken"
              :site-key="turnstileSiteKey"
            />
          </div>

          <!-- Code Input -->
          <div class="space-y-1.5">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ t('auth.common.captchaLabel') }}
            </label>
            <div class="flex space-x-3">
              <input v-model="form.code" type="text" required
                class="flex-1 px-4 py-2.5 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white transition-all duration-200"
                :placeholder="t('auth.register.codePlaceholder')" />
              
              <button type="button" @click="sendCode" :disabled="countdown > 0 || isSending"
                class="px-4 py-2.5 min-w-[100px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20 disabled:border-transparent">
                <span v-if="isSending" class="flex items-center justify-center space-x-1">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                    <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </span>
                <span v-else>{{ countdown > 0 ? `${countdown}s` : t('auth.common.sendCode') }}</span>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <Transition enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform -translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="transform translate-y-0 opacity-100"
            leave-to-class="transform -translate-y-2 opacity-0">
            <div v-if="errorMsg" class="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
              <p class="text-sm text-red-600 dark:text-red-400 text-center">{{ errorMsg }}</p>
            </div>
          </Transition>

          <!-- Submit Button -->
          <div class="pt-2">
            <button type="submit" :disabled="isSubmitting || !form.email || !form.code"
              class="w-full relative group overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25">
              <span class="relative z-10 flex items-center justify-center space-x-2">
                <svg v-if="isSubmitting" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{{ t('personalCenter.security.bindEmail') }}</span>
              </span>
              <!-- Hover effect -->
              <div class="absolute inset-0 h-full w-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserAuthStore } from '../stores/userAuth'
import { useUserProfileStore } from '../stores/userProfile'
import { useAppStore } from '../stores/app'
import { userProfileAPI } from '../api'
import type { CaptchaPayload } from '../api'
import ImageCaptcha from './captcha/ImageCaptcha.vue'
import TurnstileCaptcha from './captcha/TurnstileCaptcha.vue'

const { t } = useI18n()
const userAuthStore = useUserAuthStore()
const userProfileStore = useUserProfileStore()
const appStore = useAppStore()

const form = ref({
  email: '',
  code: ''
})

const isSending = ref(false)
const isSubmitting = ref(false)
const countdown = ref(0)
const errorMsg = ref('')

const captchaPayload = ref<CaptchaPayload>({})
const turnstileToken = ref('')
const imageCaptchaRef = ref<InstanceType<typeof ImageCaptcha> | null>(null)
const turnstileRef = ref<InstanceType<typeof TurnstileCaptcha> | null>(null)
let timer: number | undefined

const captchaConfig = computed(() => appStore.config?.captcha || null)
const captchaProvider = computed(() => String(captchaConfig.value?.provider || 'none'))
const sendCodeCaptchaEnabled = computed(() => !!captchaConfig.value?.scenes?.register_send_code && captchaProvider.value !== 'none')
const turnstileSiteKey = computed(() => String(captchaConfig.value?.turnstile?.site_key || ''))

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

// Show modal if user is authenticated, has bind_only mode, and no verified email
const isOpen = computed(() => {
  const user = userAuthStore.user
  return userAuthStore.isAuthenticated && 
         user?.email_change_mode === 'bind_only' && 
         !user?.email_verified_at
})

const startCountdown = () => {
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }, 1000)
}

const sendCode = async () => {
  if (!form.value.email) {
    errorMsg.value = t('auth.register.errors.emailRequired')
    return
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    errorMsg.value = t('error.email_invalid')
    return
  }

  if (sendCodeCaptchaEnabled.value && captchaProvider.value === 'image') {
    if (!captchaPayload.value.captcha_id || !captchaPayload.value.captcha_code) {
      errorMsg.value = t('auth.common.captchaRequired')
      return
    }
  }
  if (sendCodeCaptchaEnabled.value && captchaProvider.value === 'turnstile') {
    if (!turnstileToken.value) {
      errorMsg.value = t('auth.common.captchaRequired')
      return
    }
  }

  errorMsg.value = ''
  isSending.value = true

  try {
    const res = await userProfileAPI.sendChangeEmailCode({ 
      kind: 'new', 
      new_email: form.value.email,
      captcha_payload: getCaptchaPayload()
    } as any)
    
    if (res.data.status_code === 0) {
      startCountdown()
    }
  } catch (error: any) {
    errorMsg.value = error.message || t('common.api.requestFailed')
    if (captchaProvider.value === 'image') {
      imageCaptchaRef.value?.refresh()
    }
    if (captchaProvider.value === 'turnstile') {
      turnstileRef.value?.reset()
      turnstileToken.value = ''
    }
  } finally {
    isSending.value = false
  }
}

const submitBinding = async () => {
  if (!form.value.email || !form.value.code) {
    errorMsg.value = t('common.formIncomplete')
    return
  }

  errorMsg.value = ''
  isSubmitting.value = true

  try {
    const res = await userProfileAPI.changeEmail({
      new_email: form.value.email,
      new_code: form.value.code
    })

    if (res.data.status_code === 0) {
      // Sync user profile to store, which triggers isOpen to evaluate to false
      userAuthStore.syncUserProfile(res.data.data)
      // Also update profile store if loaded
      userProfileStore.profile = res.data.data
      
      // Clear form
      form.value = { email: '', code: '' }
    }
  } catch (error: any) {
    errorMsg.value = error.message || t('common.api.requestFailed')
  } finally {
    isSubmitting.value = false
  }
}
</script>
