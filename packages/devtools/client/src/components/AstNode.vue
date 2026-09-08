<script setup lang="ts">
import { computed, ref } from 'vue'

type Props = {
  label: string
  value: unknown
  depth?: number
  /** Renders the row dimmed, used for nodes a plugin never received. */
  muted?: boolean
}

const props = withDefaults(defineProps<Props>(), { depth: 0, muted: false })

const open = ref(props.depth < 1)

const isBranch = computed(() => typeof props.value === 'object' && props.value !== null)

// AST nodes carry every optional field explicitly, so an unfiltered tree is mostly
// `undefined` rows. Hiding them is what makes the panel readable.
const entries = computed<Array<[string, unknown]>>(() => {
  if (!isBranch.value) return []
  if (Array.isArray(props.value)) return props.value.map((item, index) => [String(index), item])
  return Object.entries(props.value as Record<string, unknown>).filter(([, value]) => value !== undefined)
})

// The AST's own discriminators are worth surfacing on the collapsed row, so a closed
// branch still says what it is.
const badge = computed(() => {
  if (!isBranch.value || Array.isArray(props.value)) return null
  const record = props.value as Record<string, unknown>
  const name = typeof record.name === 'string' ? record.name : null
  const kind = typeof record.type === 'string' ? record.type : typeof record.kind === 'string' ? record.kind : null
  return [name, kind].filter(Boolean).join(' · ') || null
})

const preview = computed(() => {
  if (Array.isArray(props.value)) return `[${props.value.length}]`
  if (isBranch.value) return badge.value ?? '{…}'
  if (typeof props.value === 'string') return `"${props.value}"`
  return String(props.value)
})

const color = computed(() => {
  if (Array.isArray(props.value)) return 'var(--kubb-viz-teal)'
  if (isBranch.value) return 'var(--kubb-viz-indigo)'
  if (typeof props.value === 'string') return 'var(--kubb-viz-green)'
  return 'var(--kubb-viz-violet)'
})
</script>

<template>
  <div class="ast-node" :class="{ muted }">
    <button v-if="isBranch" class="ast-row" type="button" @click="open = !open">
      <span class="ast-caret">{{ open ? '▾' : '▸' }}</span>
      <span class="ast-label">{{ label }}</span>
      <span class="ast-preview" :style="{ color }">{{ preview }}</span>
    </button>
    <div v-else class="ast-row leaf">
      <span class="ast-caret" />
      <span class="ast-label">{{ label }}</span>
      <span class="ast-preview" :style="{ color }">{{ preview }}</span>
    </div>

    <div v-if="isBranch && open" class="ast-children">
      <AstNode v-for="[key, child] in entries" :key="key" :label="key" :value="child" :depth="depth + 1" :muted="muted" />
    </div>
  </div>
</template>

<style scoped>
.ast-node.muted {
  opacity: 0.45;
}

.ast-row {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  width: 100%;
  padding: 0.15rem 0.35rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-family: var(--kubb-font-mono);
  font-size: 0.8rem;
  text-align: left;
  color: var(--kubb-text);
}

.ast-row:hover {
  background: var(--kubb-bg-soft);
}

.ast-row.leaf:hover {
  background: transparent;
}

.ast-caret {
  width: 0.75rem;
  flex: none;
  color: var(--kubb-text-3);
}

.ast-label {
  color: var(--kubb-text-2);
}

.ast-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ast-children {
  margin-left: 0.75rem;
  border-left: 1px solid var(--kubb-line-soft);
  padding-left: 0.35rem;
}
</style>
