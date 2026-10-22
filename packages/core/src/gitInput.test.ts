import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Diagnostics } from './Diagnostics.ts'
import { checkoutGitInput, gitConfigEnv, parseGitInput, publicFetchConfig } from './gitInput.ts'

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

  it('passes `env` to git as configuration for the fetch', async () => {
    const input = 'git+https://git.invalid/org/api.git#v1:specs/openapi.yaml'
    // The rewrite to the local repository exists only in the env, so the fetch succeeds only when git read it.
    const env = { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: `url.${repo}.insteadOf`, GIT_CONFIG_VALUE_0: 'https://git.invalid/org/api.git' }

    await expect(checkoutGitInput(input)).rejects.toMatchObject({ diagnostic: { code: 'KUBB_GIT_INPUT_FAILED' } })

    const withEnv = await checkoutGitInput(input, undefined, { env })
    expect(await readFile(withEnv.path, 'utf8')).toBe('openapi: 3.1.0\n')
    await withEnv.dispose()
  })
})

describe('gitConfigEnv', () => {
  it('keeps only the Authorization header for the repository when scoped to one', () => {
    const env = {
      GIT_CONFIG_COUNT: '4',
      GIT_CONFIG_KEY_0: 'credential.helper',
      GIT_CONFIG_VALUE_0: '!evil',
      GIT_CONFIG_KEY_1: 'url.https://evil.example/.insteadOf',
      GIT_CONFIG_VALUE_1: 'https://github.com/',
      GIT_CONFIG_KEY_2: 'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_2: 'Authorization: Basic abc',
      GIT_CONFIG_KEY_3: 'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_3: 'X-Other: no',
      GIT_CONFIG_GLOBAL: '/tmp/evil-gitconfig',
      GIT_CONFIG_NOSYSTEM: '0',
    }

    expect(gitConfigEnv(env, { repo: 'https://github.com/org/api.git' })).toStrictEqual({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_0: 'Authorization: Basic abc',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_NOSYSTEM: '1',
    })
    expect(gitConfigEnv(env, { repo: 'https://gitlab.com/org/api.git' })).toStrictEqual({
      GIT_CONFIG_COUNT: '0',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_NOSYSTEM: '1',
    })
  })

  it('keeps the GIT_CONFIG_* entries and drops everything else', () => {
    expect(
      gitConfigEnv({
        GIT_CONFIG_COUNT: '1',
        GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
        GIT_CONFIG_VALUE_0: 'Authorization: Basic abc',
        GIT_CONFIG_GLOBAL: '/dev/null',
        GIT_CONFIG_NOSYSTEM: '1',
        GIT_CONFIG_KEY_x: 'nope',
        GIT_TERMINAL_PROMPT: '1',
        NODE_OPTIONS: '--require evil',
        PATH: '/tmp',
      }),
    ).toStrictEqual({
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.https://github.com/.extraheader',
      GIT_CONFIG_VALUE_0: 'Authorization: Basic abc',
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_NOSYSTEM: '1',
    })
  })
})

describe('publicFetchConfig', () => {
  it('pins a host name to the addresses that were checked, and refuses redirects and other transports', () => {
    expect(publicFetchConfig({ host: 'git.example.com', port: '443', addresses: ['93.184.216.34', '2606:4700:4700::1111'] })).toStrictEqual([
      '-c',
      'http.followRedirects=false',
      '-c',
      'protocol.allow=never',
      '-c',
      'protocol.https.allow=always',
      '-c',
      'http.curloptResolve=git.example.com:443:93.184.216.34,[2606:4700:4700::1111]',
    ])
  })

  it('leaves an IP literal unpinned, since git does not look it up', () => {
    expect(publicFetchConfig({ host: '93.184.216.34', port: '8443', addresses: ['93.184.216.34'] }).join(' ')).not.toContain('curloptResolve')
  })
})

describe('checkoutGitInput with publicOnly', () => {
  it.each([
    ['plain http', 'git+http://93.184.216.34/api.git#main:openapi.yaml'],
    ['an scp style address', 'git+git@github.com:org/api.git#main:openapi.yaml'],
    ['a local path', 'git+file:///srv/api.git#main:openapi.yaml'],
    ['a private address', 'git+https://10.0.0.5/api.git#main:openapi.yaml'],
    ['the metadata address', 'git+https://169.254.169.254/api.git#main:openapi.yaml'],
    ['a name that resolves to loopback', 'git+https://localhost/api.git#main:openapi.yaml'],
  ])('refuses %s before it fetches anything', async (_label, input) => {
    await expect(checkoutGitInput(input, undefined, { publicOnly: true })).rejects.toMatchObject({ diagnostic: { code: 'KUBB_GIT_INPUT_FAILED' } })
  })
})
