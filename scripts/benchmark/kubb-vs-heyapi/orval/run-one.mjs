// Runs a single orval (8.22.0) generation for one fixture, using its axios client (types +
// axios SDK) and its separate zod schema generator, in an isolated process. Orval has no single
// config that emits both an axios client and standalone zod schemas together (`client: 'zod'`
// is its own generation mode, distinct from `client: 'axios'`), so a "typescript + axios + zod"
// orval setup is genuinely two generate() calls into the same output tree, matching how real
// projects configure orval (two named workspaces in orval.config.ts). Invoked with --expose-gc
// so memory samples reflect heap state after a forced GC.
import { readdirSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generate } from 'orval'

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
// orval's generate() writes progress straight to stdout, which would otherwise interleave with
// the JSON result line the orchestrator parses. Suppress stdout for the duration of the call.
const realStdoutWrite = process.stdout.write.bind(process.stdout)
process.stdout.write = () => true
try {
  await generate({
    input: fixturePath,
    output: {
      target: path.join(outDir, 'endpoints.ts'),
      schemas: path.join(outDir, 'models'),
      client: 'axios',
      clean: true,
    },
  })
  await generate({
    input: fixturePath,
    output: {
      target: path.join(outDir, 'zod'),
      client: 'zod',
    },
  })
} catch (e) {
  success = false
  error = String(e.message ?? e)
} finally {
  process.stdout.write = realStdoutWrite
}

const t1 = performance.now()
clearInterval(sampler)
if (global.gc) global.gc()
const memAfter = process.memoryUsage()

const stats = success ? dirStats(outDir) : { files: 0, bytes: 0 }

const output = {
  tool: 'orval',
  version: 'orval@8.22.0',
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
