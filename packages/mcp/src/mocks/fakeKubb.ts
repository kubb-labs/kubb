import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { afterAll, afterEach, beforeEach, vi } from 'vitest'

// Prints its arguments as JSON in color, or `FAKE_KUBB_STDOUT` when set, and a line on stderr, or `FAKE_KUBB_STDERR` when set.
// `FAKE_KUBB_EXIT` sets the exit code, and `FAKE_KUBB_SIGNAL=1` ends the run with SIGTERM, as the timeout does.
// `FAKE_KUBB_STUCK=1` keeps running after SIGTERM. It writes `ready` in the working directory once it listens, and
// `sigterm` when the signal arrives.
const BIN = [
  'const args = process.argv.slice(2)',
  "console.log(process.env.FAKE_KUBB_STDOUT ?? '\\u001b[32m' + JSON.stringify(args) + '\\u001b[39m')",
  "console.error(process.env.FAKE_KUBB_STDERR ?? 'to stderr')",
  "if (process.env.FAKE_KUBB_SIGNAL === '1') process.kill(process.pid, 'SIGTERM')",
  "if (process.env.FAKE_KUBB_STUCK === '1') {",
  "  process.on('SIGTERM', () => require('node:fs').writeFileSync('sigterm', ''))",
  '  setInterval(() => {}, 1000)',
  "  require('node:fs').writeFileSync('ready', '')",
  '}',
  'process.exitCode = Number(process.env.FAKE_KUBB_EXIT ?? 0)',
].join('\n')

/**
 * Creates a temporary project whose `node_modules/@kubb/cli` holds a fake `kubb` bin, so tests can
 * see the exact arguments a tool passes without installing or running Kubb.
 */
async function createFakeKubbProject(): Promise<{ root: string; bin: string }> {
  const root = await mkdtemp(join(tmpdir(), 'kubb-mcp-fake-'))
  const cli = join(root, 'node_modules', '@kubb', 'cli')
  await mkdir(join(cli, 'bin'), { recursive: true })
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'fake-project', private: true }))
  await writeFile(join(cli, 'package.json'), JSON.stringify({ name: '@kubb/cli', bin: { kubb: 'bin/kubb.js' } }))
  await writeFile(join(cli, 'bin', 'kubb.js'), BIN)
  return { root, bin: join(cli, 'bin', 'kubb.js') }
}

/**
 * Creates a fake project for the tests of one file: the working directory points at it during each
 * test, mocks and stubbed environment variables are reset after each test, and the folder is removed at the end.
 */
export async function useFakeKubbProject(): Promise<{ root: string; bin: string }> {
  const project = await createFakeKubbProject()
  beforeEach(() => {
    vi.spyOn(process, 'cwd').mockReturnValue(project.root)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })
  afterAll(() => rm(project.root, { recursive: true, force: true }))
  return project
}

export type ToolResult = { isError?: boolean; content: Array<{ type: string; text?: string }> }

/**
 * Calls a tool's handler directly and joins its text parts.
 */
export async function callTool<TInput>(definition: unknown, input: TInput): Promise<{ isError: boolean; text: string }> {
  const { execute } = definition as { execute: (input: TInput) => Promise<ToolResult> }
  const result = await execute(input)
  return { isError: Boolean(result.isError), text: result.content.map((part) => part.text ?? '').join('\n') }
}

/**
 * The argument array the fake bin printed, read from a tool's output.
 */
export function echoedArgs(text: string): Array<string> {
  const line = text.split('\n').find((candidate) => candidate.startsWith('['))
  return line ? (JSON.parse(line) as Array<string>) : []
}
