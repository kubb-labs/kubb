import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import * as utils from '@internals/utils'
import type { Config } from '@kubb/core'
import { type ConnectAgentOptions, connectAgent, InvalidAgentTokenError, PairingCanceledError, pairAgent } from '@kubb/studio'
import * as env from '../../utils/env.ts'
import * as config from '../../config.ts'
import * as credentialsStore from './credentials.ts'
import type { Credentials } from './credentials.ts'
import { connect, login, resolvePermissions, type StudioOptions } from './run.ts'

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  log: { message: vi.fn() },
  intro: vi.fn(),
  outro: vi.fn(),
  updateSettings: vi.fn(),
}))
vi.mock('@kubb/studio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@kubb/studio')>()),
  connectAgent: vi.fn(),
  pairAgent: vi.fn(),
}))

const confirm = vi.mocked(prompts.confirm)

const options: StudioOptions = {
  version: '0.0.0',
  studioUrl: 'http://localhost:3000',
  permission: { allowRead: false, allowReadAst: false, allowWrite: false, allowConfigEdit: false, allowExec: false },
  autoOpen: false,
}

const credentials: Credentials = { studioUrl: options.studioUrl, token: 'token', agentId: 'id', agentSlug: 'slug' }

type ProjectOptions = {
  /**
   * The credential this machine has stored for the project, or `null` when it has not paired yet.
   */
  stored?: Credentials | null
  ci?: boolean
  tty?: boolean
}

/**
 * Stands in for the machine a test runs on: what is paired, whether a browser is reachable, and
 * the project config, so no test touches `~/.kubb` or a real `kubb.config.ts`.
 */
function stubProject({ stored = null, ci = false, tty = true }: ProjectOptions = {}) {
  const read = vi.spyOn(credentialsStore, 'readCredentials').mockResolvedValue(stored)
  const write = vi.spyOn(credentialsStore, 'writeCredentials').mockResolvedValue(undefined)
  const clear = vi.spyOn(credentialsStore, 'clearCredentials').mockResolvedValue(undefined)
  const machineId = vi.spyOn(credentialsStore, 'getMachineId').mockResolvedValue('machine-secret')
  const configs = vi.spyOn(config, 'getConfigs').mockResolvedValue({
    configPath: '/project/kubb.config.ts',
    configs: [{ name: 'test', input: 'spec.yaml', output: { path: './gen' }, plugins: [] } as unknown as Config],
  })
  const isCI = vi.spyOn(utils, 'isCIEnvironment').mockReturnValue(ci)
  const canUseTTY = vi.spyOn(env, 'canUseTTY').mockReturnValue(tty)

  return {
    write,
    clear,
    [Symbol.dispose]() {
      for (const spy of [read, write, clear, machineId, configs, isCI, canUseTTY]) {
        spy.mockRestore()
      }
    },
  }
}

let home: string

beforeEach(async () => {
  home = await mkdtemp(path.join(tmpdir(), 'kubb-home-'))
  vi.stubEnv('KUBB_HOME', home)
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
  await rm(home, { recursive: true, force: true })
})

/**
 * Mocks a browser pairing the user approves. `agentId` is what decides whether the reauthenticated
 * agent keeps the stored credential's identity, and so its saved project permissions.
 */
function mockPairing(agentId: string = credentials.agentId) {
  vi.mocked(pairAgent).mockImplementation(async ({ onCode }) => {
    await onCode(
      {
        device_code: 'device',
        user_code: 'ABCD-EFGH',
        verification_uri: 'https://studio/pair',
        verification_uri_complete: 'https://studio/pair?user_code=ABCD-EFGH',
        expires_in: 60,
        interval: 1,
      },
      1,
    )

    return { token: 'new-token', agent: { id: agentId, slug: 'slug', name: 'demo' } }
  })
}

describe('login', () => {
  it('pairs this machine as a cli agent and stores the approved token', async () => {
    using project = stubProject()
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()

    await expect(login(options)).resolves.toMatchObject({ token: 'new-token', agentId: credentials.agentId })
    expect(pairAgent).toHaveBeenCalledWith(expect.objectContaining({ type: 'cli', studioUrl: options.studioUrl, machineId: 'machine-secret' }))
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token' }))
  })
})

