/**
 * Multi-plugin pass comparison: batch (main) vs streaming (PR #3290).
 * Simulates a 5-plugin build where each plugin iterates all schemas and ops.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AdapterSource } from '@kubb/core'
import { afterAll, describe, it } from 'vitest'
import { adapterOas } from './adapter.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const bunqPath = path.resolve(__dirname, '../mocks/bunq.json')

type HeapResult = { deltaHeapMB: number; durationMs: number }

function forceGC(): void {
  const _gc = (globalThis as Record<string, unknown>)['gc']
  if (typeof _gc === 'function') {
    ;(_gc as () => void)()
    ;(_gc as () => void)()
  }
}

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

  return {
    deltaHeapMB: (peakBytes - baseline) / 1_048_576,
    durationMs,
  }
}

const PLUGIN_COUNT = 5
const multiResults: Array<{ label: string; r: HeapResult }> = []

describe('multi-plugin simulation (5 plugins)', () => {
  it('batch parse() — 1 parse + 5 walks', async () => {
    const source: AdapterSource = { type: 'path', path: bunqPath }
    const r = await measure(async () => {
      const adapter = adapterOas({ validate: false })
      // parse once (main branch behaviour — always batch)
      const inputNode = await adapter.parse(source)
      // walk N times (once per plugin)
      for (let i = 0; i < PLUGIN_COUNT; i++) {
        for (const _schema of inputNode.schemas) { /* plugin processes */ }
        for (const _op of inputNode.operations) { /* plugin processes */ }
      }
    })
    multiResults.push({ label: 'batch (1 parse + 5 walks)', r })
    console.log(`  batch 5-plugin: +${r.deltaHeapMB.toFixed(2)} MB  |  ${r.durationMs.toFixed(0)} ms`)
  }, 120_000)

  it('streaming count()+stream() — 5 stream drain passes', async () => {
    const source: AdapterSource = { type: 'path', path: bunqPath }
    const r = await measure(async () => {
      const adapter = adapterOas({ validate: false })
      // count() loads and caches the document once
      await adapter.count!(source)
      // each plugin drains stream independently (re-parses AST nodes)
      for (let i = 0; i < PLUGIN_COUNT; i++) {
        const streamNode = await adapter.stream!(source)
        for await (const _schema of streamNode.schemas) { /* plugin processes */ }
        for await (const _op of streamNode.operations) { /* plugin processes */ }
      }
    })
    multiResults.push({ label: 'streaming (count + 5 stream drains)', r })
    console.log(`  stream 5-plugin: +${r.deltaHeapMB.toFixed(2)} MB  |  ${r.durationMs.toFixed(0)} ms`)
  }, 120_000)
})

afterAll(() => {
  if (multiResults.length < 2) return
  const [batch, stream] = multiResults as [{ label: string; r: HeapResult }, { label: string; r: HeapResult }]
  const heapSavingPct = batch.r.deltaHeapMB > 0 ? ((batch.r.deltaHeapMB - stream.r.deltaHeapMB) / batch.r.deltaHeapMB) * 100 : 0
  const timeDiffPct = batch.r.durationMs > 0 ? ((stream.r.durationMs - batch.r.durationMs) / batch.r.durationMs) * 100 : 0

  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║      5-Plugin Build Simulation — bunq (617 schemas)      ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  console.log(`| Metric              | Batch [main]    | Streaming [PR #3290] |`)
  console.log(`|---------------------|-----------------|----------------------|`)
  console.log(`| Peak heap delta     | +${batch.r.deltaHeapMB.toFixed(2)} MB      | +${stream.r.deltaHeapMB.toFixed(2)} MB (${heapSavingPct.toFixed(0)}% less)  |`)
  console.log(`| Total duration      | ${batch.r.durationMs.toFixed(0)} ms      | ${stream.r.durationMs.toFixed(0)} ms (${timeDiffPct > 0 ? '+' : ''}${timeDiffPct.toFixed(0)}%)  |`)
  console.log()
})
