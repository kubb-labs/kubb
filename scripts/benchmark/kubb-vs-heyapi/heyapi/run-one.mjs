// Runs a single @hey-api/openapi-ts (0.99.0) generation for one fixture, using the
// @hey-api/typescript + @hey-api/client-axios + @hey-api/sdk + zod plugins, in an isolated
// process. Invoked with --expose-gc so memory samples reflect heap state after a forced GC.
import { readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@hey-api/openapi-ts'

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

let success = true
let error = null
try {
  await createClient({
    input: fixturePath,
    output: outDir,
    plugins: ['@hey-api/typescript', '@hey-api/client-axios', '@hey-api/sdk', 'zod'],
    logs: { level: 'silent' },
  })
} catch (e) {
  success = false
  error = String(e.message ?? e)
}

const t1 = performance.now()
clearInterval(sampler)
if (global.gc) global.gc()
const memAfter = process.memoryUsage()

const stats = success ? dirStats(outDir) : { files: 0, bytes: 0 }

const output = {
  tool: 'hey-api',
  version: '@hey-api/openapi-ts@0.99.0',
  fixture: fixtureName,
  durationMs: t1 - t0,
  filesGenerated: stats.files,
  outputBytes: stats.bytes,
  success,
  error,
  memory: {
    deltaRssMb: (memAfter.rss - memBefore.rss) / 1024 / 1024,
    peakRssMb: peakRss / 1024 / 1024,
  },
}

process.stdout.write(JSON.stringify(output))
