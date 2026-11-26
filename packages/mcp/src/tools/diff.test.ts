import { describe, expect, it, vi } from 'vitest'
import { callTool, useFakeKubbProject } from '../mocks/fakeKubb.ts'
import { MAX_OUTPUT_CHARS } from '../utils.ts'
import { diffTool } from './diff.ts'

type CheckedFile = { path: string; linesAdded: number; linesRemoved: number }

// What `kubb generate --reporter json` prints on stdout: one report per config.
const report = (files: Array<CheckedFile>) => JSON.stringify([{ name: '', status: 'success', check: { changed: files.length > 0, files } }])

const patch = ({ path, linesAdded }: CheckedFile) =>
  [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -1,1 +1,${linesAdded} @@`,
    '-export type Old = string',
    ...Array.from({ length: linesAdded }, (_, index) => `+export type New${index} = string`),
  ].join('\n')

await useFakeKubbProject()

describe('diff tool', () => {
  it('runs kubb generate --diff with the JSON reporter', async () => {
    const { isError, text } = await callTool(diffTool, {})

    expect(isError).toBe(false)
    expect(text).toContain('$ kubb generate --diff --reporter json\nExit code: 0')
  })

  it('passes --no-lockfile and --config', async () => {
    const { text } = await callTool(diffTool, { lockfile: false, configPath: 'kubb.config.ts' })

    expect(text).toMatch(/^\$ kubb generate --diff --reporter json --no-lockfile --config .*kubb\.config\.ts$/m)
  })

  it('treats exit code 1, out of date, as an answer', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '1')

    const { isError, text } = await callTool(diffTool, {})

    expect(isError).toBe(false)
    expect(text).toContain('Exit code: 1')
  })

  it('returns an error with the whole output for exit code 2, a failed run', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '2')

    const { isError, text } = await callTool(diffTool, {})

    expect(isError).toBe(true)
    expect(text).toContain('Exit code: 2')
    expect(text).toContain('to stderr')
  })

  it('returns the diffs from stderr without the JSON report', async () => {
    const files = [{ path: 'src/gen/pet.ts', linesAdded: 2, linesRemoved: 1 }]
    vi.stubEnv('FAKE_KUBB_EXIT', '1')
    vi.stubEnv('FAKE_KUBB_STDOUT', report(files))
    vi.stubEnv('FAKE_KUBB_STDERR', patch(files[0]!))

    const { text } = await callTool(diffTool, {})

    expect(text).toContain('+++ b/src/gen/pet.ts\n@@ -1,1 +1,2 @@')
    expect(text).not.toContain('"check"')
  })

  it('returns the whole output when stdout holds no report', async () => {
    vi.stubEnv('FAKE_KUBB_STDOUT', 'not a report')

    const { text } = await callTool(diffTool, {})

    expect(text).toContain('not a report')
    expect(text).toContain('to stderr')
  })

  it('runs --check for the summary format and lists each file under the CLI warnings', async () => {
    vi.stubEnv('FAKE_KUBB_EXIT', '1')
    vi.stubEnv(
      'FAKE_KUBB_STDOUT',
      report([
        { path: 'src/gen/pet.ts', linesAdded: 2, linesRemoved: 1 },
        { path: 'src/gen/order.ts', linesAdded: 1, linesRemoved: 1 },
      ]),
    )
    vi.stubEnv('FAKE_KUBB_STDERR', 'Warning: kubb-lock.json is missing')

    const { isError, text } = await callTool(diffTool, { format: 'summary' })

    expect(isError).toBe(false)
    expect(text).toContain('$ kubb generate --check --reporter json\nExit code: 1')
    expect(text).toContain('Warning: kubb-lock.json is missing\n\n2 generated files are out of date:\nsrc/gen/pet.ts (+2 -1)\nsrc/gen/order.ts (+1 -1)')
  })

  it('returns only the run log for the summary format when nothing is out of date', async () => {
    vi.stubEnv('FAKE_KUBB_STDOUT', report([]))

    const { text } = await callTool(diffTool, { format: 'summary' })

    expect(text).toMatch(/Exit code: 0\n\nto stderr$/)
  })

  it('cuts a diff over the limit, says so, and lists every out-of-date file', async () => {
    const files = [
      { path: 'src/gen/pet.ts', linesAdded: 2_000, linesRemoved: 1 },
      { path: 'src/gen/order.ts', linesAdded: 1, linesRemoved: 1 },
    ]
    vi.stubEnv('FAKE_KUBB_EXIT', '1')
    vi.stubEnv('FAKE_KUBB_STDOUT', report(files))
    vi.stubEnv('FAKE_KUBB_STDERR', files.map(patch).join('\n'))

    const { isError, text } = await callTool(diffTool, {})

    expect(isError).toBe(false)
    expect(text.length).toBeLessThanOrEqual(MAX_OUTPUT_CHARS)
    expect(text).toMatch(/\[Output cut: showing the first \d+ of \d+ characters\./)
    expect(text).toContain('2 generated files are out of date:\nsrc/gen/pet.ts (+2000 -1)\nsrc/gen/order.ts (+1 -1)')
  })

  it('caps the file list under a cut diff by size', async () => {
    const files = Array.from({ length: 120 }, (_, index) => ({ path: `src/gen/${'deep/'.repeat(50)}file${index}.ts`, linesAdded: 3, linesRemoved: 1 }))
    vi.stubEnv('FAKE_KUBB_EXIT', '1')
    vi.stubEnv('FAKE_KUBB_STDOUT', report(files))
    vi.stubEnv('FAKE_KUBB_STDERR', files.map(patch).join('\n'))

    const { text } = await callTool(diffTool, {})

    expect(text.length).toBeLessThanOrEqual(MAX_OUTPUT_CHARS)
    expect(text).toContain('120 generated files are out of date:')
    expect(text).toMatch(/and \d+ more\. Call kubb_diff with format "summary" for the full list\.\]$/)
    expect(text).toContain('@@ -1,1 +1,3 @@')
  })
})
