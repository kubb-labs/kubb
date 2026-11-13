import { hash, randomBytes, randomUUID } from 'node:crypto'
import { mkdir, rename, rmdir, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as sleep } from 'node:timers/promises'
import { kubbStorage, resolveKubbDir } from '@kubb/core'

const projectBase = (project = process.cwd()) => path.join('projects', hash('sha256', project))

/**
 * Root for the credential and machine identity of the current project, inside `KUBB_HOME`.
 *
 * Studio agents are project connections, so two projects on one machine must not share the same
 * persisted token or machine secret.
 */
export function getProjectKubbHome(project = process.cwd()): string {
  return resolveKubbDir(projectBase(project))
}

const projectStorage = () => kubbStorage({ base: projectBase() })

const CREDENTIALS_FILENAME = 'credentials.json'

/**
 * Absolute path of the stored credential, so callers can name it in output without rebuilding it.
 */
export function getCredentialsPath(): string {
  return path.join(getProjectKubbHome(), CREDENTIALS_FILENAME)
}

export type Credentials = {
  /**
   * The Studio instance this machine paired with. A different `--url` means re-pairing.
   */
  studioUrl: string
  /**
   * Bearer token for this machine. Never logged, never printed.
   */
  token: string
  /**
   * When `token` was issued, as an ISO date.
   */
  issuedAt?: string
  /**
   * The agent key as a PKCS #8 PEM string, absent for an agent paired without one.
   */
  privateKey?: string
  agentId: string
  agentSlug: string
  /**
   * The organization that approved the pairing, absent when Studio sends none.
   */
  organizationSlug?: string
  /**
   * Permissions the user has already granted, keyed by absolute project path, so the CLI asks
   * once per project instead of on every run.
   */
  projects?: Record<
    string,
    {
      allowRead?: boolean
      allowReadAst?: boolean
      allowWrite?: boolean
      allowConfigEdit?: boolean
      allowInstall?: boolean
      allowUpdate?: boolean
      allowRemove?: boolean
      allowSaveInput?: boolean
      allowFileRefs?: boolean
      allowExec?: boolean
    }
  >
}

/**
 * Reads the stored credential, or null when this machine has not paired yet or the file is
 * unreadable or corrupt. A bad file is treated as "not paired" so `kubb studio login` can
 * overwrite it rather than the CLI dying on it.
 */
export async function readCredentials(): Promise<Credentials | null> {
  const stored = await projectStorage()
    .getItem<Credentials>(CREDENTIALS_FILENAME)
    .catch(() => null)

  return typeof stored?.token === 'string' && stored.token !== '' ? stored : null
}

/**
 * Writes the credential into the project folder, which only its owner can open.
 */
export async function writeCredentials(credentials: Credentials): Promise<void> {
  await projectStorage().setItem(CREDENTIALS_FILENAME, credentials)
}

const LOCK_STALE_MS = 10_000
const LOCK_RETRY_MS = 25

/**
 * Takes the lock and resolves `true`, or resolves `false` while another process holds it. A lock
 * older than {@link LOCK_STALE_MS} was left by a process that died, and is cleared for the next try.
 */
async function tryLock(lock: string): Promise<boolean> {
  const taken = await mkdir(lock).then(
    () => true,
    (error: NodeJS.ErrnoException) => {
      if (error.code !== 'EEXIST') throw error
      return false
    },
  )
  if (taken) return true

  const isStale = (dir: string) => stat(dir).then(({ mtimeMs }) => Date.now() - mtimeMs > LOCK_STALE_MS)
  if (!(await isStale(lock).catch(() => false))) return false
  // Moving the lock aside is atomic: one contender takes it, and the others find it gone.
  const aside = `${lock}.${randomUUID()}`
  if (
    !(await rename(lock, aside).then(
      () => true,
      () => false,
    ))
  )
    return false
  // A contender that was slower to look may have moved a live lock, which goes back.
  const cleared = (await isStale(aside)) ? rmdir(aside) : rename(aside, lock)
  await cleared.catch(() => undefined)

  return false
}

/**
 * Applies `update` to the stored credential under a lock that every writer takes, so two processes
 * cannot overwrite each other's change. Returning nothing leaves the file as it is. Resolves what
 * `update` returned.
 */
export function updateCredentials<T extends Credentials | null | undefined>(update: (stored: Credentials | null) => T): Promise<T> {
  return withLock(async () => {
    const next = update(await readCredentials())
    if (next) await writeCredentials(next)
    return next
  })
}

async function withLock<T>(run: () => Promise<T>): Promise<T> {
  const home = getProjectKubbHome()
  const lock = path.join(home, 'credentials.lock')
  await mkdir(home, { recursive: true, mode: 0o700 })
  while (!(await tryLock(lock))) await sleep(LOCK_RETRY_MS)
  try {
    return await run()
  } finally {
    await rmdir(lock).catch(() => undefined)
  }
}

/**
 * Forgets the stored credential. Succeeds when there was nothing to forget. Given a `token`, a
 * credential another process stored since, with a different token, is kept.
 */
export function clearCredentials(token?: string): Promise<void> {
  return withLock(async () => {
    if (token && (await readCredentials())?.token !== token) return
    await projectStorage().removeItem(CREDENTIALS_FILENAME)
  })
}

/**
 * Reads this project's machine secret, creating it on first use. Pairing sends its hash, so pairing
 * the same project again rotates one agent's token instead of creating a second agent. It lives
 * apart from the credential, which {@link clearCredentials} deletes.
 */
export async function getMachineId(): Promise<string> {
  const storage = projectStorage()
  const stored = await storage.getItem('machine-secret').catch(() => null)
  if (typeof stored === 'string' && stored.trim()) return stored.trim()

  const secret = randomBytes(32).toString('hex')
  await storage.setItem('machine-secret', secret)

  return secret
}
