import path from 'node:path'
import { bench, describe } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { parseDocument } from './factory.ts'
import { getOperations } from './operation.ts'
import { createSchemaParser } from './parser.ts'
import { getSchemas } from './resolvers.ts'
import type { Document } from './types.ts'

const petStorePath = path.resolve(import.meta.dirname, '../mocks/petStore.yaml')

let petStoreDoc: Document | undefined

async function getPetStoreDocument(): Promise<Document> {
  if (!petStoreDoc) {
    petStoreDoc = await parseDocument(petStorePath)
  }
  return petStoreDoc
}

function parseOas(document: Document): void {
  const { schemas: schemaObjects } = getSchemas(document, {})
  const { parseSchema, parseOperation } = createSchemaParser({ document })

  for (const [name, schema] of Object.entries(schemaObjects)) parseSchema({ schema, name }, DEFAULT_PARSER_OPTIONS)
  for (const operation of getOperations(document)) parseOperation(DEFAULT_PARSER_OPTIONS, operation)
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
