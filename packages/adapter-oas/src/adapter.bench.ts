import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bench, describe } from 'vitest'
import type { AdapterSource } from '@kubb/core'
import { adapterOas } from './adapter.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// bunq OpenAPI 3.0 spec — 617 schemas, 421 operations.
// Exercises the streaming path introduced in PR #3290 (>100 schema threshold).
const bunqPath = path.resolve(__dirname, '../mocks/bunq.json')

describe('adapterOas — batch parse() [main-branch behaviour]', () => {
  bench(
    'bunq (617 schemas): parse()',
    async () => {
      const adapter = adapterOas({ validate: false })
      const source: AdapterSource = { type: 'path', path: bunqPath }
      await adapter.parse(source)
    },
    { iterations: 3, warmupIterations: 1 },
  )
})

describe('adapterOas — streaming count()+stream() [PR #3290 behaviour]', () => {
  bench(
    'bunq (617 schemas): count() + stream() full drain',
    async () => {
      const adapter = adapterOas({ validate: false })
      const source: AdapterSource = { type: 'path', path: bunqPath }
      await adapter.count!(source)
      const streamNode = await adapter.stream!(source)
      // Drain both iterables — mirrors what each plugin does per build pass
      for await (const _schema of streamNode.schemas) {
        /* consume */
      }
      for await (const _op of streamNode.operations) {
        /* consume */
      }
    },
    { iterations: 3, warmupIterations: 1 },
  )
})
