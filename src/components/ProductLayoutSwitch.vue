<template>
  <div role="group" :aria-label="t('products.layout')" class="inline-flex shrink-0 gap-0.5 rounded-xl bg-card p-0.5 ring-1 ring-border">
    <button
      v-for="option in layoutOptions"
      :key="option.value"
      type="button"
      class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
      :class="layout === option.value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'"
      :aria-label="t(option.label)"
      :aria-pressed="layout === option.value"
      @click="layout = option.value"
    >
      <component :is="option.icon" class="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { LayoutGrid, List } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const layout = defineModel<'grid' | 'list'>({ required: true })
const layoutOptions = [
  { value: 'grid', icon: LayoutGrid, label: 'products.gridLayout' },
  { value: 'list', icon: List, label: 'products.listLayout' },
] as const
</script>
