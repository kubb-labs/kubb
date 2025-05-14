import { schemas } from '@kubb/plugin-oas/mocks'

import * as parserType from './parser.ts'

describe('type parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserType.parse(
      { parent: undefined, current: schema, siblings: [schema] },
      { name, optionalType: 'questionToken', syntaxType: 'type', enumType: 'asConst' },
    )
    expect(text).toMatchSnapshot()
  })
})
