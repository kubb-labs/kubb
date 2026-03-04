import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundle } from '@readme/openapi-parser'
import { mergeExternalFileComponents, parse } from './utils.ts'
import { describe, test, expect } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('debug full issue YAML', async () => {
  test('full issue schemas after pipeline', async () => {
    const specPath = path.resolve(__dirname, '../mocks/multiFileApiFullIssue.yaml')
    const oas = await parse(specPath)
    
    const { schemas, nameMapping } = oas.getSchemas()
    
    console.log('Schema keys:', Object.keys(schemas))
    
    for (const [key, val] of Object.entries(schemas)) {
      const v = val as any
      if (v.$ref) {
        console.log(`  ${key}: IS A $ref -> ${v.$ref}`)
      } else {
        console.log(`  ${key}: type=${v.type}`)
      }
    }
    
    // Check for self-referential schemas
    const selfRefs = Object.entries(schemas).filter(([key, val]) => {
      const v = val as any
      return v.$ref === `#/components/schemas/${key}`
    })
    console.log('Self-referential schemas:', selfRefs.map(([k]) => k))
    expect(selfRefs.length).toBe(0)
    
    // Parcel should be an object
    expect((schemas['Parcel'] as any)?.type).toBe('object')
  })
})
