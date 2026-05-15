#!/usr/bin/env node
/**
 * Performance measurement: batch vs streaming adapter path.
 *
 * Run:
 *   node --expose-gc packages/adapter-oas/src/perf-report.mjs
 *
 * Two measurement passes per spec:
 *   1. Cold  — full operation including document loading
 *   2. Warm  — second run (document already in OS page cache)
 *
 * Modes:
 *   batch     — adapter.parse()
 *   streaming — adapter.count() + full adapter.stream() drain
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '../dist/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const STRIPE_PATH = '/tmp/kubb-stripe-spec3.json'
const PETSTORE_PATH = path.resolve(__dirname, '../mocks/petStore.yaml')

function gc() {
  if (typeof globalThis.gc === 'function') globalThis.gc()
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function withMemory(fn) {
  gc(); await sleep(100); gc(); await sleep(100); gc()

  const heapBefore = process.memoryUsage().heapUsed
  let peakHeap = heapBefore

  const sampler = setInterval(() => {
    const h = process.memoryUsage().heapUsed
    if (h > peakHeap) peakHeap = h
  }, 5)

  const t0 = performance.now()
  const result = await fn()
  const durationMs = performance.now() - t0
  clearInterval(sampler)

  return { result, peakDeltaMB: (peakHeap - heapBefore) / 1024 / 1024, durationMs }
}

async function runBatch(source) {
  const adapter = adapterOas({ validate: false })
  const inputNode = await adapter.parse(source)
  return { schemas: inputNode.schemas.length, operations: inputNode.operations.length }
}

async function runStreaming(source) {
  const adapter = adapterOas({ validate: false })
  await adapter.count(source)
  const streamNode = await adapter.stream(source)
  let schemas = 0
  let operations = 0
  for await (const _ of streamNode.schemas) schemas++
  for await (const _ of streamNode.operations) operations++
  return { schemas, operations }
}

async function measureSpec(label, source, runs = 3) {
  process.stderr.write(`\n=== ${label} ===\n`)

  // Collect multiple runs and use median
  const batchRuns = []
  const streamRuns = []

  for (let i = 0; i < runs; i++) {
    const b = await withMemory(() => runBatch(source))
    batchRuns.push(b)
    process.stderr.write(`  batch run ${i + 1}: ${b.durationMs.toFixed(0)} ms, +${b.peakDeltaMB.toFixed(2)} MB\n`)
    await sleep(400)

    const s = await withMemory(() => runStreaming(source))
    streamRuns.push(s)
    process.stderr.write(`  stream run ${i + 1}: ${s.durationMs.toFixed(0)} ms, +${s.peakDeltaMB.toFixed(2)} MB\n`)
    await sleep(400)
  }

  const median = (arr, key) => {
    const sorted = [...arr].sort((a, b) => a[key] - b[key])
    return sorted[Math.floor(sorted.length / 2)][key]
  }

  const batch = {
    schemas: batchRuns[0].result.schemas,
    operations: batchRuns[0].result.operations,
    peakDeltaMB: median(batchRuns, 'peakDeltaMB'),
    durationMs: median(batchRuns, 'durationMs'),
  }
  const streaming = {
    schemas: streamRuns[0].result.schemas,
    operations: streamRuns[0].result.operations,
    peakDeltaMB: median(streamRuns, 'peakDeltaMB'),
    durationMs: median(streamRuns, 'durationMs'),
  }

  process.stderr.write(
    `  → batch median:    ${batch.durationMs.toFixed(0)} ms, +${batch.peakDeltaMB.toFixed(2)} MB\n` +
    `  → streaming median: ${streaming.durationMs.toFixed(0)} ms, +${streaming.peakDeltaMB.toFixed(2)} MB\n`
  )

  return { label, schemas: batch.schemas, operations: batch.operations, batch, streaming }
}

function mdRow(...cols) {
  return `| ${cols.join(' | ')} |`
}

function pctChange(from, to) {
  if (Math.abs(from) < 0.01) return 'N/A'
  const pct = ((to - from) / Math.abs(from) * 100).toFixed(0)
  return pct > 0 ? `+${pct}%` : `${pct}%`
}

async function main() {
  const results = []

  results.push(await measureSpec('petStore (~13 schemas)', { type: 'path', path: PETSTORE_PATH }))
  results.push(await measureSpec('Stripe (1,385 schemas, 587 ops)', { type: 'path', path: STRIPE_PATH }))

  console.log('\n## Performance Measurement Results\n')
  console.log('> Median of 3 runs · `--expose-gc` · `validate: false`\n')

  const header = mdRow('Spec', 'Schemas', 'Ops', 'Mode', 'Peak heap Δ (MB)', 'Duration (ms)', 'Heap change', 'Time change')
  const divider = mdRow(':---', '---:', '---:', ':---', '---:', '---:', '---:', '---:')
  const rows = [header, divider]

  for (const r of results) {
    rows.push(mdRow(r.label, String(r.schemas), String(r.operations), '**batch**',
      r.batch.peakDeltaMB.toFixed(2), r.batch.durationMs.toFixed(0), '—', '—'))
    rows.push(mdRow('', '', '', 'streaming',
      r.streaming.peakDeltaMB.toFixed(2), r.streaming.durationMs.toFixed(0),
      pctChange(r.batch.peakDeltaMB, r.streaming.peakDeltaMB),
      pctChange(r.batch.durationMs, r.streaming.durationMs)))
  }

  console.log(rows.join('\n'))
  console.log(`\n_Measured ${new Date().toISOString().split('T')[0]} · Node.js ${process.version} · --expose-gc_\n`)
}

main().catch((e) => { console.error(e); process.exit(1) })
