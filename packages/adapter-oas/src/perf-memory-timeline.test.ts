/**
 * Memory timeline profiler — tracks heap at each stage of the pipeline
 * for three specs of increasing size.
 *
 * Shows how memory grows during: document load → count → batch parse →
 * streaming schema-by-schema — and when it is released.
 *
 * Run:
 *   NODE_OPTIONS='--expose-gc --max_old_space_size=4096' \
 *     pnpm vitest run --reporter=verbose --config configs/vitest.config.ts \
 *     packages/adapter-oas/src/perf-memory-timeline.test.ts
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AdapterSource } from '@kubb/core'
import { afterAll, beforeAll, describe, it } from 'vitest'
import { adapterOas } from './adapter.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SPECS = [
  { name: 'readme.io',  file: 'readme.io.yaml', label: '4 schemas,  31 ops,  25 KB' },
  { name: 'twitter',    file: 'twitter.json',    label: '236 schemas, 80 ops, 374 KB' },
  { name: 'bunq',       file: 'bunq.json',       label: '617 schemas, 421 ops, 1902 KB' },
] as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function forceGC(): void {
  const _gc = (globalThis as Record<string, unknown>)['gc']
  if (typeof _gc === 'function') { (_gc as () => void)(); (_gc as () => void)() }
}

function heapMB(): number { return process.memoryUsage().heapUsed / 1_048_576 }

async function settle(): Promise<void> {
  forceGC()
  await new Promise((r) => setTimeout(r, 200))
  forceGC()
  await new Promise((r) => setTimeout(r, 50))
}

// ── Timeline entry ────────────────────────────────────────────────────────────

type Checkpoint = { label: string; heapMB: number; deltaMB: number; ms: number }

function makeTimeline(origin: number, baseline: number) {
  const points: Checkpoint[] = []
  function snap(label: string) {
    points.push({ label, heapMB: heapMB(), deltaMB: heapMB() - baseline, ms: performance.now() - origin })
  }
  return { snap, points }
}

// ── All results ───────────────────────────────────────────────────────────────

type SpecTimeline = { name: string; label: string; batch: Checkpoint[]; stream: Checkpoint[] }
const allTimelines: SpecTimeline[] = []

// ── Warmup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Warmup: parse readme.io to stabilise JIT and module caches
  const warmupAdapter = adapterOas({ validate: false })
  await warmupAdapter.parse({ type: 'path', path: path.resolve(__dirname, '../mocks/readme.io.yaml') })
  await settle()
}, 30_000)

// ── Per-spec timeline ─────────────────────────────────────────────────────────

for (const spec of SPECS) {
  const specPath = path.resolve(__dirname, `../mocks/${spec.file}`)

  describe(`${spec.name} — ${spec.label}`, () => {
    it('batch parse() timeline — main-branch behaviour', async () => {
      await settle()
      const baseline = heapMB()
      const { snap, points } = makeTimeline(performance.now(), baseline)

      snap('① baseline (after GC)')

      const adapter = adapterOas({ validate: false })
      const source: AdapterSource = { type: 'path', path: specPath }

      // Stage: document load (bundle + normalise)
      let inputNodeRef = await adapter.parse(source)
      snap('② after parse() — all schemas + ops in heap')

      forceGC()
      snap('③ after GC — nodes still reachable')

      // Simulate plugin walk (just iterate already-parsed nodes)
      let schemaCount = 0
      const total = inputNodeRef.schemas.length
      for (const _ of inputNodeRef.schemas) {
        schemaCount++
        if (schemaCount === Math.ceil(total * 0.25)) snap('④ 25% schemas walked')
        if (schemaCount === Math.ceil(total * 0.50)) snap('⑤ 50% schemas walked')
        if (schemaCount === Math.ceil(total * 0.75)) snap('⑥ 75% schemas walked')
      }
      snap('⑦ 100% schemas walked — nodes still held')

      for (const _ of inputNodeRef.operations) { /* walk ops */ }
      snap('⑧ ops walked — all nodes still held (until dispose)')

      // Release the only reference so GC can collect
      inputNodeRef = null as never
      forceGC()
      snap('⑨ after release + GC — nodes freed')

      const batchPoints = points
      const existing = allTimelines.find((t) => t.name === spec.name)
      if (existing) existing.batch = batchPoints
      else allTimelines.push({ name: spec.name, label: spec.label, batch: batchPoints, stream: [] })

      // Print inline
      console.log(`\n  [${spec.name}] BATCH`)
      for (const p of batchPoints) {
        const bar = '█'.repeat(Math.max(0, Math.round(p.deltaMB)))
        console.log(`    ${p.label.padEnd(42)} ${('+' + p.deltaMB.toFixed(2) + ' MB').padStart(12)}  ${bar}`)
      }
    }, 120_000)

    it('streaming count()+stream() timeline — PR #3290 behaviour', async () => {
      await settle()
      const baseline = heapMB()
      const { snap, points } = makeTimeline(performance.now(), baseline)

      snap('① baseline (after GC)')

      const adapter = adapterOas({ validate: false })
      const source: AdapterSource = { type: 'path', path: specPath }

      // count() loads and caches document
      const counts = await adapter.count!(source)
      snap('② after count() — document in heap, no AST nodes')

      // stream() just returns the iterable wrapper
      const streamNode = await adapter.stream!(source)
      snap('③ after stream() setup — still no schemas parsed')

      let schemaCount = 0
      const total = counts.schemas
      for await (const _schema of streamNode.schemas) {
        schemaCount++
        if (schemaCount === 1) snap('④ after 1st schema yielded')
        if (schemaCount === Math.ceil(total * 0.25)) snap(`⑤ after 25% schemas (${schemaCount}/${total})`)
        if (schemaCount === Math.ceil(total * 0.50)) snap(`⑥ after 50% schemas (${schemaCount}/${total})`)
        if (schemaCount === Math.ceil(total * 0.75)) snap(`⑦ after 75% schemas (${schemaCount}/${total})`)
      }
      snap(`⑧ after 100% schemas (${total} yielded)`)

      for await (const _op of streamNode.operations) { /* walk */ }
      snap('⑨ after ops drained')

      forceGC()
      snap('⑩ after GC — only document remains')

      const streamPoints = points
      const existing = allTimelines.find((t) => t.name === spec.name)
      if (existing) existing.stream = streamPoints
      else allTimelines.push({ name: spec.name, label: spec.label, batch: [], stream: streamPoints })

      console.log(`\n  [${spec.name}] STREAM`)
      for (const p of streamPoints) {
        const bar = '█'.repeat(Math.max(0, Math.round(p.deltaMB)))
        console.log(`    ${p.label.padEnd(42)} ${('+' + p.deltaMB.toFixed(2) + ' MB').padStart(12)}  ${bar}`)
      }
    }, 120_000)
  })
}

