import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as utils from '@internals/utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { logLevel } from '../createReporter.ts'
import { Diagnostics } from '../Diagnostics.ts'
import type { Config } from '../types.ts'
import { htmlReporter } from './htmlReporter.ts'

let cwd: string

beforeEach(() => {
  vi.stubEnv('CI', 'true')
  cwd = mkdtempSync(join(tmpdir(), 'kubb-html-reporter-'))
  vi.spyOn(process, 'cwd').mockReturnValue(cwd)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  rmSync(cwd, { recursive: true, force: true })
})

describe('htmlReporter', () => {
  it('writes escaped report data and static UI assets', async () => {
    using _read = vi
      .spyOn(utils, 'read')
      .mockImplementation(async (path) => (path.endsWith('index.html') ? '<script src="./data.js"></script>' : 'const ui = true'))
    using _error = vi.spyOn(console, 'error').mockImplementation(() => {})

    await htmlReporter.report(
      {
        config: { name: '../petstore:client<>', root: '/tmp', output: { path: 'src/gen' }, plugins: [{}, {}] } as unknown as Config,
        diagnostics: [{ code: 'KUBB_DEPRECATED', severity: 'info', message: '<unsafe>' }, Diagnostics.performance({ plugin: 'plugin-ts', duration: 145 })],
        filesCreated: 1,
        status: 'success',
        hrStart: process.hrtime(),
        pluginFiles: [{ plugin: 'plugin-ts', files: ['src/<pet>.ts'] }],
      },
      { logLevel: logLevel.info },
    )

    const [report] = readdirSync(join(cwd, '.kubb'))
    const dir = join(cwd, '.kubb', report!)

    expect(_read).toHaveBeenCalledTimes(2)
    expect(report).toMatch(/^kubb-petstore-client-\d+$/)
    expect(readdirSync(dir).sort()).toEqual(['data.js', 'index.html', 'ui.iife.js'])
    expect(_error).toHaveBeenCalledWith(expect.stringContaining('HTML report written to'))
    expect(readFileSync(join(dir, 'index.html'), 'utf8')).toBe('<script src="./data.js"></script>')
    expect(readFileSync(join(dir, 'ui.iife.js'), 'utf8')).toBe('const ui = true')

    const data = readFileSync(join(dir, 'data.js'), 'utf8')

    expect(data).toContain('plugin-ts')
    expect(data).toContain('src/\\u003cpet\\u003e.ts')
    expect(data).toContain('\\u003cunsafe\\u003e')
    expect(data).not.toContain('<unsafe>')
  })

  it('opens the written index.html in the browser', async () => {
    using _open = vi.spyOn(utils, 'openInBrowser').mockImplementation(() => {})
    using _read = vi.spyOn(utils, 'read').mockResolvedValue('const ui = true')
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

    const [report] = readdirSync(join(cwd, '.kubb'))

    expect(_open).toHaveBeenCalledWith(join(cwd, '.kubb', report!, 'index.html'))
  })
})
