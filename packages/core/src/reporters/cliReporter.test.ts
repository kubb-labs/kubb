import { describe, expect, it, vi } from 'vitest'
import { logLevel } from '../createReporter.ts'
import type { Config } from '../types.ts'
import { cliReporter } from './cliReporter.ts'

describe('cliReporter', () => {
  it('renders the summary per config', async () => {
    const logs: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '))
    })

    await cliReporter.report(
      {
        config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
        diagnostics: [],
        filesCreated: 12,
        status: 'success',
        hrStart: process.hrtime(),
      },
      { logLevel: logLevel.info },
    )

    const output = logs.join('\n')
    expect(output).toContain('petstore')
    expect(output).toContain('2 passed (2)')
    expect(output).toContain('12 generated')
  })

  it('renders nothing at silent', async () => {
    const logs: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '))
    })

    await cliReporter.report(
      {
        config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
        diagnostics: [],
        filesCreated: 1,
        status: 'success',
        hrStart: process.hrtime(),
      },
      { logLevel: logLevel.silent },
    )

    expect(logs).toStrictEqual([])
  })
})
