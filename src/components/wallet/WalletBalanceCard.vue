<template>
  <div class="rounded-2xl border bg-card p-7 shadow-sm">
    <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-xl font-bold text-foreground">{{ t('personalCenter.wallet.title') }}</h2>
        <p class="mt-1 text-sm text-muted-foreground">{{ t('personalCenter.wallet.subtitle') }}</p>
      </div>
      <Badge variant="accent" size="sm">
        {{ t('personalCenter.tabs.wallet') }}
      </Badge>
    </div>

    <Alert v-if="alert" class="mb-5" :variant="pageAlertVariant(alert.level)" :class="pageAlertToneClass(alert.level)">
      <AlertDescription>{{ alert.message }}</AlertDescription>
    </Alert>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div class="rounded-xl border bg-secondary p-4">
        <div class="text-xs text-muted-foreground">{{ t('personalCenter.wallet.balanceLabel') }}</div>
        <div class="mt-2 text-lg font-bold text-foreground">{{ balanceDisplay }}</div>
      </div>
      <div class="rounded-xl border bg-secondary p-4">
        <div class="text-xs text-muted-foreground">{{ t('personalCenter.wallet.transactionsLabel') }}</div>
        <div class="mt-2 text-lg font-bold text-foreground">{{ totalTransactions }}</div>
      </div>
      <div class="rounded-xl border bg-secondary p-4">
        <div class="text-xs text-muted-foreground">{{ t('personalCenter.wallet.currentPageLabel') }}</div>
        <div class="mt-2 text-lg font-bold text-foreground">
          {{ t('orders.pageInfo', { page: currentPage, total: totalPages }) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { pageAlertVariant, pageAlertToneClass, type PageAlert } from '../../utils/alerts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

defineProps<{
  alert: PageAlert | null
  balanceDisplay: string
  totalTransactions: number
  currentPage: number
  totalPages: number
}>()

const { t } = useI18n()
</script>
