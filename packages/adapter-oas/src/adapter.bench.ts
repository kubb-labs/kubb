import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeAll, bench, describe } from 'vitest'
import { adapterOas } from './adapter.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('adapterOas.parse() performance', () => {
  const stripePath = path.resolve(__dirname, '../schemas/stripe.json')
  let stripeData: unknown

  beforeAll(async () => {
    stripeData = JSON.parse(await fs.readFile(stripePath, 'utf-8'))
  })

  bench(
    'stripe spec — from file path',
    async () => {
      const adapter = adapterOas({ validate: false })
      await adapter.parse({ type: 'path', path: stripePath })
    },
    { time: 10000 },
  )

  bench(
    'stripe spec — from preloaded data',
    async () => {
      const adapter = adapterOas({ validate: false })
      await adapter.parse({ type: 'data', data: stripeData })
    },
    { time: 10000 },
  )
})
