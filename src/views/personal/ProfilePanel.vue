<template>
  <div class="rounded-2xl border bg-card p-7 shadow-sm">
    <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-xl font-bold text-foreground">{{ t('personalCenter.profile.title') }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('personalCenter.profile.subtitle') }}</p>
      </div>
      <Badge variant="accent" size="sm">
        {{ t('personalCenter.tabs.profile') }}
      </Badge>
    </div>

    <Alert v-if="profileAlert" class="mb-5" :variant="pageAlertVariant(profileAlert.level)" :class="pageAlertToneClass(profileAlert.level)">
      <AlertDescription>{{ profileAlert.message }}</AlertDescription>
    </Alert>

    <form class="space-y-6" @submit.prevent="handleSaveProfile">
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div class="md:col-span-2">
          <label class="mb-2 block text-sm font-medium text-foreground">{{ t('personalCenter.profile.emailLabel') }}</label>
          <Input :model-value="userProfileStore.profile?.email || ''" disabled class="h-11" />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-foreground">{{ t('personalCenter.profile.nicknameLabel') }}</label>
          <Input
            v-model="profileForm.nickname"
            :placeholder="t('personalCenter.profile.nicknamePlaceholder')"
            class="h-11"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-foreground">{{ t('personalCenter.profile.localeLabel') }}</label>
          <Select v-model="profileForm.locale">
            <SelectTrigger class="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zh-CN">简体中文</SelectItem>
              <SelectItem value="zh-TW">繁體中文</SelectItem>
              <SelectItem value="en-US">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="flex flex-col gap-3 border-t border-gray-200/70 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-muted-foreground">{{ t('personalCenter.profile.subtitle') }}</p>
        <Button type="submit" :disabled="userProfileStore.savingProfile" class="h-11 font-bold">
          {{ userProfileStore.savingProfile ? t('personalCenter.profile.saving') : t('personalCenter.profile.save') }}
        </Button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { pageAlertVariant, pageAlertToneClass, type PageAlert } from '../../utils/alerts'
import { useUserProfileStore } from '../../stores/userProfile'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const { t } = useI18n()
const userProfileStore = useUserProfileStore()

const profileForm = reactive({
  nickname: '',
  locale: 'zh-CN',
})

const profileAlert = ref<PageAlert | null>(null)

const handleSaveProfile = async () => {
  profileAlert.value = null
  const payload = {
    nickname: profileForm.nickname.trim(),
    locale: profileForm.locale,
  }
  const ok = await userProfileStore.saveProfile(payload)
  if (!ok) {
    profileAlert.value = {
      level: 'error',
      message: userProfileStore.profileError || t('personalCenter.common.saveFailed'),
    }
    return
  }
  profileAlert.value = {
    level: 'success',
    message: t('personalCenter.profile.saveSuccess'),
  }
}

watch(
  () => userProfileStore.profile,
  (profile) => {
    if (!profile) return
    profileForm.nickname = profile.nickname || ''
    profileForm.locale = profile.locale || 'zh-CN'
  },
  { immediate: true }
)
</script>
