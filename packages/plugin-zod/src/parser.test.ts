import { schemas } from '@kubb/plugin-oas/mocks'
import * as parserZod from './parser.ts'

describe('zod parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserZod.parse({ name, schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '3' })
    expect(text).toMatchSnapshot()
  })

  test.each(schemas.basic)('$name v4', ({ name, schema }) => {
    const text = parserZod.parse({ name, schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4' })
    expect(text).toMatchSnapshot()
  })
})
