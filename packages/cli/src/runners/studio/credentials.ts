import { hash, randomBytes } from 'node:crypto'
import path from 'node:path'
import process from 'node:process'
import { kubbStorage, resolveKubbDir } from '@kubb/core'

/**
 * Root for the credential and machine identity of the current project, inside `KUBB_HOME`.
 *
 * Studio agents are project connections, so two projects on one machine must not share the same
 * persisted token or machine secret.
 */
export function getProjectKubbHome(project = process.cwd()): string {
  return resolveKubbDir(path.join('projects', hash('sha256', project)))
}

const projectStorage = () => kubbStorage({ base: getProjectKubbHome() })

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
  agentId: string
  agentSlug: string
  /**
   * Permissions the user has already granted, keyed by absolute project path, so the CLI asks
   * once per project instead of on every run.
   */
  projects?: Record<string, { allowRead?: boolean; allowWrite?: boolean; allowConfigEdit?: boolean; allowExec?: boolean }>
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
