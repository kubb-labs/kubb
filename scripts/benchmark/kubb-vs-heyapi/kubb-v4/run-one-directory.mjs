// Same as run-one.mjs, but each plugin writes one file per schema/operation into a directory
// (`mode: 'directory'`) instead of a consolidated file. Pairs with kubb-v5/run-one-directory.mjs
// for an apples-to-apples v4-vs-v5 comparison that isolates the rewrite itself from both the
// output-mode difference and the plugin-faker inclusion in the migration guide's benchmark.
import { readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'
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

const result = await build({
  config: {
    root: '.',
    input: { path: fixturePath },
    output: { path: outDir, clean: true, format: false, lint: false },
    plugins: [
      pluginOas(),
      pluginTs({ output: { path: 'models', mode: 'directory' } }),
      pluginZod({ output: { path: 'zod', mode: 'directory' } }),
      pluginClient({ output: { path: 'clients', mode: 'directory' } }),
    ],
  },
})

const t1 = performance.now()
clearInterval(sampler)
if (global.gc) global.gc()
const memAfter = process.memoryUsage()

const stats = dirStats(outDir)

const output = {
  tool: 'kubb-v4-directory',
  version: '4.39.2',
  fixture: fixtureName,
  durationMs: t1 - t0,
  filesGenerated: stats.files,
  outputBytes: stats.bytes,
  success: !result.error && result.failedPlugins.size === 0,
  error: result.error ? String(result.error.message ?? result.error) : null,
  memory: {
    deltaRssMb: (memAfter.rss - memBefore.rss) / 1024 / 1024,
    peakRssMb: peakRss / 1024 / 1024,
  },
}

process.stdout.write(JSON.stringify(output))
