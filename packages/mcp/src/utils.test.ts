import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { type Diagnostic, Diagnostics } from '@kubb/core'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkConfigPath, formatDiagnostics } from './utils.ts'

describe('formatDiagnostics', () => {
  it('renders the agent block from Diagnostics.format without ANSI styling', () => {
    const diagnostic: Diagnostic = {
      code: 'KUBB_REF_NOT_FOUND',
      severity: 'error',
      message: 'missing Pet',
      plugin: '@kubb/adapter-oas',
      location: { kind: 'schema', pointer: '#/components/schemas/Pet' },
      help: 'add it',
    }

    expect(formatDiagnostics([diagnostic])).toBe(
      [
        'error KUBB_REF_NOT_FOUND [@kubb/adapter-oas]: missing Pet',
        '  at: #/components/schemas/Pet',
        `  why: ${Diagnostics.explain('KUBB_REF_NOT_FOUND').cause}`,
        '  fix: add it',
        `  docs: ${Diagnostics.docsUrl('KUBB_REF_NOT_FOUND')}`,
      ].join('\n'),
    )
  })

  it('renders the underlying errors and the report link, separating entries with a blank line', () => {
    const crash: Diagnostic = {
      code: 'KUBB_PLUGIN_FAILED',
      severity: 'error',
      message: 'boom',
      cause: new Error('boom', { cause: new TypeError('x is undefined') }),
      issues: 'https://github.com/example/plugin/issues',
    }
    const output = formatDiagnostics([crash, { code: 'KUBB_UNKNOWN', severity: 'error', message: 'second' }])

    expect(output).toContain('  caused by: TypeError: x is undefined')
    expect(output).toContain('  report: https://github.com/example/plugin/issues')
    expect(output).toContain('\n\nerror KUBB_UNKNOWN: second')
  })
})

describe('checkConfigPath', async () => {
  const base = await mkdtemp(join(tmpdir(), 'kubb-mcp-config-'))
  const outside = await mkdtemp(join(tmpdir(), 'kubb-mcp-outside-'))
  await writeFile(join(outside, 'kubb.config.ts'), 'export default {}')
  await symlink(outside, join(base, 'escape'))

  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(base)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(async () => {
    await Promise.all([rm(base, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })])
  })

  it('returns the absolute path of a config inside the working directory', async () => {
    expect(await checkConfigPath('kubb.config.ts')).toEqual({ file: join(base, 'kubb.config.ts') })
  })

  it('refuses a file without a config extension', async () => {
    expect(await checkConfigPath('secrets.json')).toEqual({ error: expect.stringContaining('Invalid config file extension ".json"') })
  })

  it('refuses a path that climbs out of the working directory', async () => {
    expect(await checkConfigPath('../kubb.config.ts')).toEqual({ error: expect.stringContaining('must be within the current working directory') })
  })

  it('refuses a symlink that points outside the working directory', async () => {
    expect(await checkConfigPath('escape/kubb.config.ts')).toEqual({ error: expect.stringContaining('must be within the current working directory') })
  })
})
