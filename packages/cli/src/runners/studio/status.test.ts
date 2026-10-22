import { homedir } from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { describe, expect, it } from 'vitest'
import type { Credentials } from './credentials.ts'
import { formatStatus } from './status.ts'

const project = path.join(homedir(), 'code', 'petstore')
const credentials: Credentials = {
  studioUrl: 'https://studio.kubb.dev',
  token: 'token',
  agentId: 'id',
  agentSlug: 'stijn-macbook',
  organizationSlug: 'kubb-labs',
  projects: { [project]: { allowRead: true, allowReadAst: true, allowWrite: false, allowConfigEdit: false, allowInstall: false, allowExec: false } },
}
const base = { studioUrl: 'https://studio.kubb.dev', project, logPath: path.join(homedir(), '.kubb', 'worker.log') }

function render(input: Partial<Parameters<typeof formatStatus>[0]>): Array<string> {
  return formatStatus({ ...base, credentials, worker: { running: false, state: 'stopped' }, ...input }).map((line) => stripVTControlCharacters(line).trimEnd())
}

describe('formatStatus', () => {
  it('ends each row with the command that changes it', () => {
    const now = Date.now()

    expect(render({ worker: { running: true, state: 'connected', pid: 48213, startedAt: now - 134 * 60_000 }, now })).toStrictEqual([
      '  Pairing      ✓ stijn-macbook · org kubb-labs       kubb studio logout',
      '  Worker       ● connected · PID 48213 · up 2h 14m   kubb studio stop',
      '  Project      petstore · ~/code/petstore',
      '  Permissions  ✓ read source  ✓ read spec',
      '               ✖ write files  ✖ edit config',
      '               ✖ add plugins  ✖ run tools     --allow-write --allow-config-edit --allow-install --allow-exec',
      '  Logs         ~/.kubb/worker.log',
    ])
  })
})
