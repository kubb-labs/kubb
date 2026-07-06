import * as utils from '@internals/utils'
import { describe, expect, it, vi } from 'vitest'
import { logLevel } from '../createReporter.ts'
import { Diagnostics } from '../Diagnostics.ts'
import type { Config } from '../types.ts'
import { fileReporter } from './fileReporter.ts'

describe('fileReporter', () => {
  it('writes a sectioned, plain-text report with problems and timings', async () => {
    let written = ''
    using _write = vi.spyOn(utils, 'write').mockImplementation(async (_path, data) => {
      written = data
      return null
    })
    using _error = vi.spyOn(console, 'error').mockImplementation(() => {})

    await fileReporter.report(
      {
        config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
        diagnostics: [
          {
            code: 'KUBB_DEPRECATED',
            severity: 'info',
            message: 'This schema is marked as deprecated.',
            location: { kind: 'schema', pointer: '#/components/schemas/Tag' },
          },
          Diagnostics.performance({ plugin: 'plugin-ts', duration: 145 }),
          Diagnostics.performance({ plugin: 'plugin-redoc', duration: 0 }),
        ],
        filesCreated: 1,
        status: 'success',
        hrStart: process.hrtime(),
      },
      { logLevel: logLevel.verbose },
    )

    expect(_write).toHaveBeenCalledOnce()
    // No ANSI escape codes leak into the file.
    expect(written).not.toMatch(/\[/)
    expect(written).toContain('# petstore — ')
    expect(written).toContain('## Summary')
    expect(written).toContain('Plugins   2 passed (2)')
    expect(written).toContain('Files     1 generated')
    expect(written).toContain('## Problems')
    expect(written).toContain('[KUBB_DEPRECATED]: This schema is marked as deprecated.')
    expect(written).toContain('at: #/components/schemas/Tag')
    expect(written).toContain('## Timings')
    // Slowest first.
    expect(written.indexOf('plugin-ts')).toBeLessThan(written.indexOf('plugin-redoc'))
  })

  it('writes nothing when there are no diagnostics', async () => {
    using _write = vi.spyOn(utils, 'write').mockImplementation(async () => null)

    await fileReporter.report(
      {
        config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
        diagnostics: [],
        filesCreated: 0,
        status: 'success',
        hrStart: process.hrtime(),
      },
      { logLevel: logLevel.verbose },
    )

    expect(_write).not.toHaveBeenCalled()
  })
})
