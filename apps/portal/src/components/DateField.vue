<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  WEEKDAY_LABELS,
  commitDateText,
  monthCells,
  monthTitle,
  shiftMonth,
  viewFromValue,
} from '../domain/date-field'

const model = defineModel<string>({ required: true })

defineProps<{
  id: string
  required?: boolean
}>()

const open = ref(false)
const draft = ref(model.value)
const cursor = ref(viewFromValue(model.value))
const cells = computed(() => monthCells(cursor.value.year, cursor.value.month))
const title = computed(() => monthTitle(cursor.value.year, cursor.value.month))

watch(model, (value) => {
  if (commitDateText(draft.value) !== value) draft.value = value
})

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  draft.value = value
  const committed = commitDateText(value)
  if (committed === null) return
  model.value = committed
  if (committed) cursor.value = viewFromValue(committed)
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget
  const current = event.currentTarget
  if (current instanceof HTMLElement && next instanceof Node && current.contains(next)) return
  open.value = false
  const committed = commitDateText(draft.value)
  if (committed === null) {
    draft.value = model.value
    return
  }
  model.value = committed
  draft.value = committed
}

function pick(iso: string) {
  model.value = iso
  draft.value = iso
  cursor.value = viewFromValue(iso)
  open.value = false
}

function move(delta: number) {
  cursor.value = shiftMonth(cursor.value.year, cursor.value.month, delta)
}
</script>

<template>
  <div class="date-field" @focusout="onFocusOut">
    <input
      :id="id"
      :value="draft"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      placeholder="yyyy-MM-dd"
      maxlength="32"
      :required="required"
      :aria-expanded="open"
      @input="onInput"
      @focus="open = true"
    />
    <button type="button" class="date-field-toggle" :aria-expanded="open" aria-label="选择日期" @click="open = !open">
      选择
    </button>
    <div v-if="open" class="date-field-panel" role="dialog" aria-label="选择日期">
      <div class="date-field-nav">
        <button type="button" aria-label="上个月" @mousedown.prevent @click="move(-1)">‹</button>
        <span>{{ title }}</span>
        <button type="button" aria-label="下个月" @mousedown.prevent @click="move(1)">›</button>
      </div>
      <div class="date-field-week" aria-hidden="true">
        <span v-for="label in WEEKDAY_LABELS" :key="label">{{ label }}</span>
      </div>
      <div class="date-field-grid">
        <button
          v-for="(cell, index) in cells"
          :key="index"
          type="button"
          class="date-field-day"
          :class="{ 'is-selected': cell?.iso === model }"
          :disabled="!cell"
          @mousedown.prevent
          @click="cell && pick(cell.iso)"
        >
          {{ cell?.day ?? '' }}
        </button>
      </div>
    </div>
  </div>
</template>
