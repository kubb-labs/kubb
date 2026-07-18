// Runs a single Kubb v4 (4.39.2) generation for one fixture, using plugin-ts + plugin-client
// (axios, the default) + plugin-zod, file mode (kubb's default), in an isolated process.
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
const outDir = path.resolve(__dirname, '.out', fixtureName.replace(/\W+/g, '_'))

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
      pluginTs({ output: { path: 'models.ts' } }),
      pluginZod({ output: { path: 'zod.ts' } }),
      pluginClient({ output: { path: 'clients.ts' } }),
    ],
  },
})

const t1 = performance.now()
clearInterval(sampler)
if (global.gc) global.gc()
const memAfter = process.memoryUsage()

const stats = dirStats(outDir)

const output = {
  tool: 'kubb-v4',
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