// ── Markdown summary ──────────────────────────────────────────────────────────

afterAll(() => {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════════════════╗')
  console.log('║      Heap Delta Timeline — Batch (main) vs Streaming (PR #3290)     ║')
  console.log('╚══════════════════════════════════════════════════════════════════════╝')

  for (const tl of allTimelines) {
    console.log(`\n## ${tl.name} — ${tl.label}\n`)

    // Batch
    if (tl.batch.length > 0) {
      const peakBatch = Math.max(...tl.batch.map((p) => p.deltaMB))
      console.log(`### Batch parse() [main branch]  peak: +${peakBatch.toFixed(2)} MB`)
      console.log(`| Stage | Heap Δ | Bar |`)
      console.log(`|---|---|---|`)
      for (const p of tl.batch) {
        const bar = '█'.repeat(Math.max(0, Math.round(p.deltaMB * 2)))
        console.log(`| ${p.label} | +${p.deltaMB.toFixed(2)} MB | ${bar || '·'} |`)
      }
    }

    // Stream
    if (tl.stream.length > 0) {
      const peakStream = Math.max(...tl.stream.map((p) => p.deltaMB))
      console.log(`\n### Streaming count()+stream() [PR #3290]  peak: +${peakStream.toFixed(2)} MB`)
      console.log(`| Stage | Heap Δ | Bar |`)
      console.log(`|---|---|---|`)
      for (const p of tl.stream) {
        const bar = '█'.repeat(Math.max(0, Math.round(p.deltaMB * 2)))
        console.log(`| ${p.label} | +${p.deltaMB.toFixed(2)} MB | ${bar || '·'} |`)
      }
    }
  }
})
