import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import process from 'node:process'

/**
 * Root for everything the CLI persists between runs: the paired credential, the machine secret,
 * the last Studio config, and the live-session registry. `KUBB_HOME` relocates all of it.
 */
export function getKubbHome(): string {
  return process.env.KUBB_HOME ?? path.join(homedir(), '.kubb')
}

const credentialsPath = () => path.join(getKubbHome(), 'credentials.json')

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
  projects?: Record<string, { allowWrite?: boolean; allowConfigEdit?: boolean; allowInput?: boolean; allowExec?: boolean }>
}

/**
 * Reads the stored credential, or null when this machine has not paired yet or the file is
 * unreadable or corrupt. A bad file is treated as "not paired" so `kubb studio login` can
 * overwrite it rather than the CLI dying on it.
 */
export async function readCredentials(): Promise<Credentials | null> {
  const raw = await readFile(credentialsPath(), 'utf8').catch(() => null)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Credentials
  } catch {
    return null
  }
}

/**
 * Writes the credential with owner-only permissions. The file holds a bearer token, so the mode
 * is set explicitly rather than left to the process umask.
 */
export async function writeCredentials(credentials: Credentials): Promise<void> {
  const file = credentialsPath()

  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 })
  await writeFile(file, `${JSON.stringify(credentials, null, 2)}\n`)
  // Not `writeFile`'s `mode`, which only applies when the file is created: an existing credential
  // file keeps whatever mode it had.
  await chmod(file, 0o600)
}

/**
 * Forgets the stored credential. Succeeds when there was nothing to forget.
 */
export async function clearCredentials(): Promise<void> {
  await rm(credentialsPath(), { force: true })
}
