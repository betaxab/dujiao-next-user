<template>
  <div class="space-y-5">
    <ResellerSectionHeader
      :title="t('resellerConsole.domains.title')"
      :description="t('resellerConsole.domains.description')"
    >
      <template #actions>
        <Button type="button" variant="outline" size="sm" @click="load">
          <RotateCw class="h-4 w-4" />
          {{ t('orders.filters.refresh') }}
        </Button>
      </template>
    </ResellerSectionHeader>

    <Alert
      v-if="alert"
      :variant="alert.level === 'error' ? 'destructive' : 'default'"
      :class="alert.level === 'success' ? 'border-success/40 text-success' : ''"
    >
      <AlertDescription>{{ alert.message }}</AlertDescription>
    </Alert>

    <ResellerPageState v-if="loading" loading :title="t('resellerConsole.common.loading')" />

    <template v-else>
      <Card v-if="canSubmitDomain" class="p-4">
        <form class="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]" @submit.prevent="submitDomain">
          <Input
            v-model.trim="domainForm.domain"
            type="text"
            :disabled="submitting"
            :placeholder="t('personalCenter.reseller.customDomainPlaceholder')"
          />
          <Button type="submit" :disabled="submitting || !domainForm.domain.trim()">
            {{ submitting ? t('personalCenter.reseller.submittingDomain') : t('personalCenter.reseller.submitDomain') }}
          </Button>
        </form>
      </Card>

      <ResellerPageState
        v-if="domains.length === 0"
        :title="t('personalCenter.reseller.domainEmpty')"
        :description="t('resellerConsole.domains.emptyDescription')"
        :icon="Globe"
      />

      <template v-else>
        <section v-for="group in domainGroups" :key="group.key">
          <h2 class="mb-3 text-sm font-bold text-foreground">{{ group.title }}</h2>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card v-for="item in group.items" :key="item.id" class="p-4 sm:p-5">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="break-all font-mono text-sm font-bold text-foreground">{{ item.domain }}</div>
                  <div class="mt-2 flex flex-wrap gap-2 text-xs">
                    <ResellerStatusBadge :label="domainStatusLabel(item.status)" :tone="domainTone(item.status)" />
                    <ResellerStatusBadge :label="verificationLabel(item.verification_status)" :tone="verificationTone(item.verification_status)" />
                    <ResellerStatusBadge :label="domainTypeLabel(item.type)" tone="neutral" />
                  </div>
                </div>
                <ResellerStatusBadge v-if="item.is_primary" :label="t('personalCenter.reseller.primaryDomain')" tone="accent" />
              </div>

              <div class="mt-3 flex flex-wrap items-center gap-2">
                <ResellerCopyButton :value="item.domain" :label="t('resellerConsole.common.copy')" />
                <Button as-child variant="ghost" size="sm">
                  <a :href="`https://${item.domain}`" target="_blank" rel="noopener noreferrer">
                    <ExternalLink class="h-4 w-4" />
                    {{ t('resellerConsole.domains.visit') }}
                  </a>
                </Button>
              </div>

              <div v-if="item.verification_token && item.verification_status !== 'verified'" class="mt-4 rounded-xl border border-dashed px-3 py-3 text-xs text-muted-foreground">
                <div class="font-semibold text-foreground">{{ t('resellerConsole.domains.verifyTitle') }}</div>
                <p class="mt-1 leading-relaxed">{{ t('resellerConsole.domains.verifyDesc') }}</p>
                <div class="mt-2 flex items-center justify-between gap-2 rounded-lg bg-muted px-2.5 py-2">
                  <span class="min-w-0 break-all font-mono text-foreground">{{ item.verification_token }}</span>
                  <ResellerCopyButton :value="item.verification_token" :show-label="false" />
                </div>
              </div>

              <div class="mt-4 text-xs text-muted-foreground">
                {{ t('personalCenter.reseller.updatedAt') }} {{ formatResellerConsoleDate(item.updated_at) }}
              </div>
            </Card>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink, Globe, RotateCw } from 'lucide-vue-next'