describe('resolvePermissions', () => {
  it('returns every answer and writes it to disk', async () => {
    using project = stubProject()
    confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const answers = { allowRead: false, allowReadAst: true, allowWrite: true, allowConfigEdit: false, allowExec: true }

    await expect(resolvePermissions(options, credentials)).resolves.toEqual(answers)
    expect(confirm).toHaveBeenCalledTimes(5)
    expect(project.write).toHaveBeenCalledTimes(1)
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ projects: { [process.cwd()]: answers } }))
  })

  it('names the config the project actually has, not the default', async () => {
    using _project = stubProject()
    confirm.mockResolvedValue(false)

    await resolvePermissions(options, credentials, 'configs/kubb.config.mjs')

    expect(confirm.mock.calls.map(([call]) => call?.message).find((message) => message?.includes('plugin options'))).toBe(
      'Let Kubb Studio change plugin options in configs/kubb.config.mjs?',
    )
  })

  it('asks nothing again once the project answered, and never stores a flag-granted permission', async () => {
    using project = stubProject()
    const remembered = { allowRead: false, allowReadAst: false, allowWrite: false, allowConfigEdit: false, allowExec: false }
    const stored: Credentials = { ...credentials, projects: { [process.cwd()]: remembered } }

    await expect(resolvePermissions({ ...options, permission: { ...options.permission, allowExec: true } }, stored)).resolves.toEqual({
      ...remembered,
      allowExec: true,
    })
    expect(confirm).not.toHaveBeenCalled()
    expect(project.write).not.toHaveBeenCalled()
  })
})

describe('connect', () => {
  const connected = {
    url: options.studioUrl,
    versions: { studio: '1.0.0', kubb: '5.0.0', agent: '0.0.0' },
    sandbox: false,
    agentSlug: 'slug',
    studioVersion: '1.0.0',
  }

  /**
   * A `connectAgent` stand-in. Each call runs the next queued attempt: `rejected` throws what the
   * runtime throws when Studio turns the token down, `connected then rejected` announces the
   * session before it throws, and a call past the queue returns like a shutdown.
   */
  function mockConnection(...attempts: Array<'rejected' | 'connected then rejected'>) {
    const calls: Array<ConnectAgentOptions> = []

    vi.mocked(connectAgent).mockImplementation(async (connectOptions) => {
      calls.push(connectOptions)
      const attempt = attempts[calls.length - 1]
      if (!attempt) return
      if (attempt === 'connected then rejected') await connectOptions.hooks?.callHook('studio:connected', connected)
      throw new InvalidAgentTokenError(options.studioUrl)
    })

    return calls
  }

  it('forgets a rejected token on a run that cannot pair again, and says how to pair', async () => {
    using project = stubProject({ stored: credentials, ci: true })
    mockConnection('rejected')

    await expect(connect(options)).rejects.toThrow(/kubb studio login/)
    expect(project.clear).toHaveBeenCalled()
  })

  it('pairs again interactively and carries saved permissions forward for the same agent identity', async () => {
    using project = stubProject({ stored: { ...credentials, projects: { [process.cwd()]: { allowWrite: true } } } })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()
    const calls = mockConnection('rejected')

    await connect(options)

    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token', projects: { [process.cwd()]: { allowWrite: true } } }))
    expect(calls.map(({ token }) => token)).toStrictEqual(['token', 'new-token'])
  })

  it('does not carry saved permissions forward when the new agent identity differs', async () => {
    using project = stubProject({ stored: { ...credentials, projects: { [process.cwd()]: { allowWrite: true } } } })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing('a-different-agent')
    const calls = mockConnection('rejected')

    await connect(options)

    const written = project.write.mock.calls.map(([call]) => call).find((call) => call.token === 'new-token')
    expect(written?.projects).toBeUndefined()
    // The permissions were granted to the previous agent, so the new one is asked again rather
    // than inheriting them.
    expect(calls[1]?.permissions).toMatchObject({ allowWrite: false })
  })

  it('exits cleanly when the user cancels pairing again', async () => {
    using _project = stubProject({ stored: credentials })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(pairAgent).mockRejectedValue(new PairingCanceledError())
    mockConnection('rejected')

    await expect(connect(options)).resolves.toBeUndefined()
    expect(connectAgent).toHaveBeenCalledOnce()
  })

  it('stops instead of pairing forever when the newly approved token is rejected before it connects', async () => {
    using _project = stubProject({ stored: credentials })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()
    mockConnection('rejected', 'rejected')

    await expect(connect(options)).rejects.toThrow(/rejected the newly approved token/)
    expect(pairAgent).toHaveBeenCalledTimes(1)
  })

  it('pairs again for a later rejection once the new token has connected', async () => {
    using _project = stubProject({ stored: credentials })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()
    mockConnection('rejected', 'connected then rejected')

    await connect(options)

    expect(pairAgent).toHaveBeenCalledTimes(2)
  })

  it('logs Studio commands and warnings through the plain logger when it runs as the background worker', async () => {
    using _project = stubProject({ stored: credentials })
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((...args) => void lines.push(args.join(' ')))
    const states: Array<string> = []

    vi.mocked(connectAgent).mockImplementation(async ({ hooks }) => {
      await hooks?.callHook('studio:connected', connected)
      await hooks?.callHook('studio:warn', { message: 'Ignored the spec from Studio' })
      await hooks?.callHook('studio:command', { command: 'generate', info: '1 plugin, in memory' })
    })

    await connect(options, { onState: (state) => void states.push(state) })

    const output = lines.join('\n')
    expect(states).toContain('connected')
    expect(output).toContain('generate')
    expect(output).toContain('Ignored the spec from Studio')
    expect(output).toContain('1 plugin, in memory')
  })
})
