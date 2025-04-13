import { schemas } from '../../plugin-oas/mocks/schemas.ts'

import * as parserZod from './parser.ts'
import { PackageManager } from '@kubb/core'

describe('zod parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserZod.parse({ parent: undefined, current: schema, siblings: [schema] }, { name, rawSchema: {} })
    expect(text).toMatchSnapshot()
  })

  test.each(schemas.basic)('$name v4', ({ name, schema }) => {
    PackageManager.setVersion('zod', 'next')
    const text = parserZod.parse({ parent: undefined, current: schema, siblings: [schema] }, { name, rawSchema: {} })
    expect(text).toMatchSnapshot()
  })
})
