import path from 'node:path'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { bench, describe } from 'vitest'
import { adapterOas } from './adapter.ts'
import { parseDocument } from './factory.ts'
import { parseOas } from './parser.ts'
import type { Document } from './types.ts'
import type { AdapterSource } from '@kubb/core'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const petStorePath = path.resolve(__dirname, '../mocks/petStore.yaml')
const stripeSpecPath = '/tmp/kubb-stripe-spec3.json'
const hasStripe = existsSync(stripeSpecPath)

let petStoreDoc: Document | undefined

async function getPetStoreDocument(): Promise<Document> {
  if (!petStoreDoc) {
    petStoreDoc = await parseDocument(petStorePath)
  }
  return petStoreDoc
}

describe('parseOas() performance', () => {
  bench(
    'petStore spec',
    async () => {
      const doc = await getPetStoreDocument()
      parseOas(doc)
    },
    { iterations: 5, warmupIterations: 1 },
  )
})

describe.skipIf(!hasStripe)('Stripe spec — batch vs streaming (1,385 schemas)', () => {
  const stripeSource: AdapterSource = { type: 'path', path: stripeSpecPath }

  bench(
    'batch — adapter.parse()',
    async () => {
      const adapter = adapterOas({ validate: false })
      await adapter.parse(stripeSource)
    },
    { iterations: 3, warmupIterations: 1 },
  )

  bench(
    'streaming — adapter.count() + stream() drain',
    async () => {
      const adapter = adapterOas({ validate: false })
      await adapter.count!(stripeSource)
      const stream = await adapter.stream!(stripeSource)
      for await (const _ of stream.schemas) {
        /* drain */
      }
      for await (const _ of stream.operations) {
        /* drain */
      }
    },
    { iterations: 3, warmupIterations: 1 },
  )
})
