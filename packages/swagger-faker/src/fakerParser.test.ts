import { schemas } from '../../swagger/mocks/schemas.ts'
import { fakerParser, parseFakerMeta } from './fakerParser.ts'

import type { Schema } from '@kubb/swagger'

describe('parseFakerMeta', () => {
  test.each(schemas)('parseFaker %o', ({ schema }) => {
    const text = parseFakerMeta(schema)
    expect(text).toMatchSnapshot()
  })
})

describe('fakerParser', () => {
  const input: Array<{ name: string; schema: Schema[] }> = [
    {
      name: 'blob',
      schema: [],
    },
  ]

  test.each(input)('fakerParser %o', ({ schema, name }) => {
    const text = fakerParser(schema, { name })
    expect(text).toMatchSnapshot()
  })
})
