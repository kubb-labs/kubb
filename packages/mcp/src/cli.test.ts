import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'
import * as v from 'valibot'
import { resolveCliBin, runCli, runKubb } from './cli.ts'
import { registryIdSchema } from './tools/shared.ts'

const dir = await mkdtemp(join(tmpdir(), 'kubb-mcp-cli-'))

/** A project whose `node_modules/@kubb/cli` bin prints its arguments in color and exits with the code passed as `--exit`. */
async function createProject(name: string) {
  const root = join(dir, name)
  const cli = join(root, 'node_modules', '@kubb', 'cli')
  await mkdir(join(cli, 'bin'), { recursive: true })
  await writeFile(join(root, 'package.json'), JSON.stringify({ name, private: true }))
  await writeFile(join(cli, 'package.json'), JSON.stringify({ name: '@kubb/cli', bin: { kubb: 'bin/kubb.js' } }))
  await writeFile(
    join(cli, 'bin', 'kubb.js'),
    [
      'const args = process.argv.slice(2)',
      "console.log('\\u001b[32m' + JSON.stringify(args) + '\\u001b[39m')",
      "console.error('to stderr')",
      "const exit = args.find((arg) => arg.startsWith('--exit='))",
      "process.exitCode = exit ? Number(exit.slice('--exit='.length)) : 0",
    ].join('\n'),
  )
  return { root, bin: join(cli, 'bin', 'kubb.js') }
}

type ToolResult = { isError?: boolean; content: Array<{ type: string; text?: string }> }
const textOf = (result: ToolResult) => result.content.map((part) => part.text ?? '').join('\n')

afterEach(() => {
  vi.restoreAllMocks()
})

afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('resolveCliBin', () => {
  it('finds the kubb bin installed in the project', async () => {
    const { root, bin } = await createProject('resolve')

    expect(await resolveCliBin(root)).toBe(bin)
  })
})

describe('runCli', () => {
  it('passes each argument as is, without a shell, and strips ANSI styling', async () => {
    const { root, bin } = await createProject('run')

    const result = await runCli({ bin, args: ['add', 'plugin-zod', '$(echo hi)', '--yes'], cwd: root })

    expect(result.exitCode).toBe(0)
    expect(result.output).toContain('["add","plugin-zod","$(echo hi)","--yes"]')
    expect(result.output).toContain('to stderr')
    expect(result.output).not.toContain('\u001b[')
  })
})

describe('runKubb', () => {
  it('returns an error for a non-zero exit unless isSuccess accepts it', async () => {
    const { root } = await createProject('exit')
    vi.spyOn(process, 'cwd').mockReturnValue(root)

    const failed = (await runKubb(['generate', '--exit=1'])) as ToolResult
    const accepted = (await runKubb(['generate', '--exit=1'], { isSuccess: (code) => code <= 1 })) as ToolResult

    expect(failed.isError).toBe(true)
    expect(textOf(failed)).toContain('Exit code: 1')
    expect(accepted.isError).toBeFalsy()
  })
})

describe('registryIdSchema', () => {
  it.each(['plugin-zod', 'kubb-labs/plugin-zod'])('accepts %s', (id) => {
    expect(v.safeParse(registryIdSchema, id).success).toBe(true)
  })

  it.each(['--help', '-y', 'a b', 'owner/slug/extra', '../plugin'])('refuses %s, which could reach the CLI as a flag or a path', (id) => {
    expect(v.safeParse(registryIdSchema, id).success).toBe(false)
  })
})
