import { schemas } from '@kubb/plugin-oas/mocks'

import * as parserFaker from './parser.ts'

describe('faker parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserFaker.parse({ name, schema: {}, parent: undefined, current: schema, siblings: [schema] }, { typeName: 'Pet' })
    expect(text).toMatchSnapshot()
  })
})