import { resellerAPI, type ResellerManagementSnapshotData } from '../../api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import ResellerCopyButton from '../../components/reseller-console/ResellerCopyButton.vue'
import ResellerPageState from '../../components/reseller-console/ResellerPageState.vue'
import ResellerSectionHeader from '../../components/reseller-console/ResellerSectionHeader.vue'
import ResellerStatusBadge, { type ResellerBadgeTone } from '../../components/reseller-console/ResellerStatusBadge.vue'
import {
  RESELLER_DOMAIN_STATUS_ACTIVE,
  RESELLER_DOMAIN_STATUS_DISABLED,
  RESELLER_DOMAIN_STATUS_PENDING_REVIEW,
  RESELLER_DOMAIN_TYPE_CUSTOM,
  RESELLER_DOMAIN_TYPE_SUBDOMAIN,
  RESELLER_DOMAIN_VERIFICATION_FAILED,
  RESELLER_DOMAIN_VERIFICATION_PENDING,
  RESELLER_DOMAIN_VERIFICATION_VERIFIED,
  RESELLER_PROFILE_STATUS_ACTIVE,
} from '../../constants/reseller'
import { type PageAlert } from '../../utils/alerts'
import { formatResellerConsoleDate } from '../../utils/resellerConsole'
import { getResellerDomainStatusKey } from '../../utils/resellerManagement'

const { t } = useI18n()
const loading = ref(false)
const submitting = ref(false)
const snapshot = ref<ResellerManagementSnapshotData | null>(null)
const alert = ref<PageAlert | null>(null)
const domainForm = reactive({ domain: '' })

const domains = computed(() => snapshot.value?.domains || [])
const canSubmitDomain = computed(() => snapshot.value?.profile?.status === RESELLER_PROFILE_STATUS_ACTIVE)

const domainGroups = computed(() => {
  const system = domains.value.filter((d) => d.type === RESELLER_DOMAIN_TYPE_SUBDOMAIN)
  const custom = domains.value.filter((d) => d.type !== RESELLER_DOMAIN_TYPE_SUBDOMAIN)
  return [
    { key: 'system', title: t('resellerConsole.domains.systemDomains'), items: system },
    { key: 'custom', title: t('resellerConsole.domains.customDomains'), items: custom },
  ].filter((g) => g.items.length > 0)
})

const load = async () => {
  loading.value = true
  alert.value = null
  try {
    const response = await resellerAPI.managementProfile()
    snapshot.value = response.data.data || null
  } finally {
    loading.value = false
  }
}

const submitDomain = async () => {
  if (!domainForm.domain.trim()) return
  submitting.value = true
  alert.value = null
  try {
    await resellerAPI.submitDomain({ domain: domainForm.domain.trim() })
    domainForm.domain = ''
    await load()
    alert.value = { level: 'success', message: t('personalCenter.common.saveSuccess') }
  } catch (err) {
    alert.value = { level: 'error', message: t('personalCenter.common.saveFailed') }
  } finally {
    submitting.value = false
  }
}

const domainStatusLabel = (status?: string) => t(`personalCenter.reseller.domainStatusMap.${getResellerDomainStatusKey(status)}`)

const domainTone = (status?: string): ResellerBadgeTone => {
  if (status === RESELLER_DOMAIN_STATUS_ACTIVE) return 'success'
  if (status === RESELLER_DOMAIN_STATUS_PENDING_REVIEW) return 'warning'
  if (status === RESELLER_DOMAIN_STATUS_DISABLED) return 'neutral'
  return 'neutral'
}

const verificationLabel = (status?: string) => {
  if (status === RESELLER_DOMAIN_VERIFICATION_VERIFIED) return t('personalCenter.reseller.domainVerificationMap.verified')
  if (status === RESELLER_DOMAIN_VERIFICATION_PENDING) return t('personalCenter.reseller.domainVerificationMap.pending')
  if (status === RESELLER_DOMAIN_VERIFICATION_FAILED) return t('personalCenter.reseller.domainVerificationMap.failed')
  return t('personalCenter.reseller.domainVerificationMap.unknown')
}

const verificationTone = (status?: string): ResellerBadgeTone => {
  if (status === RESELLER_DOMAIN_VERIFICATION_VERIFIED) return 'success'
  if (status === RESELLER_DOMAIN_VERIFICATION_PENDING) return 'warning'
  return 'neutral'
}

const domainTypeLabel = (type?: string) => {
  if (type === RESELLER_DOMAIN_TYPE_SUBDOMAIN) return t('personalCenter.reseller.domainTypeMap.subdomain')
  if (type === RESELLER_DOMAIN_TYPE_CUSTOM) return t('personalCenter.reseller.domainTypeMap.custom')
  return type || '-'
}

onMounted(load)
</script>
