import dns from 'node:dns'
import { mkdtemp, rm } from 'node:fs/promises'
import net from 'node:net'
import { tmpdir } from 'node:os'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { getErrorMessage, toError } from '@internals/utils'
import { x } from 'tinyexec'
import { Diagnostics } from './Diagnostics.ts'
import { isPublicAddress } from './publicAddress.ts'

/**
 * A git `input` split into its parts: `git+<repo>#<ref>:<path>`, where `<ref>:` is optional.
 */
export type GitInput = {
  /** Repository URL passed to `git fetch`, without the `git+` prefix. */
  repo: string
  /** Branch, tag, or commit SHA. `undefined` fetches the default branch. */
  ref: string | undefined
  /** Spec file inside the repository. */
  path: string
}

/** Matches a git `input`: the `git+` prefix npm uses for git dependencies. */
export const gitInputRegExp = /^git\+/i

function gitError(message: string, cause?: unknown): InstanceType<typeof Diagnostics.Error> {
  return new Diagnostics.Error({
    code: Diagnostics.code.gitInputFailed,
    severity: 'error',
    message,
    help: 'Write a git `input` as `git+<repo>#<ref>:<path>`, for example `git+https://github.com/org/api.git#main:specs/openapi.yaml`. Check that `git` is installed and that `git fetch` can reach the repository with your credentials.',
    location: { kind: 'config' },
    cause: cause === undefined ? undefined : toError(cause),
  })
}

/** The repository URL without a user or password, safe to print. */
function redact(repo: string): string {
  if (!URL.canParse(repo)) return repo
  const url = new URL(repo)
  url.username = ''
  url.password = ''
  return url.href
}

/**
 * Splits `git+<repo>#<ref>:<path>` into its parts. Git refs cannot contain `:`, so the first one
 * in the fragment ends the ref. Throws `KUBB_GIT_INPUT_FAILED` when the fragment or path is missing.
 */
export function parseGitInput(input: string): GitInput {
  const hashIndex = input.indexOf('#')
  const repo = input.slice(4, hashIndex === -1 ? undefined : hashIndex)
  const fragment = hashIndex === -1 ? '' : input.slice(hashIndex + 1)
  const colonIndex = fragment.indexOf(':')
  const ref = colonIndex === -1 ? undefined : fragment.slice(0, colonIndex)
  const path = colonIndex === -1 ? fragment : fragment.slice(colonIndex + 1)

  if (!repo || !path || ref === '') {
    throw gitError(`The git \`input\` for ${redact(repo)} has no repository, ref, or spec path after \`#\`.`)
  }

  return { repo, ref, path }
}

/**
 * The `git -c` settings that confine a fetch to https and to `addresses`: the connection goes to
 * the addresses already checked, whatever the host answers to a second lookup, and a redirect to
 * another host is an error. Needs git 2.37 for the pinning.
 *
 * @internal
 */
export function publicFetchConfig({ host, port, addresses }: { host: string; port: string; addresses: Array<string> }): Array<string> {
  const pinned = addresses.map((address) => (net.isIPv6(address) ? `[${address}]` : address)).join(',')
  const config = ['http.followRedirects=false', 'protocol.allow=never', 'protocol.https.allow=always']
  // An IP literal needs no pinning, since git does not look it up.
  if (!net.isIP(host)) config.push(`http.curloptResolve=${host}:${port}:${pinned}`)
  return config.flatMap((setting) => ['-c', setting])
}

async function resolvePublicFetchConfig(repo: string, signal?: AbortSignal): Promise<Array<string>> {
  if (!URL.canParse(repo) || new URL(repo).protocol !== 'https:') {
    throw gitError('A public git `input` must be an https repository URL, not an ssh, git, or file address.')
  }
  const url = new URL(repo)
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = net.isIP(host) ? [host] : (await dns.promises.lookup(host, { all: true })).map(({ address }) => address)
  if (!addresses.length || addresses.some((address) => !isPublicAddress(address))) {
    throw gitError(`${host} is not a public address, so this git \`input\` is not fetched.`)
  }
  if (!net.isIP(host)) {
    const { stdout } = await x('git', ['--version'], { nodeOptions: { signal }, throwOnError: true })
    const [, major = 0, minor = 0] = /(\d+)\.(\d+)/.exec(stdout)?.map(Number) ?? []
    if (major < 2 || (major === 2 && minor < 37)) throw gitError(`Fetching a public git \`input\` needs git 2.37 or newer, found ${stdout.trim()}.`)
  }
  return publicFetchConfig({ host, port: url.port || '443', addresses })
}

/**
 * Fetches one commit of a git repository into a temporary directory with a shallow `git fetch`,
 * so any host and the user's own git credentials work, and relative `$ref` files resolve.
 * Resolves to the spec path on disk and a `dispose` that deletes the checkout.
 *
 * With `publicOnly`, the repository must be an https URL on public addresses, the fetch connects to
 * the addresses checked, and it does not follow a redirect.
 */
export async function checkoutGitInput(
  input: string,
  signal?: AbortSignal,
  { publicOnly = false }: { publicOnly?: boolean } = {},
): Promise<{ path: string; dispose: () => Promise<void> }> {
  const { repo, ref, path } = parseGitInput(input)
  const fetchConfig = publicOnly ? await resolvePublicFetchConfig(repo, signal) : []
  const dir = await mkdtemp(join(tmpdir(), 'kubb-git-'))
  const dispose = () => rm(dir, { recursive: true, force: true })
  const specPath = resolve(dir, path)

  const relativePath = relative(dir, specPath)
  if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    await dispose()
    throw gitError(`The spec path "${path}" in the git \`input\` points outside the repository.`)
  }

  const label = `${redact(repo)}${ref ? ` at ${ref}` : ''}`
  // A prompt would hang the run, so git fails instead; credential helpers and SSH keys still work.
  const env = { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  // `--end-of-options` keeps a repo or ref that starts with `-` from being read as a git flag.
  const steps = [
    ['init', '--quiet'],
    // Symlinks become plain files, so a link in the repo cannot point the adapter at a file outside it.
    ['config', 'core.symlinks', 'false'],
    [...fetchConfig, 'fetch', '--quiet', '--depth', '1', '--end-of-options', repo, ref ?? 'HEAD'],
    ['checkout', '--quiet', 'FETCH_HEAD'],
  ]

  try {
    for (const args of steps) {
      const result = await x('git', args, { nodeOptions: { cwd: dir, env, signal }, throwOnError: false })
      if (result.exitCode !== 0) {
        const stderr = result.stderr.replaceAll(repo, redact(repo)).trim()
        throw gitError(`\`git ${args[0]}\` failed for ${label}: ${stderr || `exit code ${result.exitCode}`}`)
      }
    }
  } catch (error) {
    await dispose()
    if (Diagnostics.isError(error)) throw error
    throw gitError(`Cannot run \`git\` for ${label}: ${getErrorMessage(error)}`, error)
  }

  return { path: specPath, dispose }
}
