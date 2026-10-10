import { afterEach, describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import * as utils from '@internals/utils'
import type { Config } from '@kubb/core'
import { type ConnectionOptions, InvalidAgentTokenError, PairingCanceledError, pairAgent, runConnection } from '@kubb/studio'
import * as env from '../../utils/env.ts'
import * as generateUtils from '../generate/utils.ts'
import * as credentialsStore from './credentials.ts'
import type { Credentials } from './credentials.ts'
import { connect, formatPermissionRows, login, resolvePermissions, type StudioOptions } from './run.ts'

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
  runConnection: vi.fn(),
  pairAgent: vi.fn(),
  setStorage: vi.fn(),
  createFileStorage: vi.fn(),
}))

const confirm = vi.mocked(prompts.confirm)

const options: StudioOptions = {
  version: '0.0.0',
  studioUrl: 'http://localhost:3000',
  permission: { allowRead: false, allowWrite: false, allowConfigEdit: false, allowExec: false },
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
  const configs = vi.spyOn(generateUtils, 'getConfigs').mockResolvedValue({
    configPath: '/project/kubb.config.ts',
    configs: [{ name: 'test', input: 'spec.yaml', output: { path: './gen' }, plugins: [] } as unknown as Config],
  })
  const isCI = vi.spyOn(utils, 'isCIEnvironment').mockReturnValue(ci)
  const canUseTTY = vi.spyOn(env, 'canUseTTY').mockReturnValue(tty)

  return {
    write,
    clear,
    [Symbol.dispose]() {
      for (const spy of [read, write, clear, configs, isCI, canUseTTY]) {
        spy.mockRestore()
      }
    },
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetAllMocks()
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
    expect(pairAgent).toHaveBeenCalledWith(expect.objectContaining({ type: 'cli', studioUrl: options.studioUrl }))
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token' }))
  })
})

describe('resolvePermissions', () => {
  it.each([
    { persist: true, writes: 1 },
    { persist: false, writes: 0 },
  ])('returns every answer and writes to disk $writes times when persist is $persist', async ({ persist, writes }) => {
    using project = stubProject()
    confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const answers = { allowRead: false, allowWrite: true, allowConfigEdit: false, allowExec: true }

    await expect(resolvePermissions(options, credentials, undefined, persist)).resolves.toEqual(answers)
    expect(confirm).toHaveBeenCalledTimes(4)
    expect(project.write).toHaveBeenCalledTimes(writes)
    if (writes) {
      expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ projects: { [process.cwd()]: answers } }))
    }
  })

  it('asks for editing kubb.config.ts on its own, not as part of writing generated files', async () => {
    using _project = stubProject()
    confirm.mockResolvedValue(false)

    await resolvePermissions(options, credentials)

    // The project path is machine-specific, so it is stood in for rather than snapshotted.
    const questions = confirm.mock.calls.map(([call]) => call?.message?.replace(process.cwd(), '<project>'))
    expect(questions).toStrictEqual([
      'Let Kubb Studio read the files a generation produced?',
      'Let Kubb Studio write generated files into <project>?',
      'Let Kubb Studio change plugin options in kubb.config.ts?',
      'Let Kubb Studio run the formatter, the linter, and output.postGenerate?',
    ])
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
    const remembered = { allowRead: false, allowWrite: false, allowConfigEdit: false, allowExec: false }
    const stored: Credentials = { ...credentials, projects: { [process.cwd()]: remembered } }

    await expect(resolvePermissions({ ...options, permission: { ...options.permission, allowExec: true } }, stored)).resolves.toEqual({
      ...remembered,
      allowExec: true,
    })
    expect(confirm).not.toHaveBeenCalled()
    expect(project.write).not.toHaveBeenCalled()
  })

  it('still asks for the other two when one permission is granted by flag', async () => {
    using _project = stubProject()
    confirm.mockResolvedValue(false)

    await resolvePermissions({ ...options, permission: { ...options.permission, allowConfigEdit: true } }, credentials)

    expect(confirm).toHaveBeenCalledTimes(3)
    expect(confirm.mock.calls.some(([call]) => call?.message?.includes('plugin options'))).toBe(false)
  })
})

describe('formatPermissionRows', () => {
  it('marks every permission with whether it was granted', () => {
    expect(formatPermissionRows({ allowRead: true, allowWrite: true, allowConfigEdit: false, allowExec: false })).toStrictEqual([
      '✔ read generated files',
      '✔ write generated files',
      '✘ edit kubb.config.ts',
      '✘ run formatter, linter, postGenerate',
    ])
  })
})

