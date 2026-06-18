<template>
  <div class="space-y-3">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div class="min-w-0">
        <div class="truncate text-sm font-bold text-foreground">{{ label }}</div>
        <div class="text-xs text-muted-foreground">{{ t('personalCenter.reseller.productSettings.basePrice') }} {{ basePrice }}</div>
      </div>
      <label class="inline-flex items-center gap-2 text-sm text-foreground">
        <Switch :model-value="modelValue.is_listed" @update:model-value="updateBoolean" />
        {{ t('personalCenter.reseller.productSettings.listed') }}
      </label>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <Select :model-value="modelValue.pricing_mode" @update:model-value="(v) => updateString('pricing_mode', v)">
        <SelectTrigger>
          <SelectValue :placeholder="t('personalCenter.reseller.productSettings.pricingMode')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="inherit">{{ t('personalCenter.reseller.productSettings.inherit') }}</SelectItem>
          <SelectItem value="markup_percent">{{ t('personalCenter.reseller.productSettings.markupPercent') }}</SelectItem>
          <SelectItem value="fixed_markup">{{ t('personalCenter.reseller.productSettings.fixedMarkup') }}</SelectItem>
          <SelectItem value="fixed_price">{{ t('personalCenter.reseller.productSettings.fixedPrice') }}</SelectItem>
        </SelectContent>
      </Select>
      <Input
        :model-value="modelValue.markup_percent"
        type="text"
        inputmode="decimal"
        :placeholder="t('personalCenter.reseller.productSettings.markupPercentField')"
        @update:model-value="(v) => updateString('markup_percent', v)"
      />
      <Input
        :model-value="modelValue.fixed_markup_amount"
        type="text"
        inputmode="decimal"
        :placeholder="t('personalCenter.reseller.productSettings.fixedMarkupField')"
        @update:model-value="(v) => updateString('fixed_markup_amount', v)"
      />
      <Input
        :model-value="modelValue.fixed_price_amount"
        type="text"
        inputmode="decimal"
        :placeholder="t('personalCenter.reseller.productSettings.fixedPriceField')"
        @update:model-value="(v) => updateString('fixed_price_amount', v)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { ResellerProductSettingPayloadItem } from '../../api/types'

const props = defineProps<{
  label: string
  basePrice: string
  modelValue: ResellerProductSettingPayloadItem
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: ResellerProductSettingPayloadItem): void
}>()

const { t } = useI18n()

const updateValue = <K extends keyof ResellerProductSettingPayloadItem>(
  key: K,
  value: ResellerProductSettingPayloadItem[K],
) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

const updateString = (
  key: 'pricing_mode' | 'markup_percent' | 'fixed_markup_amount' | 'fixed_price_amount',
  value: unknown,
) => {
  updateValue(key, String(value ?? '').trim())
}

const updateBoolean = (value: boolean) => {
  updateValue('is_listed', value)
}
</script>
