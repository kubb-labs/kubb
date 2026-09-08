<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type AstSnapshot, fetchAst, run } from '../devtools'
import AstNode from './AstNode.vue'

const ast = ref<AstSnapshot | null>(null)
const filter = ref('')
const tab = ref<'schemas' | 'operations'>('schemas')

async function load() {
  ast.value = await fetchAst()
}

// The run id changes on every build, including watch rebuilds, so this refetches
// without the panel needing its own reload affordance.
watch(() => run.value?.id, load, { immediate: true })

function nameOf(node: Record<string, unknown>): string {
  if (typeof node.name === 'string') return node.name
  if (typeof node.operationId === 'string') return node.operationId
  if (typeof node.path === 'string') return node.path
  return 'unnamed'
}

const nodes = computed(() => {
  const list = tab.value === 'schemas' ? (ast.value?.schemas ?? []) : (ast.value?.operations ?? [])
  const needle = filter.value.trim().toLowerCase()
  if (!needle) return list
  return list.filter((node) => nameOf(node).toLowerCase().includes(needle))
})
</script>

<template>
  <div class="panel">
    <div class="toolbar">
      <div class="tabs">
        <button type="button" :class="{ active: tab === 'schemas' }" @click="tab = 'schemas'">
          Schemas <span class="count">{{ ast?.schemas.length ?? 0 }}</span>
        </button>
        <button type="button" :class="{ active: tab === 'operations' }" @click="tab = 'operations'">
          Operations <span class="count">{{ ast?.operations.length ?? 0 }}</span>
        </button>
      </div>
      <input v-model="filter" class="filter" type="search" placeholder="Filter by name" />
    </div>

    <p v-if="!ast" class="empty">No AST captured yet. It is snapshotted when a build starts.</p>
    <p v-else-if="!nodes.length" class="empty">Nothing matches this filter.</p>

    <div v-else class="tree">
      <AstNode v-for="(node, index) in nodes" :key="index" :label="nameOf(node)" :value="node" />
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.75rem;
}

.tabs {
  display: flex;
  gap: 0.25rem;
}

.tabs button {
  padding: 0.3rem 0.7rem;
  border: 1px solid transparent;
  border-radius: var(--kubb-radius-md, 0.375rem);
  background: transparent;
  color: var(--kubb-text-2);
  font-size: 0.85rem;
}

.tabs button.active {
  border-color: var(--kubb-line);
  background: var(--kubb-bg-soft);
  color: var(--kubb-text);
}

.count {
  color: var(--kubb-text-3);
  font-family: var(--kubb-font-mono);
  font-size: 0.75rem;
}

.filter {
  width: 14rem;
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--kubb-line);
  border-radius: var(--kubb-radius-md, 0.375rem);
  background: var(--kubb-bg);
  color: var(--kubb-text);
  font-size: 0.85rem;
}

.tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--kubb-line);
  border-radius: var(--kubb-radius-lg, 0.5rem);
  background: var(--kubb-bg-soft);
  padding: 0.5rem;
}

.empty {
  color: var(--kubb-text-3);
  font-size: 0.875rem;
}
</style>
