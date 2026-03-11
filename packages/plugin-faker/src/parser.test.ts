import { createSchema } from '@internals/ast'
import { schemas } from '@kubb/plugin-oas/mocks'
import { describe, expect, test } from 'vitest'
import * as parserFaker from './parser.ts'

const unknownNode = createSchema({ type: 'unknown' })

describe('faker parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserFaker.parse(
      {
        name,
        schema: {},
        parent: undefined,
        current: schema,
        siblings: [schema],
        schemaNode: unknownNode,
      },
      { typeName: 'Pet' },
    )
    expect(text).toMatchSnapshot()
  })
})
