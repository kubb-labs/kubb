import path from 'node:path'
import { fileURLToPath } from 'node:url'
import BaseOas from 'oas'
import { bench, describe } from 'vitest'
import { parseDocument } from './factory.ts'
import { parseOas } from './parser.ts'
import type { Document } from './types.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// TODO: replace with stripe.json once the parser handles its circular-reference
// expansion without exhausting heap (the full Stripe spec triggers exponential
// sub-tree duplication because resolvingRefs only prevents recursion within a
// single resolution chain, not repeated resolution of the same schema).
const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')

let document: Document | undefined

async function getDocument(): Promise<Document> {
  if (!document) {
    document = await parseDocument(petStorePath)
  }
  return document
}

describe('parseOas() — end-to-end', () => {
  bench(
    'petStore spec',
    async () => {
      const doc = await getDocument()
      parseOas(doc)
    },
    { iterations: 5, warmupIterations: 1 },
  )
})

describe('Operations enumeration — flatMap+filter (old) vs generator (new)', () => {
  bench(
    'flatMap+filter / old',
    async () => {
      const doc = await getDocument()
      const paths = new BaseOas(doc).getPaths()
      void Object.entries(paths).flatMap(([, methods]) =>
        Object.entries(methods)
          .map(([, op]) => op ?? null)
          .filter((op): op is NonNullable<typeof op> => op !== null),
      )
    },
    { iterations: 200, warmupIterations: 10 },
  )

  bench(
    'generator / new',
    async () => {
      const doc = await getDocument()
      const paths = new BaseOas(doc).getPaths()
      function* gen() {
        for (const [, methods] of Object.entries(paths)) {
          for (const [, op] of Object.entries(methods)) {
            if (op) yield op
          }
        }
      }
      void Array.from(gen())
    },
    { iterations: 200, warmupIterations: 10 },
  )
})

describe('Content-type resolution — flatMap+[] (old) vs generator vs for-push (revised)', () => {
  // Simulates the per-operation content-type loop for every operation in petStore
  const contentTypes = ['application/json', 'application/xml', 'text/plain', 'application/octet-stream']

  bench(
    'flatMap+[] / old',
    () => {
      // 20 iterations simulates 20 operations each checking 4 content types
      for (let i = 0; i < 20; i++) {
        void contentTypes.flatMap((ct) => {
          // ~50% hit rate (every other content type has a schema)
          if (ct === 'application/json' || ct === 'text/plain') {
            return [{ contentType: ct, schema: { type: 'object' } }]
          }
          return []
        })
      }
    },
    { iterations: 5_000, warmupIterations: 200 },
  )

  bench(
    'generator / discarded',
    () => {
      for (let i = 0; i < 20; i++) {
        function* gen() {
          for (const ct of contentTypes) {
            if (ct === 'application/json' || ct === 'text/plain') {
              yield { contentType: ct, schema: { type: 'object' } }
            }
          }
        }
        void Array.from(gen())
      }
    },
    { iterations: 5_000, warmupIterations: 200 },
  )

  bench(
    'for-push / revised',
    () => {
      for (let i = 0; i < 20; i++) {
        const content: Array<{ contentType: string; schema: { type: string } }> = []
        for (const ct of contentTypes) {
          if (ct === 'application/json' || ct === 'text/plain') {
            content.push({ contentType: ct, schema: { type: 'object' } })
          }
        }
        void content
      }
    },
    { iterations: 5_000, warmupIterations: 200 },
  )
})
