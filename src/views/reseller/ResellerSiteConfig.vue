<template>
  <div>
    <ResellerSectionHeader
      :title="t('resellerConsole.site.title')"
      :description="t('resellerConsole.site.description')"
    />
    <ResellerSiteConfigPanel :embedded="true" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ResellerSectionHeader from '../../components/reseller-console/ResellerSectionHeader.vue'
import ResellerSiteConfigPanel from '../../components/reseller/ResellerSiteConfigPanel.vue'

const { t } = useI18n()
</script>
