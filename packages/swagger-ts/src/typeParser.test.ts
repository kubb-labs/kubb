import { print } from '@kubb/parser-ts'

import { schemas } from '../../plugin-oas/mocks/schemas.ts'
import { parseTypeMeta, typeParser } from './typeParser.ts'

describe('parseTypeMeta', () => {
  test.each(schemas.basic)('$name', ({ schema, name }) => {
    const parsed = parseTypeMeta(undefined, schema, {
      name,
      optionalType: 'questionToken',
      enumType: 'asConst',
    })
    const text = parsed ? print(parsed) : undefined

    expect(text).toMatchSnapshot()
  })
})

describe('typeParser', () => {
  test.each(schemas.full)('$name', ({ schema, name }) => {
    const text = typeParser(schema, {
      name,
      optionalType: 'questionToken',
      enumType: 'asConst',
    })
    expect(text).toMatchSnapshot()
  })
})
