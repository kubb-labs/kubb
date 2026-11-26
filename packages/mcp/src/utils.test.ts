import { mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { type Diagnostic, Diagnostics } from '@kubb/core'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkConfigPath, formatDiagnostics, MAX_OUTPUT_CHARS, summarizeDiff, truncateOutput } from './utils.ts'

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

describe('truncateOutput', () => {
  it('returns a text within the limit as is, without calling the hint', () => {
    const hint = vi.fn(() => 'Ask for less.')

    expect(truncateOutput('short', hint)).toBe('short')
    expect(hint).not.toHaveBeenCalled()
  })

  it('cuts at the last line break before the limit and says how much is shown', () => {
    const line = 'x'.repeat(99)
    const text = Array.from({ length: 400 }, () => line).join('\n')

    expect(truncateOutput(text, () => 'Ask for less.')).toBe(
      `${text.slice(0, 29_999)}\n\n[Output cut: showing the first 29999 of ${text.length} characters. Ask for less.]`,
    )
  })

  it('cuts a single long line at the limit', () => {
    const cut = truncateOutput('x'.repeat(MAX_OUTPUT_CHARS + 1))

    expect(cut).toContain(`[Output cut: showing the first ${MAX_OUTPUT_CHARS} of ${MAX_OUTPUT_CHARS + 1} characters.]`)
  })
})

describe('summarizeDiff', () => {
  it('counts the added and removed lines of each file', () => {
    const diff = [
      '--- a/src/gen/pet.ts',
      '+++ b/src/gen/pet.ts',
      '@@ -1,3 +1,4 @@',
      ' export type Pet = {',
      '-  id: string',
      '+  id: number',
      '+  name: string',
      ' }',
      '--- a/src/gen/order.ts',
      '+++ b/src/gen/order.ts',
      '@@ -1 +0,0 @@',
      '-export type Order = {}',
    ].join('\n')

    expect(summarizeDiff(diff)).toEqual([
      { file: 'src/gen/pet.ts', linesAdded: 2, linesRemoved: 1 },
      { file: 'src/gen/order.ts', linesAdded: 0, linesRemoved: 1 },
    ])
  })

  it('reads a changed line that looks like a file header as a change', () => {
    const diff = ['--- a/notes.md', '+++ b/notes.md', '@@ -1,2 +1,2 @@', ' title', '--- old rule', '+++ new rule'].join('\n')

    expect(summarizeDiff(diff)).toEqual([{ file: 'notes.md', linesAdded: 1, linesRemoved: 1 }])
  })

  it('returns no files for output without a diff', () => {
    expect(summarizeDiff('Generated files are up to date')).toEqual([])
  })
})
