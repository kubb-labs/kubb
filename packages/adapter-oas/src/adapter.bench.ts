import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
const petStorePath = path.resolve(__dirname, '../../core/mocks/petStore.yaml')

let document: Document | undefined

async function getDocument(): Promise<Document> {
  if (!document) {
    document = await parseDocument(petStorePath)
  }
  return document
}

describe('parseOas() performance', () => {
  bench(
    'petStore spec',
    async () => {
      const doc = await getDocument()
      parseOas(doc)
    },
    { iterations: 5, warmupIterations: 1 },
  )
})
