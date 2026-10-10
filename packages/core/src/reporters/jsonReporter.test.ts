import { describe, expect, it, vi } from 'vitest'
import { logLevel } from '../createReporter.ts'
import type { Config } from '../types.ts'
import { jsonReporter } from './jsonReporter.ts'

describe('jsonReporter', () => {
  it('writes one JSON array for every config on drain', async () => {
    const writes: Array<string> = []
    using _write = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      writes.push(String(chunk))
      return true
    })
    const context = { logLevel: logLevel.info }

    await jsonReporter.report(
      {
        config: { name: 'petstore', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
        diagnostics: [{ code: 'KUBB_REF_NOT_FOUND', severity: 'error', message: 'missing Pet', plugin: '@kubb/plugin-zod' }],
        filesCreated: 3,
        status: 'failed',
        hrStart: process.hrtime(),
      },
      context,
    )
    await jsonReporter.report(
      {
        config: { name: 'orders', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}] } as unknown as Config,
        diagnostics: [],
        filesCreated: 5,
        status: 'success',
        hrStart: process.hrtime(),
      },
      context,
    )
    expect(writes).toStrictEqual([])

    await jsonReporter.drain(context)

    expect(writes).toHaveLength(1)
    const reports = JSON.parse(writes[0]!)
    expect(reports).toHaveLength(2)
    expect(reports[0]).toMatchObject({ name: 'petstore', status: 'failed', counts: { errors: 1 } })
    expect(reports[1]).toMatchObject({ name: 'orders', status: 'success' })
  })
})
