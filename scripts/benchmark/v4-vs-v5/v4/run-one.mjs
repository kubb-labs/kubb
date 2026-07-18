// Runs a single Kubb v4 (4.39.2) generation for one (fixture, combo) pair in an isolated
// process. Invoked with --expose-gc so memory samples reflect heap state after a forced GC,
// not whatever garbage the previous run happened to leave behind.
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginClient } from '@kubb/plugin-client'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFaker } from '@kubb/plugin-faker'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const [, , fixtureName, comboName] = process.argv

const fixturePath = path.resolve(__dirname, '../fixtures', fixtureName)
const outDir = path.resolve(__dirname, '.out', `${comboName}-${fixtureName.replace(/\W+/g, '_')}`)

const combos = {
  ts: () => [pluginOas(), pluginTs({ output: { path: 'models', mode: 'directory' } })],
  'ts-client': () => [
    pluginOas(),
    pluginTs({ output: { path: 'models', mode: 'directory' } }),
    pluginClient({ output: { path: 'clients', mode: 'directory' } }),
  ],
  full: () => [
    pluginOas(),
    pluginTs({ output: { path: 'models', mode: 'directory' } }),
    pluginZod({ output: { path: 'zod', mode: 'directory' } }),
    pluginClient({ output: { path: 'clients', mode: 'directory' } }),
    pluginFaker({ output: { path: 'faker', mode: 'directory' } }),
  ],
}

if (!combos[comboName]) {
  console.error(`Unknown combo: ${comboName}`)
  process.exit(1)
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
    plugins: combos[comboName](),
  },
})

const t1 = performance.now()
clearInterval(sampler)
if (global.gc) global.gc()
const memAfter = process.memoryUsage()

const output = {
  version: 'v4',
  kubbVersion: '4.39.2',
  fixture: fixtureName,
  combo: comboName,
  durationMs: t1 - t0,
  filesGenerated: result.files.length,
  success: !result.error && result.failedPlugins.size === 0,
  error: result.error ? String(result.error.message ?? result.error) : null,
  failedPlugins: [...result.failedPlugins].map((f) => ({ plugin: f.plugin.name, error: String(f.error?.message ?? f.error) })),
  memory: {
    beforeRssMb: memBefore.rss / 1024 / 1024,
    afterRssMb: memAfter.rss / 1024 / 1024,
    deltaRssMb: (memAfter.rss - memBefore.rss) / 1024 / 1024,
    beforeHeapUsedMb: memBefore.heapUsed / 1024 / 1024,
    afterHeapUsedMb: memAfter.heapUsed / 1024 / 1024,
    deltaHeapUsedMb: (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024,
    peakRssMb: peakRss / 1024 / 1024,
  },
}

process.stdout.write(JSON.stringify(output))
