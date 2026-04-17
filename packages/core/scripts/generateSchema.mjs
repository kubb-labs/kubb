#!/usr/bin/env node

/**
 * Generates a JSON Schema from the JSONConfig TypeScript type.
 *
 * Usage: node scripts/generateSchema.mjs
 * Output: schemas/config.schema.json
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tsj from 'ts-json-schema-generator'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

const config = {
  path: resolve(rootDir, 'src/types.ts'),
  tsconfig: resolve(rootDir, 'tsconfig.json'),
  type: 'JSONConfig',
  skipTypeCheck: true,
}

const schema = tsj.createGenerator(config).createSchema(config.type)

schema.$id = 'https://kubb.dev/schemas/config.schema.json'

const outputDir = resolve(rootDir, 'schemas')
mkdirSync(outputDir, { recursive: true })

const outputPath = resolve(outputDir, 'config.schema.json')
writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`)

console.log(`JSON Schema written to ${outputPath}`)
