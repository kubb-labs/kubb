// Same as run-one.mjs, but each plugin writes one file per schema/operation into a directory
// (`mode: 'directory'`) instead of kubb's file-mode default. Exists to show how much of the
// v4-vs-v5 speedup in the migration guide's Performance section comes from output mode rather
// than the rewrite itself: that comparison uses directory mode (plus plugin-faker), this harness
// otherwise uses file mode (plugin-ts + plugin-axios + plugin-zod, no faker).
import { readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createKubb } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginZod } from '@kubb/plugin-zod'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const [, , fixtureName] = process.argv

const fixturePath = path.resolve(__dirname, '../fixtures', fixtureName)
const outDir = path.resolve(__dirname, '.out-directory', fixtureName.replace(/\W+/g, '_'))

function dirStats(dir) {
  let files = 0
  let bytes = 0
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile()) continue
    files++
    bytes += statSync(path.join(entry.parentPath ?? entry.path, entry.name)).size
  }
  return { files, bytes }
}

rmSync(outDir, { recursive: true, force: true })

if (global.gc) global.gc()
const memBefore = process.memoryUsage()
let peakRss = memBefore.rss
const sampler = setInterval(() => {
  const rss = process.memoryUsage().rss
  if (rss > peakRss) peakRss = rss
}, 20)

const t0 = performance.now()

const kubb = createKubb({
  root: '.',
  input: fixturePath,
  output: { path: outDir, clean: true, format: false, lint: false },
  adapter: adapterOas({ unknownType: 'unknown' }),
  plugins: [
    pluginTs({ output: { path: 'models', mode: 'directory' } }),
    pluginZod({ output: { path: 'zod', mode: 'directory' } }),
    pluginAxios({ output: { path: 'clients', mode: 'directory' } }),
  ],
})

const result = await kubb.safeBuild()

const t1 = performance.now()
clearInterval(sampler)
if (global.gc) global.gc()
const memAfter = process.memoryUsage()

const errorDiagnostics = (result.diagnostics ?? []).filter((d) => d.severity === 'error')
const stats = dirStats(outDir)

const output = {
  tool: 'kubb-v5-directory',
  version: '5.0.0-beta.104 (core) / beta.103 (plugins)',
  fixture: fixtureName,
  durationMs: t1 - t0,
  filesGenerated: stats.files,
  outputBytes: stats.bytes,
  success: !result.error && errorDiagnostics.length === 0,
  error: result.error ? String(result.error.message ?? result.error) : null,
  memory: {
    deltaRssMb: (memAfter.rss - memBefore.rss) / 1024 / 1024,
    peakRssMb: peakRss / 1024 / 1024,
  },
}

process.stdout.write(JSON.stringify(output))
