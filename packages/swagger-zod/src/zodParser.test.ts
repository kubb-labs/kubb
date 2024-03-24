import { schemas } from '../../swagger/mocks/schemas.ts'
import { parseZodMeta, zodParser } from './zodParser.tsx'

describe('parseZodMeta', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parseZodMeta(schema, { name })
    expect(text).toMatchSnapshot()
  })
})

describe('zodParser', () => {
  test.each(schemas.full)('$name', ({ schema, name }) => {
    const text = zodParser(schema, { name })
    expect(text).toMatchSnapshot()
  })
})
