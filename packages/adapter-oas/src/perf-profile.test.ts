/**
 * Per-function performance profiler for kubb packages (ast, core, adapter-oas).
 *
 * Breaks the full build pipeline into individual function timings to identify
 * bottlenecks. Run with:
 *
 *   NODE_OPTIONS='--expose-gc --max_old_space_size=4096' \
 *     pnpm vitest run --reporter=verbose --config configs/vitest.config.ts \
 *     packages/adapter-oas/src/perf-profile.test.ts
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundle, loadConfig } from '@redocly/openapi-core'
import { walk, collectUsedSchemaNames } from '@kubb/ast'
import type { AdapterSource } from '@kubb/core'
import OASNormalize from 'oas-normalize'
import BaseOas from 'oas'
import { afterAll, describe, it } from 'vitest'
import { validateDocument } from './factory.ts'
import { createSchemaParser, parseOas } from './parser.ts'
import { getSchemas } from './resolvers.ts'
import { applyDiscriminatorInheritance } from './discriminator.ts'
import { adapterOas } from './adapter.ts'
import type { Document } from './types.ts'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import * as ast from '@kubb/ast'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const bunqPath = path.resolve(__dirname, '../mocks/bunq.json')

// ── Timer ─────────────────────────────────────────────────────────────────────

type TimedResult<T> = { result: T; ms: number }
async function timed<T>(fn: () => Promise<T> | T): Promise<TimedResult<T>> {
  const start = performance.now()
  const result = await fn()
  return { result, ms: performance.now() - start }
}

function ms(n: number) { return `${n.toFixed(1)} ms` }
function pct(n: number, total: number) { return `${((n / total) * 100).toFixed(1)}%` }

// ── Results store ─────────────────────────────────────────────────────────────

type Section = { title: string; rows: Array<[string, string, string]> }
const sections: Section[] = []

function section(title: string) {
  const rows: Array<[string, string, string]> = []
  sections.push({ title, rows })
  return (fn: string, duration: number, note = '') => {
    rows.push([fn, ms(duration), note])
  }
}

// ── Phase 1: Document loading (adapter-oas/factory.ts + Redocly) ──────────────

describe('Phase 1 — Document loading (factory.ts / Redocly)', () => {
  it('times each loading step individually', async () => {
    const record = section('Phase 1: Document Loading (factory.ts)')
    let document: Document

    // Step 1a: Redocly loadConfig
    const { ms: loadConfigMs } = await timed(() => loadConfig())
    record('loadConfig()', loadConfigMs, 'Redocly config initialisation')

    // Step 1b: Redocly bundle (the $ref resolution pass)
    const { result: bundleResult, ms: bundleMs } = await timed(async () => {
      const config = await loadConfig()
      return bundle({ ref: bunqPath, config, base: bunqPath })
    })
    record('bundle() — Redocly $ref resolver', bundleMs, `${Object.keys((bundleResult.bundle.parsed as Record<string,unknown>)?.['components']?.['schemas'] ?? {}).length} schemas resolved`)

    // Step 1c: OASNormalize.load() on the bundled document
    const bundledDoc = bundleResult.bundle.parsed as Document
    const { ms: normalizeMs } = await timed(async () => {
      const n = new OASNormalize(bundledDoc, { enablePaths: true, colorizeErrors: true })
      return n.load()
    })
    record('OASNormalize.load()', normalizeMs, 'Normalisation pass after bundle')

    // Step 1d: validateDocument (disabled in prod benchmarks but shows cost)
    const { ms: validateMs } = await timed(async () => {
      const n = new OASNormalize(bundledDoc, { enablePaths: true, colorizeErrors: true })
      const loaded = await n.load() as Document
      return validateDocument(loaded, { throwOnError: false })
    })
    record('validateDocument()', validateMs, 'OAS schema validation (can be disabled)')

    // Step 1e: Full parseFromConfig (everything above combined via adapter)
    const adapter = adapterOas({ validate: false })
    const source: AdapterSource = { type: 'path', path: bunqPath }
    const { result: inputNode, ms: parseMs } = await timed(() => adapter.parse(source))
    document = adapter.document!
    record('adapter.parse() [full, no cache]', parseMs, `${inputNode.schemas.length} SchemaNode, ${inputNode.operations.length} OperationNode`)

    console.log(`\n  bundle()=${ms(bundleMs)}  normalise()=${ms(normalizeMs)}  validate()=${ms(validateMs)}  parse()=${ms(parseMs)}`)
  }, 120_000)
})

// ── Phase 2: Schema extraction (adapter-oas/resolvers.ts) ────────────────────

describe('Phase 2 — Schema extraction (resolvers.ts)', () => {
  it('times getSchemas() and sortSchemas()', async () => {
    const record = section('Phase 2: Schema Extraction (resolvers.ts)')
    const adapter = adapterOas({ validate: false })
    await adapter.parse({ type: 'path', path: bunqPath })
    const document = adapter.document!

    const { result: schemasResult, ms: getSchemasMs } = await timed(() => getSchemas(document, {}))
    const schemaCount = Object.keys(schemasResult.schemas).length
    record('getSchemas()', getSchemasMs, `extracts + sorts ${schemaCount} schemas from components`)

    // Measure BaseOas.getPaths() (operation extraction)
    const { result: paths, ms: getPathsMs } = await timed(() => {
      const oas = new BaseOas(document)
      return oas.getPaths()
    })
    const opCount = Object.values(paths).flatMap(Object.values).filter(Boolean).length
    record('new BaseOas(doc).getPaths()', getPathsMs, `${opCount} operations extracted`)

    console.log(`\n  getSchemas()=${ms(getSchemasMs)}  getPaths()=${ms(getPathsMs)}`)
  }, 60_000)
})

// ── Phase 3: AST parsing (adapter-oas/parser.ts) ─────────────────────────────

describe('Phase 3 — AST parsing (parser.ts)', () => {
  it('times parseOas(), per-schema & per-operation costs, discriminator', async () => {
    const record = section('Phase 3: AST Parsing (parser.ts)')
    const adapter = adapterOas({ validate: false })
    await adapter.parse({ type: 'path', path: bunqPath })
    const document = adapter.document!
    const { schemas: schemaObjects } = getSchemas(document, {})
    const schemaEntries = Object.entries(schemaObjects)

    // Full parseOas()
    const { result: parseOasResult, ms: parseOasMs } = await timed(() =>
      parseOas(document, { dateType: 'string', integerType: 'int', unknownType: 'unknown', emptySchemaType: 'unknown', enumSuffix: 'Enum' })
    )
    record('parseOas() — full', parseOasMs, `${parseOasResult.root.schemas.length} SchemaNode + ${parseOasResult.root.operations.length} OperationNode`)

    // Per-schema: time each schema individually to find hotspots
    const { parseSchema: _parseSchema, parseOperation: _parseOperation } = createSchemaParser({ document })
    const perSchemaTimings: Array<{ name: string; ms: number }> = []
    const schemaParserOptions = { ...DEFAULT_PARSER_OPTIONS }

    let schemasTotalMs = 0
    for (const [name, schema] of schemaEntries) {
      const { ms: schemaMs } = await timed(() => _parseSchema({ schema, name }, schemaParserOptions))
      perSchemaTimings.push({ name, ms: schemaMs })
      schemasTotalMs += schemaMs
    }
    const avgSchemaMs = schemasTotalMs / schemaEntries.length
    const maxSchema = perSchemaTimings.reduce((a, b) => (a.ms > b.ms ? a : b))
    const p95SchemaMs = [...perSchemaTimings].sort((a, b) => a.ms - b.ms)[Math.floor(perSchemaTimings.length * 0.95)]?.ms ?? 0

    record('parseSchema() — all schemas total', schemasTotalMs, `${schemaEntries.length} schemas`)
    record('parseSchema() — avg per schema', avgSchemaMs, `avg across ${schemaEntries.length} schemas`)
    record('parseSchema() — p95 per schema', p95SchemaMs, 'slowest 5% threshold')
    record(`parseSchema() — slowest: ${maxSchema.name}`, maxSchema.ms, 'single schema max')

    // Top 5 slowest schemas
    const top5 = [...perSchemaTimings].sort((a, b) => b.ms - a.ms).slice(0, 5)
    console.log(`\n  Top 5 slowest schemas:`)
    for (const s of top5) { console.log(`    ${s.name.padEnd(50)} ${ms(s.ms)}`) }

    // Per-operation timing
    const baseOas = new BaseOas(document)
    const paths = baseOas.getPaths()
    let opsTotalMs = 0
    let opCount = 0
    for (const methods of Object.values(paths)) {
      for (const operation of Object.values(methods)) {
        if (!operation) continue
        const { ms: opMs } = await timed(() => _parseOperation(schemaParserOptions, operation))
        opsTotalMs += opMs
        opCount++
      }
    }
    record('parseOperation() — all ops total', opsTotalMs, `${opCount} operations`)
    record('parseOperation() — avg per operation', opsTotalMs / opCount, 'avg per op')

    // applyDiscriminatorInheritance()
    const inputNode = parseOasResult.root
    const { ms: discriminatorMs } = await timed(() => applyDiscriminatorInheritance(inputNode))
    record('applyDiscriminatorInheritance()', discriminatorMs, '(only used when discriminator: "inherit")')

    console.log(`\n  parseOas()=${ms(parseOasMs)}  schemas=${ms(schemasTotalMs)}  ops=${ms(opsTotalMs)}  discriminator=${ms(discriminatorMs)}`)
  }, 120_000)
})

// ── Phase 4: AST walking (@kubb/ast/visitor.ts) ──────────────────────────────

describe('Phase 4 — AST walking (@kubb/ast)', () => {
  it('times walk() and collectUsedSchemaNames()', async () => {
    const record = section('Phase 4: AST Walking (@kubb/ast)')
    const adapter = adapterOas({ validate: false })
    const inputNode = await adapter.parse({ type: 'path', path: bunqPath })
    let schemaCallbacks = 0
    let opCallbacks = 0

    // Full walk() — no-op callbacks (pure dispatch overhead)
    const { ms: walkMs } = await timed(() =>
      walk(inputNode, {
        depth: 'shallow',
        schema() { schemaCallbacks++ },
        operation() { opCallbacks++ },
      })
    )
    record(`walk() — shallow, no-op callbacks`, walkMs, `${schemaCallbacks} schema + ${opCallbacks} op callbacks`)

    // walk() with realistic work (simulate plugin: resolve options + emit event)
    let workCallbacks = 0
    const { ms: walkWorkMs } = await timed(() =>
      walk(inputNode, {
        depth: 'shallow',
        schema(node) {
          // Simulate what a plugin does: name check + options resolution
          if (node.name) workCallbacks++
        },
        operation() { workCallbacks++ },
      })
    )
    record('walk() — with realistic plugin callback', walkWorkMs, 'name-check + counter per node')

    // collectUsedSchemaNames() — schema reachability from operations
    const { ms: collectMs } = await timed(() =>
      collectUsedSchemaNames(inputNode.operations, inputNode.schemas)
    )
    record('collectUsedSchemaNames()', collectMs, 'reachability graph for operation-based include filters')

    console.log(`\n  walk(no-op)=${ms(walkMs)}  walk(work)=${ms(walkWorkMs)}  collectUsedSchemaNames=${ms(collectMs)}`)
  }, 60_000)
})

// ── Phase 5: Streaming path (adapter-oas/adapter.ts) ─────────────────────────

describe('Phase 5 — Streaming path (adapter-oas/adapter.ts)', () => {
  it('times count(), stream() setup, and per-node yield cost', async () => {
    const record = section('Phase 5: Streaming Path (adapter-oas/adapter.ts)')
    const source: AdapterSource = { type: 'path', path: bunqPath }

    // count() — full (including document load)
    const adapter1 = adapterOas({ validate: false })
    const { result: counts, ms: countMs } = await timed(() => adapter1.count!(source))
    record('count() — cold (loads + caches document)', countMs, `${counts.schemas} schemas, ${counts.operations} ops`)

    // count() — warm (document already cached in adapter)
    const { ms: countWarmMs } = await timed(() => adapter1.count!(source))
    record('count() — warm (document in memory)', countWarmMs, 'second call, doc already cached')

    // stream() — setup only (no drain)
    const { ms: streamSetupMs } = await timed(() => adapter1.stream!(source))
    record('stream() — setup (returns InputStreamNode)', streamSetupMs, 'no schemas yielded yet')

    // stream() — full drain, time total and per-schema
    const adapter2 = adapterOas({ validate: false })
    await adapter2.count!(source) // warm up document
    const streamNode = await adapter2.stream!(source)

    const schemaTimings: number[] = []
    let schemaDrainMs = 0
    const drainSchemaStart = performance.now()
    for await (const _schema of streamNode.schemas) {
      const t0 = performance.now()
      // yield received — schema was parsed
      schemaTimings.push(performance.now() - t0)
    }
    schemaDrainMs = performance.now() - drainSchemaStart

    const avgYieldMs = schemaTimings.length > 0 ? schemaDrainMs / schemaTimings.length : 0

    const opDrainStart = performance.now()
    let opCount = 0
    for await (const _op of streamNode.operations) { opCount++ }
    const opDrainMs = performance.now() - opDrainStart

    record('stream() schemas drain — total', schemaDrainMs, `${counts.schemas} schemas yielded`)
    record('stream() schemas drain — avg per schema', avgYieldMs, 'avg yield interval')
    record('stream() operations drain — total', opDrainMs, `${opCount} operations yielded`)

    console.log(`\n  count(cold)=${ms(countMs)}  count(warm)=${ms(countWarmMs)}  streamSetup=${ms(streamSetupMs)}`)
    console.log(`  schemaDrain=${ms(schemaDrainMs)}  avgPerSchema=${ms(avgYieldMs)}  opDrain=${ms(opDrainMs)}`)
  }, 120_000)
})

// ── Phase 6: Disk cache (adapter-oas/adapter.ts) ─────────────────────────────

describe('Phase 6 — Disk cache round-trip (adapter-oas/adapter.ts)', () => {
  it('times cache write and cache-hit parse', async () => {
    const record = section('Phase 6: Disk Cache (adapter-oas/adapter.ts)')
    const store = new Map<string, string>()
    const cache = {
      dir: '/tmp/kubb-perf-cache',
      storage: {
        name: 'memory',
        async hasItem(k: string) { return store.has(k) },
        async getItem(k: string) { return store.get(k) ?? null },
        async setItem(k: string, v: string) { store.set(k, v) },
        async removeItem(k: string) { store.delete(k) },
        async getKeys() { return [...store.keys()] },
        async clear() { store.clear() },
      },
    }
    const source: AdapterSource = { type: 'path', path: bunqPath, cache }

    // Cold parse (writes cache)
    const adapter1 = adapterOas({ validate: false })
    const { ms: coldMs } = await timed(() => adapter1.parse(source))
    const cacheSize = [...store.values()].reduce((s, v) => s + v.length, 0)
    record('parse() — cold, writes cache', coldMs, `cache entry: ${(cacheSize / 1024).toFixed(0)} KB`)

    // Warm parse — reads from cache (skips Redocly bundle)
    const adapter2 = adapterOas({ validate: false })
    const { ms: warmMs } = await timed(() => adapter2.parse(source))
    record('parse() — cache hit (skips bundle)', warmMs, `speedup: ${(coldMs / warmMs).toFixed(1)}×`)

    // count() with cache hit
    const adapter3 = adapterOas({ validate: false })
    const { ms: countCachedMs } = await timed(() => adapter3.count!(source))
    record('count() — cache hit', countCachedMs, 'no bundle, just count')

    console.log(`\n  cold=${ms(coldMs)}  warm(cache-hit)=${ms(warmMs)}  speedup=${(coldMs/warmMs).toFixed(1)}×  count(cached)=${ms(countCachedMs)}`)
  }, 120_000)
})

// ── Summary table ─────────────────────────────────────────────────────────────

afterAll(() => {
  const totalMs = sections.flatMap(s => s.rows).reduce((acc, [, t]) => acc + parseFloat(t), 0)

  console.log('\n╔══════════════════════════════════════════════════════════════════════════════════╗')
  console.log('║              Per-Function Performance Profile — bunq (617 schemas)              ║')
  console.log('╚══════════════════════════════════════════════════════════════════════════════════╝')

  for (const { title, rows } of sections) {
    console.log(`\n── ${title} ──`)
    console.log(`${'Function'.padEnd(52)} ${'Time'.padStart(10)}  Note`)
    console.log(`${'─'.repeat(52)} ${'─'.repeat(10)}  ${'─'.repeat(30)}`)
    for (const [fn, time, note] of rows) {
      console.log(`${fn.padEnd(52)} ${time.padStart(10)}  ${note}`)
    }
  }
  console.log()
})
