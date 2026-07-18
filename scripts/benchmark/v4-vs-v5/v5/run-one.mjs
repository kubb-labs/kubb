// Runs a single Kubb v5 (5.0.0-beta.104 core / beta.103 plugins) generation for one
// (fixture, combo) pair in an isolated process. Invoked with --expose-gc so memory samples
// reflect heap state after a forced GC, not whatever garbage the previous run left behind.
//
// Note: `input` in v5 must be a plain string (path, URL, or inline spec) — passing the v4-style
// `{ path }` object silently gets treated as inline `data` and yields zero parsed schemas.
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createKubb } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginFaker } from '@kubb/plugin-faker'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const [, , fixtureName, comboName] = process.argv

const fixturePath = path.resolve(__dirname, '../fixtures', fixtureName)
const outDir = path.resolve(__dirname, '.out', `${comboName}-${fixtureName.replace(/\W+/g, '_')}`)

const combos = {
  ts: () => [pluginTs({ output: { path: 'models', mode: 'directory' } })],
  'ts-client': () => [
    pluginTs({ output: { path: 'models', mode: 'directory' } }),
    pluginAxios({ output: { path: 'clients', mode: 'directory' } }),
  ],
  full: () => [
    pluginTs({ output: { path: 'models', mode: 'directory' } }),
    pluginZod({ output: { path: 'zod', mode: 'directory' } }),
    pluginAxios({ output: { path: 'clients', mode: 'directory' } }),
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

const kubb = createKubb({
  root: '.',
  input: fixturePath,
  output: { path: outDir, clean: true, format: false, lint: false },
  adapter: adapterOas({ unknownType: 'unknown' }),
  plugins: combos[comboName](),
})

const result = await kubb.safeBuild()

const t1 = performance.now()
clearInterval(sampler)
if (global.gc) global.gc()
const memAfter = process.memoryUsage()

const errorDiagnostics = (result.diagnostics ?? []).filter((d) => d.severity === 'error')

const output = {
  version: 'v5',
  kubbVersion: '5.0.0-beta.104 (core) / beta.103 (plugins)',
  fixture: fixtureName,
  combo: comboName,
  durationMs: t1 - t0,
  filesGenerated: result.files.length,
  success: !result.error && errorDiagnostics.length === 0,
  error: result.error ? String(result.error.message ?? result.error) : null,
  errorDiagnostics: errorDiagnostics.map((d) => ({ plugin: d.plugin, message: d.message })),
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
