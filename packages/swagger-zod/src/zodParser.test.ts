import { schemas } from '../../plugin-oas/mocks/schemas.ts'
import { parseZodMeta, zodParser } from './zodParser.tsx'

describe('parseZodMeta', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parseZodMeta(undefined, schema, { name })
    expect(text).toMatchSnapshot()
  })
})

describe('zodParser', () => {
  test.each(schemas.full)('$name', ({ schema, name }) => {
    const text = zodParser(schema, { name })
    expect(text).toMatchSnapshot()
  })
})
