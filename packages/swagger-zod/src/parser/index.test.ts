import { schemas } from '../../../plugin-oas/mocks/schemas.ts'

import * as parserZod from './index.ts'

describe('zod parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserZod.parse(undefined, schema, { name })
    expect(text).toMatchSnapshot()
  })
})
