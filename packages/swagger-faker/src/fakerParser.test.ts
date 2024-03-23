import { schemas } from '@kubb/swagger/mocks/schemas.js'

import { fakerParser, parseFakerMeta } from './fakerParser.tsx'

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
