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
  gc()
  await sleep(120)
  gc()
  await sleep(120)
  gc()

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

/** AST-only phase: pre-warm adapter so document is already in heap, then measure just the parse/stream. */
async function runBatchAstOnly(source) {
  const adapter = adapterOas({ validate: false })
  // Pre-load document into adapter's internal cache
  await adapter.count(source)
  // Now measure just the AST build from cached document
  return withMemory(async () => {
    const inputNode = await adapter.parse(source)
    return { schemas: inputNode.schemas.length, operations: inputNode.operations.length }
  })
}

async function runStreamingAstOnly(source) {
  const adapter = adapterOas({ validate: false })
  await adapter.count(source)
  return withMemory(async () => {
    const streamNode = await adapter.stream(source)
    let schemas = 0
    let operations = 0
    for await (const _ of streamNode.schemas) schemas++
    for await (const _ of streamNode.operations) operations++
    return { schemas, operations }
  })
}

async function measureSpec(label, source, runs = 5) {
  process.stderr.write(`\n=== ${label} ===\n`)

  const batchRuns = []
  const streamRuns = []
  const batchAstRuns = []
  const streamAstRuns = []

  for (let i = 0; i < runs; i++) {
    const b = await withMemory(() => runBatch(source))
    batchRuns.push(b)
    await sleep(300)

    const s = await withMemory(() => runStreaming(source))
    streamRuns.push(s)
    await sleep(300)

    const ba = await runBatchAstOnly(source)
    batchAstRuns.push(ba)
    await sleep(300)

    const sa = await runStreamingAstOnly(source)
    streamAstRuns.push(sa)
    await sleep(300)

    process.stderr.write(
      `  run ${i + 1}: batch=${b.durationMs.toFixed(0)}ms +${b.peakDeltaMB.toFixed(2)}MB` +
        `  stream=${s.durationMs.toFixed(0)}ms +${s.peakDeltaMB.toFixed(2)}MB` +
        `  batch-ast=${ba.durationMs.toFixed(0)}ms +${ba.peakDeltaMB.toFixed(2)}MB` +
        `  stream-ast=${sa.durationMs.toFixed(0)}ms +${sa.peakDeltaMB.toFixed(2)}MB\n`,
    )
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
  const batchAst = { peakDeltaMB: median(batchAstRuns, 'peakDeltaMB'), durationMs: median(batchAstRuns, 'durationMs') }
  const streamAst = { peakDeltaMB: median(streamAstRuns, 'peakDeltaMB'), durationMs: median(streamAstRuns, 'durationMs') }

  process.stderr.write(
    `  → medians: batch=${batch.durationMs.toFixed(0)}ms +${batch.peakDeltaMB.toFixed(2)}MB` +
      `  stream=${streaming.durationMs.toFixed(0)}ms +${streaming.peakDeltaMB.toFixed(2)}MB\n` +
      `  → ast-only: batch=${batchAst.durationMs.toFixed(0)}ms +${batchAst.peakDeltaMB.toFixed(2)}MB` +
      `  stream=${streamAst.durationMs.toFixed(0)}ms +${streamAst.peakDeltaMB.toFixed(2)}MB\n`,
  )

  return { label, schemas: batch.schemas, operations: batch.operations, batch, streaming, batchAst, streamAst }
}

function mdRow(...cols) {
  return `| ${cols.join(' | ')} |`
}

function pctChange(from, to) {
  if (Math.abs(from) < 0.01) return 'N/A'
  const pct = (((to - from) / Math.abs(from)) * 100).toFixed(0)
  return pct > 0 ? `**+${pct}%**` : `**${pct}%**`
}

async function main() {
  const results = []

  results.push(await measureSpec('petStore (~13 schemas)', { type: 'path', path: PETSTORE_PATH }))
  results.push(await measureSpec('Stripe (1,385 schemas, 587 ops)', { type: 'path', path: STRIPE_PATH }))

  console.log('\n## Performance Measurement Results\n')
  console.log('> Median of 5 runs · `--expose-gc` · `validate: false`\n')
  console.log('### Full operation (includes document loading)\n')

  let header = mdRow('Spec', 'Schemas', 'Ops', 'Mode', 'Peak heap Δ (MB)', 'Duration (ms)', 'Heap Δ vs batch', 'Time vs batch')
  let divider = mdRow(':---', '---:', '---:', ':---', '---:', '---:', '---:', '---:')
  let rows = [header, divider]

  for (const r of results) {
    rows.push(mdRow(r.label, String(r.schemas), String(r.operations), '**batch**', r.batch.peakDeltaMB.toFixed(2), r.batch.durationMs.toFixed(0), '—', '—'))
    rows.push(
      mdRow(
        '',
        '',
        '',
        'streaming',
        r.streaming.peakDeltaMB.toFixed(2),
        r.streaming.durationMs.toFixed(0),
        pctChange(r.batch.peakDeltaMB, r.streaming.peakDeltaMB),
        pctChange(r.batch.durationMs, r.streaming.durationMs),
      ),
    )
  }
  console.log(rows.join('\n'))

  console.log('\n### AST phase only (document pre-warmed, isolates parse/stream heap)\n')
  header = mdRow('Spec', 'Mode', 'Peak heap Δ (MB)', 'Duration (ms)', 'Heap Δ vs batch', 'Time vs batch')
  divider = mdRow(':---', ':---', '---:', '---:', '---:', '---:')
  rows = [header, divider]

  for (const r of results) {
    rows.push(mdRow(r.label, '**batch**', r.batchAst.peakDeltaMB.toFixed(2), r.batchAst.durationMs.toFixed(0), '—', '—'))
    rows.push(
      mdRow(
        '',
        'streaming',
        r.streamAst.peakDeltaMB.toFixed(2),
        r.streamAst.durationMs.toFixed(0),
        pctChange(r.batchAst.peakDeltaMB, r.streamAst.peakDeltaMB),
        pctChange(r.batchAst.durationMs, r.streamAst.durationMs),
      ),
    )
  }
  console.log(rows.join('\n'))

  console.log(`\n_Measured ${new Date().toISOString().split('T')[0]} · Node.js ${process.version} · --expose-gc_\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
