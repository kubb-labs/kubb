import { schemas } from '../../../plugin-oas/mocks/schemas.ts'

import * as parserFaker from './index.ts'

describe('faker parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserFaker.parse({ parent: undefined, current: schema, siblings: [schema] }, { name })
    expect(text).toMatchSnapshot()
  })
})
