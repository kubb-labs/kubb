import path from 'node:path'
import { bench, describe } from 'vitest'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { parseDocument } from './load/index.ts'
import { getSchemas } from './model/components.ts'
import { getOperations } from './operation.ts'
import { createSchemaParser } from './parser.ts'
import { createRefs } from './refs.ts'
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
  const refs = createRefs(document)
  const { schemas: schemaObjects } = getSchemas(document, {}, refs)
  const { parseSchema, parseOperation } = createSchemaParser({ document, refs })

  for (const [name, schema] of Object.entries(schemaObjects)) parseSchema({ schema, name }, DEFAULT_PARSER_OPTIONS)
  for (const operation of getOperations(document, refs)) parseOperation(DEFAULT_PARSER_OPTIONS, operation)
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
