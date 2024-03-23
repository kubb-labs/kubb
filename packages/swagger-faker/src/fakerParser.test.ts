import { schemas } from '../../swagger/mocks/schemas.ts'
import { fakerParser, parseFakerMeta } from './fakerParser.ts'

describe('parseFakerMeta', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parseFakerMeta(schema, { name })
    expect(text).toMatchSnapshot()
  })
})

describe('fakerParser', () => {
  test.each(schemas.full)('$name', ({ schema, name }) => {
    const text = fakerParser(schema, { name })
    expect(text).toMatchSnapshot()
  })
})
