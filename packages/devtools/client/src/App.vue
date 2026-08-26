<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AstPanel from './components/AstPanel.vue'
import FilesPanel from './components/FilesPanel.vue'
import PipelinePanel from './components/PipelinePanel.vue'
import { connect, connected, connectionError, run } from './devtools'

const tab = ref<'pipeline' | 'ast' | 'files'>('pipeline')
const dark = ref(false)

onMounted(() => {
  // tokens.css has no prefers-color-scheme block on purpose, so the class is ours to set.
  dark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyTheme()
  connect()
})

function applyTheme() {
  document.documentElement.classList.toggle('dark', dark.value)
}

function toggleTheme() {
  dark.value = !dark.value
  applyTheme()
}

const status = computed(() => run.value?.status ?? 'running')

const elapsed = computed(() => {
  if (!run.value?.endedAt) return null
  const ms = run.value.endedAt - run.value.startedAt
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
})
</script>

<template>
  <div class="app">
    <header>
      <div class="brand">
        <span class="mark">kubb</span>
        <span class="title">DevTools</span>
        <span v-if="run?.config" class="config">{{ run.config }}</span>
      </div>

      <nav>
        <button type="button" :class="{ active: tab === 'pipeline' }" @click="tab = 'pipeline'">Pipeline</button>
        <button type="button" :class="{ active: tab === 'ast' }" @click="tab = 'ast'">AST</button>
        <button type="button" :class="{ active: tab === 'files' }" @click="tab = 'files'">Files</button>
      </nav>

      <div class="meta">
        <span class="status" :data-status="status">{{ status }}</span>
        <span v-if="elapsed" class="elapsed">{{ elapsed }}</span>
        <button type="button" class="theme" @click="toggleTheme">{{ dark ? '☾' : '☀' }}</button>
      </div>
    </header>

    <p v-if="connectionError" class="banner error">Could not connect: {{ connectionError }}</p>
    <p v-else-if="!connected" class="banner">Connecting…</p>

    <main>
      <PipelinePanel v-show="tab === 'pipeline'" />
      <AstPanel v-show="tab === 'ast'" />
      <FilesPanel v-show="tab === 'files'" />
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1rem;
  height: var(--ui-header-height, 3rem);
  border-bottom: 1px solid var(--kubb-line);
  flex: none;
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.mark {
  color: var(--kubb-brand);
  font-weight: 700;
}

.title {
  font-weight: 600;
}

.config {
  color: var(--kubb-text-3);
  font-family: var(--kubb-font-mono);
  font-size: 0.75rem;
}

nav {
  display: flex;
  gap: 0.25rem;
}

nav button {
  padding: 0.3rem 0.75rem;
  border: 1px solid transparent;
  border-radius: var(--kubb-radius-md, 0.375rem);
  background: transparent;
  color: var(--kubb-text-2);
  font-size: 0.85rem;
}

nav button.active {
  border-color: var(--kubb-line);
  background: var(--kubb-bg-soft);
  color: var(--kubb-text);
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.78rem;
}

.status {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.status[data-status='running'] {
  color: var(--kubb-warning);
}

.status[data-status='success'] {
  color: var(--kubb-success);
}

.status[data-status='failed'] {
  color: var(--kubb-danger);
}

.elapsed {
  color: var(--kubb-text-3);
  font-family: var(--kubb-font-mono);
}

.theme {
  border: 1px solid var(--kubb-line);
  border-radius: var(--kubb-radius-md, 0.375rem);
  background: transparent;
  padding: 0.15rem 0.45rem;
  color: var(--kubb-text-2);
}

.banner {
  margin: 0;
  padding: 0.4rem 1rem;
  background: var(--kubb-bg-soft);
  color: var(--kubb-text-2);
  font-size: 0.8rem;
}

.banner.error {
  color: var(--kubb-danger);
}

main {
  flex: 1;
  min-height: 0;
  padding: 1rem;
}

main > * {
  height: 100%;
}
</style>
