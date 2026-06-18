<template>
  <div>
    <ResellerSectionHeader
      :title="t('resellerConsole.products.title')"
      :description="t('resellerConsole.products.description')"
    />
    <ResellerProductSettingsPanel :embedded="true" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ResellerSectionHeader from '../../components/reseller-console/ResellerSectionHeader.vue'
import ResellerProductSettingsPanel from '../personal/ResellerProductSettingsPanel.vue'

const { t } = useI18n()
</script>
