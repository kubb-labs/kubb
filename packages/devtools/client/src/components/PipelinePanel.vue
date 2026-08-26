<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { type AstSnapshot, fetchAst, fetchPluginView, run } from '../devtools'

type NodeKind = 'schema' | 'operation'

type Entry = {
  name: string
  kind: NodeKind
}

const selected = ref<string | null>(null)
const ast = ref<AstSnapshot | null>(null)
const view = ref<AstSnapshot | null>(null)

const plugins = computed(() => run.value?.plugins ?? [])

function nameOf(node: Record<string, unknown>): string {
  if (typeof node.name === 'string') return node.name
  if (typeof node.operationId === 'string') return node.operationId
  return 'unnamed'
}

function entryKey(entry: Entry): string {
  return `${entry.kind}:${entry.name}`
}

function toEntries(nodes: Array<Record<string, unknown>>, kind: NodeKind): Array<Entry> {
  return nodes.map((node) => ({ name: nameOf(node), kind }))
}

function entriesOf(snapshot: AstSnapshot | null): Array<Entry> {
  if (!snapshot) return []
  return [...toEntries(snapshot.schemas, 'schema'), ...toEntries(snapshot.operations, 'operation')]
}

watch(
  () => run.value?.id,
  async () => {
    ast.value = await fetchAst()
  },
  { immediate: true },
)

watch(selected, async (name) => {
  view.value = name ? await fetchPluginView(name) : null
})

const received = computed(() => entriesOf(view.value))

// The whole point of the panel: the canonical schemas and operations a plugin never received,
// because its `include` / `exclude` filtered them out.
const skipped = computed(() => {
  const seen = new Set(received.value.map(entryKey))
  return entriesOf(ast.value).filter((entry) => !seen.has(entryKey(entry)))
})

function durationLabel(ms: number | null): string {
  if (ms === null) return '…'
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
}

const maxDuration = computed(() => Math.max(1, ...plugins.value.map((plugin) => plugin.duration ?? 0)))
</script>

<template>
  <div class="panel">
    <div class="plugins">
      <p v-if="!plugins.length" class="empty">No plugins have run yet.</p>
      <button
        v-for="plugin in plugins"
        :key="plugin.name"
        type="button"
        class="plugin"
        :class="{ active: selected === plugin.name }"
        @click="selected = selected === plugin.name ? null : plugin.name"
      >
        <span class="dot" :data-status="plugin.status" />
        <span class="name">{{ plugin.name }}</span>
        <span class="counts">{{ plugin.schemaCount }} schemas · {{ plugin.operationCount }} operations</span>
        <span class="bar-track">
          <span class="bar" :style="{ width: `${((plugin.duration ?? 0) / maxDuration) * 100}%` }" />
        </span>
        <span class="duration">{{ durationLabel(plugin.duration) }}</span>
      </button>
    </div>

    <div v-if="selected" class="detail">
      <h3>{{ selected }}</h3>
      <p class="hint">
        What this plugin received during the walk, against the canonical AST — schemas and operations both. A skipped node was filtered out by the plugin's
        <code>include</code> / <code>exclude</code> / <code>override</code>.
      </p>

      <div class="columns">
        <section>
          <h4>
            Received <span class="count">{{ received.length }}</span>
          </h4>
          <ul>
            <li v-for="entry in received" :key="entryKey(entry)">
              <span class="kind-badge" :data-kind="entry.kind" :title="entry.kind">{{ entry.kind === 'schema' ? 'S' : 'O' }}</span>
              {{ entry.name }}
            </li>
          </ul>
        </section>
        <section>
          <h4>
            Skipped <span class="count">{{ skipped.length }}</span>
          </h4>
          <ul class="skipped">
            <li v-for="entry in skipped" :key="entryKey(entry)">
              <span class="kind-badge" :data-kind="entry.kind" :title="entry.kind">{{ entry.kind === 'schema' ? 'S' : 'O' }}</span>
              {{ entry.name }}
            </li>
          </ul>
        </section>
      </div>
    </div>

    <div v-if="run?.diagnostics.length" class="diagnostics">
      <h4>Diagnostics</h4>
      <ul>
        <li v-for="(diagnostic, index) in run.diagnostics" :key="index" :data-severity="diagnostic.severity">
          <code>{{ diagnostic.code }}</code>
          <span>{{ diagnostic.message }}</span>
          <span v-if="diagnostic.plugin" class="owner">{{ diagnostic.plugin }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100%;
  min-height: 0;
  overflow: auto;
}

.plugins {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.plugin {
  display: grid;
  grid-template-columns: 0.6rem 14rem 1fr 8rem 4rem;
  align-items: center;
  gap: 0.75rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid transparent;
  border-radius: var(--kubb-radius-md, 0.375rem);
  background: transparent;
  text-align: left;
  color: var(--kubb-text);
  font-size: 0.85rem;
}

.plugin:hover {
  background: var(--kubb-bg-soft);
}

.plugin.active {
  border-color: var(--kubb-brand);
  background: var(--kubb-brand-dim);
}

.dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--kubb-text-3);
}

.dot[data-status='running'] {
  background: var(--kubb-warning);
}

.dot[data-status='success'] {
  background: var(--kubb-success);
}

.dot[data-status='failed'] {
  background: var(--kubb-danger);
}

.name {
  font-family: var(--kubb-font-mono);
}

.counts {
  color: var(--kubb-text-3);
  font-size: 0.75rem;
}

.bar-track {
  height: 0.35rem;
  border-radius: 999px;
  background: var(--kubb-bg-mute);
  overflow: hidden;
}

.bar {
  display: block;
  height: 100%;
  background: var(--kubb-brand);
}

.duration {
  color: var(--kubb-text-2);
  font-family: var(--kubb-font-mono);
  font-size: 0.75rem;
  text-align: right;
}

.detail {
  border: 1px solid var(--kubb-line);
  border-radius: var(--kubb-radius-lg, 0.5rem);
  background: var(--kubb-bg-soft);
  padding: 0.85rem;
}

.detail h3 {
  margin: 0 0 0.25rem;
  font-family: var(--kubb-font-mono);
  font-size: 0.9rem;
}

.hint {
  margin: 0 0 0.75rem;
  color: var(--kubb-text-3);
  font-size: 0.8rem;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.columns h4 {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
}

.count {
  color: var(--kubb-text-3);
  font-family: var(--kubb-font-mono);
}

.columns ul {
  margin: 0;
  padding: 0;
  max-height: 14rem;
  overflow: auto;
  list-style: none;
  font-family: var(--kubb-font-mono);
  font-size: 0.75rem;
}

.columns li {
  padding: 0.1rem 0;
}

.skipped li {
  color: var(--kubb-text-3);
  text-decoration: line-through;
}

.kind-badge {
  display: inline-block;
  width: 1.1rem;
  margin-right: 0.35rem;
  border-radius: 3px;
  color: var(--kubb-bg);
  font-size: 0.65rem;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
}

.kind-badge[data-kind='schema'] {
  background: var(--kubb-viz-indigo);
}

.kind-badge[data-kind='operation'] {
  background: var(--kubb-viz-teal);
}

.diagnostics ul {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8rem;
}

.diagnostics li {
  display: flex;
  gap: 0.5rem;
  padding: 0.2rem 0;
}

.diagnostics li[data-severity='error'] code {
  color: var(--kubb-danger);
}

.diagnostics li[data-severity='warning'] code {
  color: var(--kubb-warning);
}

.owner {
  color: var(--kubb-text-3);
}

.empty {
  color: var(--kubb-text-3);
  font-size: 0.875rem;
}
</style>
