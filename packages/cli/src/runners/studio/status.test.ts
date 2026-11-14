import { homedir } from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { describe, expect, it } from 'vitest'
import type { Credentials } from './credentials.ts'
import { formatStatus, formatUptime } from './status.ts'

const studioUrl = 'https://studio.kubb.dev'
const project = path.join(homedir(), 'code', 'petstore')
const credentials: Credentials = { studioUrl, token: 'test-token', agentId: 'agent-1', agentSlug: 'laptop', organizationSlug: 'acme' }

function rows(input: Partial<Parameters<typeof formatStatus>[0]>): Array<string> {
  return formatStatus({
    studioUrl,
    credentials: null,
    worker: { running: false, state: 'stopped' },
    project,
    logPath: '/var/log/kubb.log',
    ...input,
  }).map((line) => stripVTControlCharacters(line).trimEnd())
}

describe('formatUptime', () => {
  it.each([
    [-5_000, '0s'],
    [40_000, '40s'],
    [5 * 60_000, '5m'],
    [(2 * 60 + 14) * 60_000, '2h 14m'],
  ])('formats %i ms as %s', (ms, expected) => {
    expect(formatUptime(ms)).toBe(expected)
  })
})

describe('formatStatus', () => {
  it('points an unpaired machine at login and start', () => {
    const lines = rows({})

    expect(lines[0]).toMatch(/^ {2}Pairing {6}✖ not paired +kubb studio login$/)
    expect(lines[1]).toMatch(/○ stopped +kubb studio start$/)
    expect(lines[2]).toBe('  Project      petstore · ~/code/petstore')
    expect(lines[3]).toMatch(/not chosen yet +kubb studio connect$/)
    expect(lines.at(-1)).toBe('  Logs         /var/log/kubb.log')
  })

  it('shows a paired, running worker with its uptime and remembered permissions', () => {
    const lines = rows({
      credentials: { ...credentials, projects: { [project]: { allowRead: true } } },
      worker: { running: true, state: 'connected', pid: 42, startedAt: 1_000 },
      now: 1_000 + 90 * 60_000,
    })

    expect(lines[0]).toMatch(/✓ laptop · org acme +kubb studio logout$/)
    expect(lines[1]).toMatch(/● connected · PID 42 · up 1h 30m +kubb studio stop$/)
    expect(lines[3]).toMatch(/^ {2}Permissions {2}✓ .+kubb studio permissions$/)
  })
})
