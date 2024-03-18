import { schemas } from '../../swagger/mocks/schemas.ts'
import { parseZodMeta, zodParser } from './zodParser.ts'

import type { Schema } from '@kubb/swagger'

describe('parseZodMeta', () => {
  test.each(schemas)('parseZodMeta %o', ({ schema }) => {
    const text = parseZodMeta(schema)
    expect(text).toMatchSnapshot()
  })
})

describe('zodParser', () => {
  const input: Array<{ name: string; schema: Schema[] }> = [
    {
      name: 'blob',
      schema: [],
    },
  ]

  test.each(input)('zodParser %o', ({ schema, name }) => {
    const text = zodParser(schema, { name })
    expect(text).toMatchSnapshot()
  })
})
