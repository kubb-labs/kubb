import { schemas } from '@kubb/plugin-oas/mocks'
import * as parserZod from './parser.ts'

describe('zod parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserZod.parse({ parent: undefined, current: schema, siblings: [schema] }, { version: '3', name, rawSchema: {} })
    expect(text).toMatchSnapshot()
  })

  test.each(schemas.basic)('$name v4', ({ name, schema }) => {
    const text = parserZod.parse({ parent: undefined, current: schema, siblings: [schema] }, { version: '4', name, rawSchema: {} })
    expect(text).toMatchSnapshot()
  })
})
