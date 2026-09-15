import { createApp } from 'vue/dist/vue.esm-bundler.js'
import type { ReporterPluginFiles } from '../../createReporter.ts'
import type { Report } from '../report.ts'

type ReportData = {
  generatedAt: string
  report: Report
  pluginFiles: ReporterPluginFiles
}

const data = (globalThis as typeof globalThis & { __KUBB_REPORT__?: ReportData }).__KUBB_REPORT__

if (!data) {
  throw new Error('Kubb report data is missing.')
}

const formatMs = (value: number) => `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)}ms`
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value))
const { report, pluginFiles } = data
const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches
const theme = document.documentElement.dataset.theme || (prefersDark ? 'dark' : 'light')

document.documentElement.dataset.theme = theme

createApp({
  data: () => ({ ...data, theme }),
  computed: {
    pluginSummary: () =>
      report.status === 'success'
        ? `${report.plugins.passed} passed (${report.plugins.total})`
        : `${report.plugins.passed} passed | ${report.plugins.failed.length} failed (${report.plugins.total})`,
    fileCount: () => pluginFiles.reduce((total, group) => total + group.files.length, 0),
    slowestPlugin: () => report.timings[0],
    pluginActivity: () => {
      const plugins = new Map<string, { files: number; durationMs?: number; failed: boolean }>()
      for (const { plugin, files } of pluginFiles) plugins.set(plugin, { files: files.length, failed: report.plugins.failed.includes(plugin) })
      for (const { plugin, durationMs } of report.timings) {
        const entry = plugins.get(plugin) ?? { files: 0, failed: report.plugins.failed.includes(plugin) }
        plugins.set(plugin, { ...entry, durationMs })
      }
      for (const plugin of report.plugins.failed) if (!plugins.has(plugin)) plugins.set(plugin, { files: 0, failed: true })
      return [...plugins].map(([plugin, details]) => ({ plugin, ...details }))
    },
  },
  methods: {
    formatDate,
    formatMs,
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.dataset.theme = this.theme
    },
  },
  template: `<main><header class="hero"><div class="hero-heading"><div><p class="eyebrow">Kubb run report</p><h1>{{ report.name || 'Unnamed configuration' }}</h1></div><button class="theme-toggle" type="button" :aria-pressed="theme === 'dark'" @click="toggleTheme">{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</button></div><p class="report-date">Generated {{ formatDate(generatedAt) }}</p></header><section><div class="section-heading"><div><p class="eyebrow">This run</p><h2>What Kubb generated</h2></div><span class="badge" :class="report.status">{{ report.status }}</span></div><dl class="stats"><div><dt>Plugins</dt><dd>{{ pluginSummary }}</dd></div><div><dt>Files</dt><dd>{{ report.filesCreated }} generated</dd></div><div><dt>Issues</dt><dd>{{ report.counts.errors }} errors · {{ report.counts.warnings }} warnings · {{ report.counts.infos }} infos</dd></div><div><dt>Duration</dt><dd>{{ formatMs(report.durationMs) }}</dd></div></dl><p v-if="report.plugins.failed.length" class="failure">Failed plugins: {{ report.plugins.failed.join(', ') }}</p><div v-if="slowestPlugin" class="insight"><span>Slowest plugin</span><strong>{{ slowestPlugin.plugin }}</strong><span>{{ formatMs(slowestPlugin.durationMs) }}</span></div><div class="output"><span>Output directory</span><code>{{ report.output }}</code></div></section><section v-if="pluginActivity.length"><div class="section-heading"><div><p class="eyebrow">Plugins</p><h2>What each plugin wrote</h2></div><span class="count">{{ pluginActivity.length }} plugins</span></div><table class="plugin-table"><thead><tr><th>Plugin</th><th>Files</th><th>Duration</th><th>Status</th></tr></thead><tbody><tr v-for="activity in pluginActivity" :key="activity.plugin"><td><code>{{ activity.plugin }}</code></td><td>{{ activity.files }}</td><td>{{ activity.durationMs === undefined ? '—' : formatMs(activity.durationMs) }}</td><td><span class="status" :class="activity.failed ? 'failed' : 'success'">{{ activity.failed ? 'Failed' : 'Done' }}</span></td></tr></tbody></table></section><section><div class="section-heading"><div><p class="eyebrow">Files</p><h2>Files written</h2></div><span class="count">{{ fileCount }} files</span></div><p v-if="!pluginFiles.length" class="muted">Kubb did not record any files for this run.</p><details v-for="group in pluginFiles" :key="group.plugin" open><summary><span>{{ group.plugin }}</span><span class="count">{{ group.files.length }}</span></summary><ul class="file-list"><li v-for="path in group.files" :key="path"><code>{{ path }}</code></li></ul></details></section><section v-if="report.diagnostics.length"><div class="section-heading"><div><p class="eyebrow">Needs attention</p><h2>Errors and warnings</h2></div></div><ul class="problems"><li v-for="diagnostic in report.diagnostics" :key="diagnostic.code + diagnostic.message"><strong>{{ diagnostic.severity }} · {{ diagnostic.code }}</strong><span>{{ diagnostic.message }}</span><small v-if="diagnostic.plugin">{{ diagnostic.plugin }}</small><small v-if="diagnostic.location?.pointer">At {{ diagnostic.location.pointer }}</small><p v-if="diagnostic.help">{{ diagnostic.help }}</p><a v-if="diagnostic.docsUrl" :href="diagnostic.docsUrl" target="_blank" rel="noreferrer">Read the diagnostic guide</a></li></ul></section></main>`,
}).mount('#app')
