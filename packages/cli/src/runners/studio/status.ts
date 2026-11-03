import { homedir } from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters, styleText } from 'node:util'
import { isPathInside } from '@internals/utils'
import type { Credentials } from './credentials.ts'
import { formatPermissionRows, type WorkerState } from './run.ts'

type StatusInput = {
  studioUrl: string
  credentials: Credentials | null
  worker: { running: boolean; state: WorkerState; pid?: number; startedAt?: number }
  project: string
  logPath: string
  now?: number
}

/** How long a worker has run, such as `2h 14m`, `5m` or `40s`. */
export function formatUptime(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 1) return `${Math.max(0, Math.floor(ms / 1000))}s`
  if (minutes < 60) return `${minutes}m`

  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

const tilde = (file: string) => (isPathInside(file, homedir()) ? `~${file.slice(homedir().length)}` : file)

/**
 * The `kubb studio status` table: one row per topic, each ending with the command that changes it.
 */
export function formatStatus({ studioUrl, credentials, worker, project, logPath, now = Date.now() }: StatusInput): Array<string> {
  const pairing = (() => {
    if (!credentials) return { value: `${styleText('red', '✖')} not paired`, command: 'kubb studio login' }
    const name = `${credentials.agentSlug || credentials.agentId}${credentials.organizationSlug ? ` · org ${credentials.organizationSlug}` : ''}`
    if (credentials.studioUrl !== studioUrl) return { value: `${styleText('yellow', '!')} ${name} · ${credentials.studioUrl}`, command: 'kubb studio login' }
    return { value: `${styleText('green', '✓')} ${name}`, command: 'kubb studio logout' }
  })()
  const uptime = worker.startedAt ? ` · up ${formatUptime(now - worker.startedAt)}` : ''
  const workerRow = worker.running
    ? { value: `${styleText('green', '●')} ${worker.state} · PID ${worker.pid}${uptime}`, command: 'kubb studio stop' }
    : { value: `${styleText('dim', '○')} ${worker.state}`, command: 'kubb studio start' }
  const remembered = credentials?.projects?.[project]
  const permissions = remembered ? formatPermissionRows(remembered) : [styleText('dim', 'not chosen yet')]

  const rows: Array<{ label: string; value: string; command?: string }> = [
    { label: 'Pairing', ...pairing },
    { label: 'Worker', ...workerRow },
    { label: 'Project', value: `${path.basename(project)} · ${tilde(project)}` },
    ...permissions.map((value, index) => ({
      label: index === 0 ? 'Permissions' : '',
      value,
      command: index === 0 ? (remembered ? 'kubb studio permissions' : 'kubb studio connect') : undefined,
    })),
    { label: 'Logs', value: tilde(logPath) },
  ]
  const width = Math.max(...rows.filter((row) => row.command).map((row) => stripVTControlCharacters(row.value).length))

  return rows.map(({ label, value, command }) => {
    const line = `  ${label.padEnd(11)}  ${value}`
    return command ? `${line}${' '.repeat(width - stripVTControlCharacters(value).length + 3)}${styleText('dim', command)}` : line
  })
}
