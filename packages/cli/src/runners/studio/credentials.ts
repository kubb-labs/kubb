import { hash, randomBytes } from 'node:crypto'
import { mkdir, rmdir, stat } from 'node:fs/promises'
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

/**
 * Applies `update` to the stored credential under a lock that every writer takes, so two processes
 * cannot overwrite each other's change. Returning nothing leaves the file as it is.
 */
export async function updateCredentials(update: (stored: Credentials | null) => Credentials | null | undefined): Promise<void> {
  const home = getProjectKubbHome()
  const lock = path.join(home, 'credentials.lock')
  await mkdir(home, { recursive: true, mode: 0o700 })
  for (;;) {
    try {
      await mkdir(lock)
      break
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
      const age =
        Date.now() -
        (await stat(lock).then(
          ({ mtimeMs }) => mtimeMs,
          () => Date.now(),
        ))
      // A lock left behind by a process that died is taken over.
      if (age > LOCK_STALE_MS) await rmdir(lock).catch(() => undefined)
      else await sleep(25)
    }
  }
  try {
    const next = update(await readCredentials())
    if (next) await writeCredentials(next)
  } finally {
    await rmdir(lock).catch(() => undefined)
  }
}

/**
 * Forgets the stored credential. Succeeds when there was nothing to forget.
 */
export async function clearCredentials(): Promise<void> {
  await projectStorage().removeItem(CREDENTIALS_FILENAME)
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
