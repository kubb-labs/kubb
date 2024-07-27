import { schemas } from '../../../plugin-oas/mocks/schemas.ts'

import * as parserFaker from './index.ts'

describe('faker parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserFaker.parse(undefined, schema, { name })
    expect(text).toMatchSnapshot()
  })
})
