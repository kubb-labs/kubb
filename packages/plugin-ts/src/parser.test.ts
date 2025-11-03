import { schemas } from '@kubb/plugin-oas/mocks'

import * as parserType from './parser.ts'

describe('type parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserType.parse(
      { name, schema: {}, parent: undefined, current: schema, siblings: [schema] },
      { optionalType: 'questionToken', enumType: 'asConst' },
    )
    expect(text).toMatchSnapshot()
  })
})