describe('connect', () => {
  const rejection = (live: boolean) => ({ error: new InvalidAgentTokenError(options.studioUrl), live })

  /**
   * A `runConnection` stand-in. It hands the CLI's own options back to the test and fires
   * `onTokenRejected` for each queued rejection, which is what the studio runtime does when Studio
   * turns a token down. Returns what the run would: `stopped` once the CLI declines to pair again.
   */
  function mockConnection(...rejections: Array<{ error: InvalidAgentTokenError; live: boolean }>) {
    const captured: { options?: ConnectionOptions<{ token: string }>; outcome?: string } = {}

    vi.mocked(runConnection).mockImplementation(async (connectionOptions) => {
      captured.options = connectionOptions
      let { credentials } = connectionOptions

      for (const { error, live } of rejections) {
        const next = await connectionOptions.onTokenRejected({ error, live, credentials })

        if (!next) {
          captured.outcome = 'stopped'
          return 'stopped'
        }

        credentials = next
      }

      captured.outcome = 'shutdown'
      return 'shutdown'
    })

    return captured
  }

  it.each([
    { label: 'update KUBB_AGENT_TOKEN when a live rejection hits an env-sourced token', envToken: 'env-token', ci: false, message: /update KUBB_AGENT_TOKEN/ },
    { label: 'run kubb studio login when a live rejection hits a CI run', envToken: undefined, ci: true, message: /kubb studio login/ },
  ])('tells the operator to $label, without touching stored credentials', async ({ envToken, ci, message }) => {
    using project = stubProject({ stored: credentials, ci })
    if (envToken) {
      vi.stubEnv('KUBB_AGENT_TOKEN', envToken)
    }
    mockConnection(rejection(true))

    await expect(connect(options)).rejects.toThrow(message)
    expect(project.clear).not.toHaveBeenCalled()
    expect(project.write).not.toHaveBeenCalled()
  })

  it('forgets a token rejected before a session ever opened, even on a run that cannot pair again', async () => {
    using project = stubProject({ stored: credentials, ci: true })
    mockConnection(rejection(false))

    await expect(connect(options)).rejects.toThrow(/kubb studio login/)
    expect(project.clear).toHaveBeenCalled()
  })

  it('reauthenticates interactively on a live rejection and carries saved permissions forward for the same agent identity', async () => {
    using project = stubProject({ stored: { ...credentials, projects: { [process.cwd()]: { allowWrite: true } } } })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    // The same agentId as the stored credential, so the reauth keeps the identity.
    mockPairing()
    mockConnection(rejection(true))

    await connect(options)

    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token', projects: { [process.cwd()]: { allowWrite: true } } }))
  })

  it('does not carry saved permissions forward when the reauthenticated agent identity differs', async () => {
    using project = stubProject({ stored: { ...credentials, projects: { [process.cwd()]: { allowWrite: true } } } })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing('a-different-agent')
    const connection = mockConnection(rejection(true))

    await connect(options)

    const written = project.write.mock.calls.map(([call]) => call).find((call) => call.token === 'new-token')
    expect(written?.projects).toBeUndefined()

    // The permissions were granted to the previous agent, so the new one is asked again rather
    // than inheriting them. The next attempt reads them through `clientOptions`.
    expect(connection.options?.clientOptions(credentials)).toMatchObject({ permissions: { allowWrite: false } })
  })

  it('exits cleanly instead of throwing when the user cancels pairing during a live reauth', async () => {
    using _project = stubProject({ stored: credentials })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.mocked(pairAgent).mockRejectedValue(new PairingCanceledError())
    const connection = mockConnection(rejection(true))

    await expect(connect(options)).resolves.toBeUndefined()
    expect(connection.outcome).toBe('stopped')
  })

  it('stops after one automatic reauth instead of pairing forever when the newly approved token is rejected again', async () => {
    using _project = stubProject({ stored: credentials })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()
    mockConnection(rejection(true), rejection(true))

    await expect(connect(options)).rejects.toThrow(/rejected the newly approved token/)
    // One pairing only: the second rejection is a hard failure.
    expect(pairAgent).toHaveBeenCalledTimes(1)
  })

  it('logs Studio commands and warnings through the plain logger when it runs as the background worker', async () => {
    using _project = stubProject({ stored: credentials })
    const handlers = new Map<string, Array<(ctx: unknown) => unknown>>()
    const hooks = { hook: (name: string, handler: (ctx: unknown) => unknown) => handlers.set(name, [...(handlers.get(name) ?? []), handler]) }
    const fire = (name: string, ctx?: unknown) => Promise.all((handlers.get(name) ?? []).map((handler) => handler(ctx)))
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((...args) => void lines.push(args.join(' ')))
    const states: Array<string> = []

    vi.mocked(runConnection).mockImplementation(async (connectionOptions) => {
      await connectionOptions.clientOptions(connectionOptions.credentials).installLogger?.(hooks as never)
      await fire('studio:ready', {})
      await fire('studio:command:start', { command: 'generate' })
      await fire('studio:warn', { message: 'Ignored the spec from Studio' })
      await fire('studio:command:end', { command: 'generate', info: '1 plugin, in memory' })
      return 'shutdown'
    })

    await connect(options, { onState: (state) => void states.push(state) })

    const output = lines.join('\n')
    expect(states).toContain('connected')
    expect(output).toContain('generate')
    expect(output).toContain('Ignored the spec from Studio')
    expect(output).toContain('1 plugin, in memory')
  })
})
