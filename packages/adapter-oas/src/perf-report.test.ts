/**
 * Performance comparison: batch parse() [main branch] vs count()+stream() [PR #3290].
 *
 * Run with:
 *   NODE_OPTIONS='--expose-gc --max_old_space_size=4096' \
 *     pnpm vitest run --reporter=verbose --config configs/vitest.config.ts \
 *     packages/adapter-oas/src/perf-report.test.ts
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AdapterSource } from '@kubb/core'
import { afterAll, describe, it } from 'vitest'
import { adapterOas } from './adapter.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const bunqPath = path.resolve(__dirname, '../mocks/bunq.json')

// ── Heap sampler ──────────────────────────────────────────────────────────────

type HeapResult = {
  baselineHeapMB: number
  peakHeapMB: number
  deltaHeapMB: number
  durationMs: number
}

function forceGC(): void {
  const _gc = (globalThis as Record<string, unknown>)['gc']
  if (typeof _gc === 'function') {
    ;(_gc as () => void)()
    ;(_gc as () => void)()
  }
}

async function measure(fn: () => Promise<void>): Promise<HeapResult> {
  forceGC()
  await new Promise((r) => setTimeout(r, 100))
  forceGC()

  const baseline = process.memoryUsage().heapUsed
  let peakBytes = baseline
  const sampler = setInterval(() => {
    const h = process.memoryUsage().heapUsed
    if (h > peakBytes) peakBytes = h
  }, 10)

  const start = performance.now()
  await fn()
  const durationMs = performance.now() - start

  clearInterval(sampler)
  forceGC()

  return {
    baselineHeapMB: baseline / 1_048_576,
    peakHeapMB: peakBytes / 1_048_576,
    deltaHeapMB: (peakBytes - baseline) / 1_048_576,
    durationMs,
  }
}

// ── Results collector ─────────────────────────────────────────────────────────

const results: Array<{ label: string; r: HeapResult }> = []

// ── Batch parse (main-branch behaviour) ───────────────────────────────────────

describe('batch parse() — main-branch behaviour', () => {
  it('bunq (617 schemas, 421 ops): parse()', async () => {
    const source: AdapterSource = { type: 'path', path: bunqPath }
    const r = await measure(async () => {
      const adapter = adapterOas({ validate: false })
      await adapter.parse(source)
    })
    results.push({ label: 'batch parse()', r })
    console.log(`  parse():  +${r.deltaHeapMB.toFixed(2)} MB delta  |  ${r.durationMs.toFixed(0)} ms`)
  }, 60_000)
})

// ── Streaming (PR #3290 behaviour) ────────────────────────────────────────────

describe('streaming count()+stream() — PR #3290 behaviour', () => {
  it('bunq (617 schemas, 421 ops): count() + stream() full drain (1 plugin pass)', async () => {
    const source: AdapterSource = { type: 'path', path: bunqPath }
    const r = await measure(async () => {
      const adapter = adapterOas({ validate: false })
      await adapter.count!(source)
      const streamNode = await adapter.stream!(source)
      for await (const _schema of streamNode.schemas) {
        /* consume — same as what a plugin does */
      }
      for await (const _op of streamNode.operations) {
        /* consume */
      }
    })
    results.push({ label: 'count()+stream()', r })
    console.log(`  stream(): +${r.deltaHeapMB.toFixed(2)} MB delta  |  ${r.durationMs.toFixed(0)} ms`)
  }, 60_000)
})

// ── Summary table ─────────────────────────────────────────────────────────────

afterAll(() => {
  if (results.length < 2) return

  const [batch, stream] = results as [{ label: string; r: HeapResult }, { label: string; r: HeapResult }]
  const heapSavingMB = batch.r.deltaHeapMB - stream.r.deltaHeapMB
  const heapSavingPct = batch.r.deltaHeapMB > 0 ? (heapSavingMB / batch.r.deltaHeapMB) * 100 : 0
  const timeDiffMs = stream.r.durationMs - batch.r.durationMs
  const timeDiffPct = batch.r.durationMs > 0 ? (timeDiffMs / batch.r.durationMs) * 100 : 0

  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║       Adapter Performance Report — bunq (617 schemas)        ║')
  console.log('╚══════════════════════════════════════════════════════════════╝\n')
  console.log(`| Metric                 | Batch parse() [main]      | Streaming [PR #3290]      |`)
  console.log(`|------------------------|---------------------------|---------------------------|`)
  console.log(`| Baseline heap          | ${String(batch.r.baselineHeapMB.toFixed(1) + ' MB').padEnd(25)} | ${String(stream.r.baselineHeapMB.toFixed(1) + ' MB').padEnd(25)} |`)
  console.log(`| Peak heap              | ${String(batch.r.peakHeapMB.toFixed(1) + ' MB').padEnd(25)} | ${String(stream.r.peakHeapMB.toFixed(1) + ' MB').padEnd(25)} |`)
  console.log(`| AST node heap delta    | ${String('+' + batch.r.deltaHeapMB.toFixed(2) + ' MB').padEnd(25)} | ${String('+' + stream.r.deltaHeapMB.toFixed(2) + ' MB').padEnd(25)} |`)
  console.log(`| Duration (1 pass)      | ${String(batch.r.durationMs.toFixed(0) + ' ms').padEnd(25)} | ${String(stream.r.durationMs.toFixed(0) + ' ms').padEnd(25)} |`)
  console.log(`|------------------------|---------------------------|---------------------------|`)
  console.log(`| Heap saving            |                           | ${String('-' + heapSavingMB.toFixed(2) + ' MB (' + heapSavingPct.toFixed(0) + '% less)').padEnd(25)} |`)
  console.log(`| Time overhead (1 pass) |                           | ${String((timeDiffMs > 0 ? '+' : '') + timeDiffMs.toFixed(0) + ' ms (' + (timeDiffPct > 0 ? '+' : '') + timeDiffPct.toFixed(0) + '%)').padEnd(25)} |`)
  console.log()
  console.log('Note: "1 plugin pass" = a single plugin iterating all schemas + ops.')
  console.log('Streaming re-parses on each plugin pass; batch holds nodes for all passes combined.')
  console.log('With N plugins, batch peak stays constant; streaming overhead scales linearly.\n')
})
