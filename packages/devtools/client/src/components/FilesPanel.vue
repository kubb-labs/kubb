<script setup lang="ts">
import { ref, watch } from 'vue'
import { type FileEntry, fetchFiles, readGeneratedFile, run } from '../devtools'
import { highlight } from '../highlight'

const files = ref<Array<FileEntry>>([])
const selected = ref<FileEntry | null>(null)
const content = ref<string | null>(null)
const highlighted = ref('')
const loading = ref(false)

watch(
  () => run.value?.id,
  async () => {
    files.value = await fetchFiles()
  },
  { immediate: true },
)

// Files only land in the store at `kubb:build:end`, so the count moving is the cue to refetch.
watch(
  () => run.value?.fileCount,
  async () => {
    files.value = await fetchFiles()
  },
)

async function select(file: FileEntry) {
  selected.value = file
  loading.value = true
  highlighted.value = ''
  content.value = await readGeneratedFile(file.id)
  loading.value = false

  if (content.value !== null) {
    highlighted.value = await highlight(content.value, file.baseName)
  }
}
</script>

<template>
  <div class="panel">
    <div class="list">
      <p v-if="!files.length" class="empty">No files written yet.</p>
      <button v-for="file in files" :key="file.id" type="button" class="file" :class="{ active: selected?.id === file.id }" @click="select(file)">
        {{ file.baseName }}
        <span class="path">{{ file.path }}</span>
      </button>
    </div>

    <div class="preview">
      <p v-if="!selected" class="empty">Select a file to read what Kubb wrote.</p>
      <p v-else-if="loading" class="empty">Reading…</p>
      <p v-else-if="content === null" class="empty">Could not read this file from disk. It may not have been flushed yet.</p>
      <div v-else class="code" v-html="highlighted" />
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: grid;
  grid-template-columns: 22rem 1fr;
  gap: 1rem;
  height: 100%;
  min-height: 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-height: 0;
  overflow: auto;
  padding-right: 0.25rem;
}

.file {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid transparent;
  border-radius: var(--kubb-radius-md, 0.375rem);
  background: transparent;
  text-align: left;
  color: var(--kubb-text);
  font-family: var(--kubb-font-mono);
  font-size: 0.8rem;
}

.file:hover {
  background: var(--kubb-bg-soft);
}

.file.active {
  border-color: var(--kubb-brand);
  background: var(--kubb-brand-dim);
}

.path {
  color: var(--kubb-text-3);
  font-size: 0.7rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview {
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--kubb-line);
  border-radius: var(--kubb-radius-lg, 0.5rem);
  background: var(--kubb-bg-soft);
}

.preview > .empty {
  padding: 0.75rem;
}

.preview :deep(pre.shiki) {
  margin: 0;
  padding: 0.75rem;
  background: transparent !important;
  font-family: var(--kubb-font-mono);
  font-size: 0.78rem;
  line-height: 1.5;
  white-space: pre;
}

/* tokens.css deliberately has no prefers-color-scheme block, so this only fires once the
   app sets .dark on the root itself — see App.vue's theme toggle. */
.dark .preview :deep(.shiki),
.dark .preview :deep(.shiki span) {
  color: var(--shiki-dark) !important;
}

.empty {
  color: var(--kubb-text-3);
  font-size: 0.875rem;
}
</style>
