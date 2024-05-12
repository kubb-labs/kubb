import { schemas } from '../../plugin-oas/mocks/schemas.ts'

import { parseFaker } from './fakerParser.ts'

describe('parseFaker', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parseFaker(undefined, schema, { name })
    expect(text).toMatchSnapshot()
  })
})
