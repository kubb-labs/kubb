import * as utils from '@internals/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logLevel } from '../createReporter.ts'
import { Diagnostics } from '../Diagnostics.ts'
import type { Config } from '../types.ts'
import { htmlReporter } from './htmlReporter.ts'

beforeEach(() => vi.stubEnv('CI', 'true'))
afterEach(() => vi.unstubAllEnvs())

describe('htmlReporter', () => {
  it('writes escaped report data and static UI assets', async () => {
    const written = new Map<string, string>()
    using _write = vi.spyOn(utils, 'write').mockImplementation(async (_path, data) => {
      written.set(_path, data)
      return null
    })
    using _read = vi
      .spyOn(utils, 'read')
      .mockImplementation(async (path) => (path.endsWith('index.html') ? '<script src="./data.js"></script>' : 'const ui = true'))
    using _error = vi.spyOn(console, 'error').mockImplementation(() => {})

    await htmlReporter.report(
      {
        config: { name: '<petstore>', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
        diagnostics: [{ code: 'KUBB_DEPRECATED', severity: 'info', message: '<unsafe>' }, Diagnostics.performance({ plugin: 'plugin-ts', duration: 145 })],
        filesCreated: 1,
        status: 'success',
        hrStart: process.hrtime(),
        pluginFiles: [{ plugin: 'plugin-ts', files: ['src/<pet>.ts'] }],
      },
      { logLevel: logLevel.info },
    )

    expect(_write).toHaveBeenCalledTimes(3)
    expect(_read).toHaveBeenCalledTimes(2)
    expect([...written.keys()]).toContainEqual(expect.stringMatching(/\.kubb\/kubb-<petstore>-\d+\/index\.html$/))
    expect(_error).toHaveBeenCalledWith(expect.stringContaining('HTML report written to'))
    expect([...written.values()]).toContain('<script src="./data.js"></script>')
    expect([...written.values()]).toContain('const ui = true')

    const data = [...written.entries()].find(([path]) => path.endsWith('/data.js'))?.[1]

    expect(data).toContain('plugin-ts')
    expect(data).toContain('src/\\u003cpet\\u003e.ts')
    expect(data).toContain('\\u003cunsafe\\u003e')
    expect(data).not.toContain('<unsafe>')
  })

  it('passes the report path to the browser helper', async () => {
    using _open = vi.spyOn(utils, 'openInBrowser').mockImplementation(() => {})
    using _read = vi.spyOn(utils, 'read').mockResolvedValue('const ui = true')
    using _write = vi.spyOn(utils, 'write').mockImplementation(async () => null)
    using _error = vi.spyOn(console, 'error').mockImplementation(() => {})

    await htmlReporter.report(
      {
        config: { root: '/tmp', output: { path: 'src/gen' } } as Config,
        diagnostics: [],
        filesCreated: 0,
        status: 'success',
        hrStart: process.hrtime(),
      },
      { logLevel: logLevel.info },
    )

    expect(_open).toHaveBeenCalledWith(expect.stringMatching(/index\.html$/))
  })
})
