import path from 'node:path'
import { bench, describe } from 'vitest'
import { parseDocument } from './factory.ts'
import { parseOas } from './parser.ts'
import type { Document } from './types.ts'

const petStorePath = path.resolve(import.meta.dirname, '../mocks/petStore.yaml')

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
