import { print } from '@kubb/parser'
import { schemaKeywords } from '@kubb/swagger'

import { schemas } from '../../swagger/mocks/schemas.ts'
import { parseTypeMeta, typeParser } from './typeParser.ts'

import type { Schema } from '@kubb/swagger'

describe('parseTypeMeta', () => {
  test.each(schemas)('parseTypeMeta %o', ({ schema }) => {
    const text = print([parseTypeMeta(schema)])

    expect(text).toMatchSnapshot()
  })
})

describe('typeParser', () => {
  const input: Array<{ name: string; schema: Schema[] }> = [
    {
      name: 'blob',
      schema: [
        {
          keyword: schemaKeywords.blob,
        },
      ],
    },
  ]

  test.each(input)('typeParser %o', ({ schema, name }) => {
    const text = typeParser(schema, { name })
    expect(text).toMatchSnapshot()
  })
})
