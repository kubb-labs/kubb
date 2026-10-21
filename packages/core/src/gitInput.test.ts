import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Diagnostics } from './Diagnostics.ts'
import { checkoutGitInput, parseGitInput } from './gitInput.ts'

describe('parseGitInput', () => {
  it.each([
    [
      'a ref and a path',
      'git+https://github.com/org/api.git#v2:specs/openapi.yaml',
      { repo: 'https://github.com/org/api.git', ref: 'v2', path: 'specs/openapi.yaml' },
    ],
    [
      'a path on the default branch',
      'git+ssh://git@github.com/org/api.git#openapi.yaml',
      { repo: 'ssh://git@github.com/org/api.git', ref: undefined, path: 'openapi.yaml' },
    ],
    ['the scp-style SSH form', 'git+git@github.com:org/api.git#main:openapi.yaml', { repo: 'git@github.com:org/api.git', ref: 'main', path: 'openapi.yaml' }],
  ])('splits %s', (_name, input, expected) => {
    expect(parseGitInput(input)).toStrictEqual(expected)
  })

  it.each([
    ['no fragment', 'git+https://github.com/org/api.git'],
    ['an empty path', 'git+https://github.com/org/api.git#main:'],
    ['an empty ref', 'git+https://github.com/org/api.git#:openapi.yaml'],
  ])('throws KUBB_GIT_INPUT_FAILED for %s', (_name, input) => {
    expect(() => parseGitInput(input)).toThrow(Diagnostics.Error)
  })
})

describe('checkoutGitInput', () => {
  let root: string
  let repo: string

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'kubb-git-test-'))
    const git = (...args: Array<string>) => execFileSync('git', args, { cwd: root, stdio: 'ignore' })
    await mkdir(join(root, 'specs'))
    await writeFile(join(root, 'specs', 'openapi.yaml'), 'openapi: 3.1.0\n')
    await writeFile(join(root, '..openapi.yaml'), 'openapi: 3.0.0\n')
    await symlink('/etc/hostname', join(root, 'linked.yaml'))
    git('init', '--quiet', '--initial-branch', 'main')
    git('-c', 'user.name=kubb', '-c', 'user.email=kubb@example.com', 'commit', '--quiet', '--allow-empty', '-m', 'init')
    git('add', '.')
    git('-c', 'user.name=kubb', '-c', 'user.email=kubb@example.com', 'commit', '--quiet', '-m', 'spec')
    git('tag', 'v1')
    repo = pathToFileURL(root).href
  })

  afterAll(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it('checks out the spec at a ref and deletes it on dispose', async () => {
    const checkout = await checkoutGitInput(`git+${repo}#v1:specs/openapi.yaml`)

    expect(await readFile(checkout.path, 'utf8')).toBe('openapi: 3.1.0\n')
    await checkout.dispose()
    expect(existsSync(checkout.path)).toBe(false)
  })

  it('throws KUBB_GIT_INPUT_FAILED for a missing ref', async () => {
    await expect(checkoutGitInput(`git+${repo}#missing:specs/openapi.yaml`)).rejects.toMatchObject({ diagnostic: { code: 'KUBB_GIT_INPUT_FAILED' } })
  })

  it('reads a root-level file whose name starts with two dots', async () => {
    const checkout = await checkoutGitInput(`git+${repo}#v1:..openapi.yaml`)

    expect(await readFile(checkout.path, 'utf8')).toBe('openapi: 3.0.0\n')
    await checkout.dispose()
  })

  it('checks out a symlink as a plain file', async () => {
    const checkout = await checkoutGitInput(`git+${repo}#v1:linked.yaml`)

    expect((await lstat(checkout.path)).isSymbolicLink()).toBe(false)
    expect(await readFile(checkout.path, 'utf8')).toBe('/etc/hostname')
    await checkout.dispose()
  })

  it('rejects a path that leaves the repository', async () => {
    await expect(checkoutGitInput(`git+${repo}#v1:../outside.yaml`)).rejects.toMatchObject({ diagnostic: { code: 'KUBB_GIT_INPUT_FAILED' } })
  })
})
