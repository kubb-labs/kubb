/**
 * Multi-spec memory and timing benchmark.
 *
 * Runs batch parse() vs streaming count()+stream() across three representative
 * OpenAPI specs to show how memory and timing scale with spec size.
 *
 * Specs:
 *   readme.io  —   4 schemas,  31 ops,   25 KB  → batch path  (≤ 100 schemas)
 *   twitter    — 236 schemas,  80 ops,  374 KB  → streaming   (> 100 schemas)
 *   bunq       — 617 schemas, 421 ops, 1902 KB  → streaming   (> 100 schemas)
 *
 * Run:
 *   NODE_OPTIONS='--expose-gc --max_old_space_size=4096' \
 *     pnpm vitest run --reporter=verbose --config configs/vitest.config.ts \
 *     packages/adapter-oas/src/perf-multi-spec.test.ts
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AdapterSource } from '@kubb/core'
import { afterAll, describe, it } from 'vitest'
import { adapterOas } from './adapter.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SPECS = [
  { name: 'readme.io', file: 'readme.io.yaml', expectedSchemas: 4, expectedOps: 31, path: 'batch' },
  { name: 'twitter', file: 'twitter.json', expectedSchemas: 236, expectedOps: 80, path: 'streaming' },
  { name: 'bunq', file: 'bunq.json', expectedSchemas: 617, expectedOps: 421, path: 'streaming' },
] as const

const STREAM_THRESHOLD = 100

// ── Memory sampler ────────────────────────────────────────────────────────────

type RunResult = {
  spec: string
  schemas: number
  ops: number
  path: 'batch' | 'streaming'
  batchDeltaMB: number
  batchMs: number
  streamDeltaMB: number
  streamMs: number
  heapSavingPct: number
  timeDiffPct: number
}

function forceGC(): void {
  const _gc = (globalThis as Record<string, unknown>)['gc']
  if (typeof _gc === 'function') {
    ;(_gc as () => void)()
    ;(_gc as () => void)()
  }
}

type HeapResult = { deltaHeapMB: number; durationMs: number }

async function measure(fn: () => Promise<void>): Promise<HeapResult> {
  forceGC()
  await new Promise((r) => setTimeout(r, 150))
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

  return { deltaHeapMB: (peakBytes - baseline) / 1_048_576, durationMs }
}

// ── Results store ─────────────────────────────────────────────────────────────

const allResults: RunResult[] = []

// ── Per-spec tests ────────────────────────────────────────────────────────────

for (const spec of SPECS) {
  const specPath = path.resolve(__dirname, `../mocks/${spec.file}`)
  const activePath = spec.expectedSchemas > STREAM_THRESHOLD ? 'streaming' : 'batch'

  describe(`${spec.name} (${spec.expectedSchemas} schemas, ${spec.expectedOps} ops) [${activePath} on PR #3290]`, () => {
    it('batch parse() — main-branch behaviour', async () => {
      const source: AdapterSource = { type: 'path', path: specPath }
      const r = await measure(async () => {
        const adapter = adapterOas({ validate: false })
        await adapter.parse(source)
      })
      console.log(`  [${spec.name}] batch:  +${r.deltaHeapMB.toFixed(2)} MB  ${r.durationMs.toFixed(0)} ms`)

      const existing = allResults.find((x) => x.spec === spec.name)
      if (existing) {
        existing.batchDeltaMB = r.deltaHeapMB
        existing.batchMs = r.durationMs
      } else {
        allResults.push({
          spec: spec.name,
          schemas: spec.expectedSchemas,
          ops: spec.expectedOps,
          path: activePath,
          batchDeltaMB: r.deltaHeapMB,
          batchMs: r.durationMs,
          streamDeltaMB: 0,
          streamMs: 0,
          heapSavingPct: 0,
          timeDiffPct: 0,
        })
      }
    }, 120_000)

    it('streaming count()+stream() — PR #3290 behaviour (1 plugin pass)', async () => {
      const source: AdapterSource = { type: 'path', path: specPath }
      const r = await measure(async () => {
        const adapter = adapterOas({ validate: false })
        await adapter.count!(source)
        const streamNode = await adapter.stream!(source)
        for await (const _s of streamNode.schemas) {
          /* consume */
        }
        for await (const _o of streamNode.operations) {
          /* consume */
        }
      })
      console.log(`  [${spec.name}] stream: +${r.deltaHeapMB.toFixed(2)} MB  ${r.durationMs.toFixed(0)} ms`)

      const existing = allResults.find((x) => x.spec === spec.name)
      if (existing) {
        existing.streamDeltaMB = r.deltaHeapMB
        existing.streamMs = r.durationMs
        existing.heapSavingPct = existing.batchDeltaMB > 0 ? ((existing.batchDeltaMB - r.deltaHeapMB) / existing.batchDeltaMB) * 100 : 0
        existing.timeDiffPct = existing.batchMs > 0 ? ((r.durationMs - existing.batchMs) / existing.batchMs) * 100 : 0
      }
    }, 120_000)
  })
}

// ── Summary table ─────────────────────────────────────────────────────────────

afterAll(() => {
  if (allResults.length === 0) return

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════════════╗')
  console.log('║             Multi-Spec Memory & Timing Report — Main Branch vs PR #3290               ║')
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════════╝\n')

  // Memory table
  console.log('── Memory (AST heap delta above baseline) ──')
  console.log(
    `${'Spec'.padEnd(12)} ${'Schemas'.padStart(8)} ${'OAS path'.padEnd(12)} ${'Batch [main]'.padStart(14)} ${'Stream [PR]'.padStart(13)} ${'Saving'.padStart(12)}`,
  )
  console.log(`${'─'.repeat(12)} ${'─'.repeat(8)} ${'─'.repeat(12)} ${'─'.repeat(14)} ${'─'.repeat(13)} ${'─'.repeat(12)}`)
  for (const r of allResults) {
    const saving = r.heapSavingPct >= 0 ? `-${r.heapSavingPct.toFixed(0)}%` : `+${Math.abs(r.heapSavingPct).toFixed(0)}%`
    console.log(
      `${r.spec.padEnd(12)} ${String(r.schemas).padStart(8)} ${r.path.padEnd(12)} ${('+' + r.batchDeltaMB.toFixed(2) + ' MB').padStart(14)} ${('+' + r.streamDeltaMB.toFixed(2) + ' MB').padStart(13)} ${saving.padStart(12)}`,
    )
  }

  // Timing table
  console.log('\n── Timing (1 plugin pass) ──')
  console.log(
    `${'Spec'.padEnd(12)} ${'Schemas'.padStart(8)} ${'OAS path'.padEnd(12)} ${'Batch [main]'.padStart(14)} ${'Stream [PR]'.padStart(13)} ${'Overhead'.padStart(12)}`,
  )
  console.log(`${'─'.repeat(12)} ${'─'.repeat(8)} ${'─'.repeat(12)} ${'─'.repeat(14)} ${'─'.repeat(13)} ${'─'.repeat(12)}`)
  for (const r of allResults) {
    const diff = r.timeDiffPct >= 0 ? `+${r.timeDiffPct.toFixed(0)}%` : `-${Math.abs(r.timeDiffPct).toFixed(0)}%`
    console.log(
      `${r.spec.padEnd(12)} ${String(r.schemas).padStart(8)} ${r.path.padEnd(12)} ${(r.batchMs.toFixed(0) + ' ms').padStart(14)} ${(r.streamMs.toFixed(0) + ' ms').padStart(13)} ${diff.padStart(12)}`,
    )
  }
  console.log()
})
