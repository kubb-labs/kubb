import type { OasTypes } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { describe, expect, test } from 'vitest'
import { getFooter } from './getFooter.ts'

describe('getFooter', () => {
  test('should return undefined when no footer is provided', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      info: {},
    } as OasTypes.OASDocument)

    const result = getFooter({
      oas,
      output: { path: './output' },
    })

    expect(result).toBeUndefined()
  })

  test('should return string footer', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      info: {},
    } as OasTypes.OASDocument)

    const footer = '// End of file'
    const result = getFooter({
      oas,
      output: { path: './output', footer },
    })

    expect(result).toBe(footer)
  })

  test('should call function footer with oas', async () => {
    const oas = await parse({
      openapi: '3.0.0',
      info: {
        title: 'Test API',
      },
    } as OasTypes.OASDocument)

    const footerFn = (o: typeof oas) => `// Generated for ${o.api?.info?.title}`
    const result = getFooter({
      oas,
      output: { path: './output', footer: footerFn },
    })

    expect(result).toBe('// Generated for Test API')
  })
})
