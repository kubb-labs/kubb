import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bench, describe } from 'vitest'
import { parseDocument } from './factory.ts'
import { parseOas } from './parser.ts'
import type { Document } from './types.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Stripe spec (1 385 schemas) is now viable thanks to resolvedRefCache
// memoization in createSchemaParser. Add it when a network-free fixture
// is bundled in mocks/.
const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')

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
