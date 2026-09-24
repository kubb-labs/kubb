import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import * as utils from '@internals/utils'
import { InvalidAgentTokenError, PairingCanceledError, type ConnectionOptions } from '@kubb/studio'
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
vi.mock('../../utils/env.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/env.ts')>()),
  canUseTTY: vi.fn(() => true),
}))
vi.mock('@internals/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@internals/utils')>()),
  isCIEnvironment: vi.fn(() => false),
}))
vi.mock('./credentials.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./credentials.ts')>()),
  readCredentials: vi.fn().mockResolvedValue(null),
  writeCredentials: vi.fn().mockResolvedValue(undefined),
  clearCredentials: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../generate/utils.ts', () => ({
  getConfigs: vi.fn().mockResolvedValue({
    configPath: '/project/kubb.config.ts',
    configs: [{ name: 'test', input: 'spec.yaml', output: { path: './gen' }, plugins: [] }],
  }),
}))
vi.mock('@kubb/studio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@kubb/studio')>()),
  runConnection: vi.fn(),
  pairAgent: vi.fn(),
  setStorage: vi.fn(),
  createFileStorage: vi.fn(),
}))

const confirm = vi.mocked(prompts.confirm)
const { readCredentials, writeCredentials, clearCredentials } = await import('./credentials.ts')
const { runConnection, pairAgent } = await import('@kubb/studio')
const { isCIEnvironment } = utils
const { canUseTTY } = await import('../../utils/env.ts')

const options: StudioOptions = {
  version: '0.0.0',
  studioUrl: 'http://localhost:3000',
  permission: { allowRead: false, allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false },
  autoOpen: false,
}

const credentials: Credentials = { studioUrl: options.studioUrl, token: 'token', agentId: 'id', agentSlug: 'slug' }

beforeEach(() => {
  confirm.mockReset()
  vi.mocked(writeCredentials).mockClear()
  vi.mocked(readCredentials).mockReset().mockResolvedValue(null)
  vi.mocked(clearCredentials).mockReset().mockResolvedValue(undefined)
  vi.mocked(runConnection).mockReset()
  vi.mocked(pairAgent).mockReset()
  vi.mocked(isCIEnvironment).mockReset().mockReturnValue(false)
  vi.mocked(canUseTTY).mockReset().mockReturnValue(true)
  delete process.env.KUBB_AGENT_TOKEN
})

afterEach(() => {
  vi.restoreAllMocks()
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
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()

    await expect(login(options)).resolves.toMatchObject({ token: 'new-token', agentId: credentials.agentId })
    expect(pairAgent).toHaveBeenCalledWith(expect.objectContaining({ type: 'cli', studioUrl: options.studioUrl }))
    expect(writeCredentials).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token' }))
  })
})

describe('resolvePermissions', () => {
  it('asks for every permission and stores the answers', async () => {
    confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const answers = { allowRead: false, allowWrite: true, allowConfigEdit: false, allowInput: false, allowExec: true }

    await expect(resolvePermissions(options, credentials)).resolves.toEqual(answers)
    expect(confirm).toHaveBeenCalledTimes(5)
    expect(writeCredentials).toHaveBeenCalledWith(expect.objectContaining({ projects: { [process.cwd()]: answers } }))
  })

  it('asks for editing kubb.config.ts on its own, not as part of writing generated files', async () => {
    confirm.mockResolvedValue(false)

    await resolvePermissions(options, credentials)

    // The project path is machine-specific, so it is stood in for rather than snapshotted.
    const questions = confirm.mock.calls.map(([call]) => call?.message?.replace(process.cwd(), '<project>'))
    expect(questions).toStrictEqual([
      'Let Kubb Studio read the files a generation produced?',
      'Let Kubb Studio write generated files into <project>?',
      'Let Kubb Studio change plugin options in kubb.config.ts?',
      'Let Kubb Studio generate from an OpenAPI spec it sends, instead of the one on disk?',
      'Let Kubb Studio run the formatter, the linter, and output.postGenerate?',
    ])
  })

  it('names the config the project actually has, not the default', async () => {
    confirm.mockResolvedValue(false)

    await resolvePermissions(options, credentials, 'configs/kubb.config.mjs')

    expect(confirm.mock.calls.map(([call]) => call?.message).find((message) => message?.includes('plugin options'))).toBe(
      'Let Kubb Studio change plugin options in configs/kubb.config.mjs?',
    )
  })

  it('asks nothing again once the project answered, and never stores a flag-granted permission', async () => {
    const remembered = { allowRead: false, allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false }
    const stored: Credentials = { ...credentials, projects: { [process.cwd()]: remembered } }

    await expect(resolvePermissions({ ...options, permission: { ...options.permission, allowExec: true } }, stored)).resolves.toEqual({
      ...remembered,
      allowExec: true,
    })
    expect(confirm).not.toHaveBeenCalled()
    expect(writeCredentials).not.toHaveBeenCalled()
  })

  it('still asks for the other four when one permission is granted by flag', async () => {
    confirm.mockResolvedValue(false)

    await resolvePermissions({ ...options, permission: { ...options.permission, allowConfigEdit: true } }, credentials)

    expect(confirm).toHaveBeenCalledTimes(4)
    expect(confirm.mock.calls.some(([call]) => call?.message?.includes('plugin options'))).toBe(false)
  })

  it('still answers the questions but never writes to disk when persist is false', async () => {
    confirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const answers = { allowRead: false, allowWrite: true, allowConfigEdit: false, allowInput: false, allowExec: true }

    await expect(resolvePermissions(options, credentials, undefined, false)).resolves.toEqual(answers)
    expect(confirm).toHaveBeenCalledTimes(5)
    expect(writeCredentials).not.toHaveBeenCalled()
  })
})

describe('formatPermissionRows', () => {
  it('marks every permission with whether it was granted', () => {
    expect(formatPermissionRows({ allowRead: true, allowWrite: true, allowConfigEdit: false, allowInput: true, allowExec: false })).toStrictEqual([
      '✔ read generated files',
      '✔ write generated files',
      '✘ edit kubb.config.ts',
      '✔ use a Studio spec',
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

  it('tells the operator to update KUBB_AGENT_TOKEN when a live rejection hits an env-sourced token, without touching stored credentials', async () => {
    process.env.KUBB_AGENT_TOKEN = 'env-token'
    mockConnection(rejection(true))

    await expect(connect(options)).rejects.toThrow(/update KUBB_AGENT_TOKEN/)
    expect(clearCredentials).not.toHaveBeenCalled()
    expect(writeCredentials).not.toHaveBeenCalled()
  })

  it('tells the operator to run kubb studio login when a live rejection hits a CI run, without touching stored credentials', async () => {
    vi.mocked(readCredentials).mockResolvedValue(credentials)
    vi.mocked(isCIEnvironment).mockReturnValue(true)
    mockConnection(rejection(true))

    await expect(connect(options)).rejects.toThrow(/kubb studio login/)
    expect(clearCredentials).not.toHaveBeenCalled()
    expect(writeCredentials).not.toHaveBeenCalled()
  })

  it('forgets a token rejected before a session ever opened, even on a run that cannot pair again', async () => {
    vi.mocked(readCredentials).mockResolvedValue(credentials)
    vi.mocked(isCIEnvironment).mockReturnValue(true)
    mockConnection(rejection(false))

    await expect(connect(options)).rejects.toThrow(/kubb studio login/)
    expect(clearCredentials).toHaveBeenCalled()
  })

  it('reauthenticates interactively on a live rejection and carries saved permissions forward for the same agent identity', async () => {
    vi.mocked(readCredentials).mockResolvedValue({ ...credentials, projects: { [process.cwd()]: { allowWrite: true } } })
    // The same agentId as the stored credential, so the reauth keeps the identity.
    mockPairing()
    mockConnection(rejection(true))

    await connect(options)

    expect(writeCredentials).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token', projects: { [process.cwd()]: { allowWrite: true } } }))
  })

  it('does not carry saved permissions forward when the reauthenticated agent identity differs', async () => {
    vi.mocked(readCredentials).mockResolvedValue({ ...credentials, projects: { [process.cwd()]: { allowWrite: true } } })
    mockPairing('a-different-agent')
    const connection = mockConnection(rejection(true))

    await connect(options)

    const written = vi
      .mocked(writeCredentials)
      .mock.calls.map(([call]) => call)
      .find((call) => call.token === 'new-token')
    expect(written?.projects).toBeUndefined()

    // The permissions were granted to the previous agent, so the new one is asked again rather
    // than inheriting them. The next attempt reads them through `clientOptions`.
    expect(connection.options?.clientOptions(credentials)).toMatchObject({ permissions: { allowWrite: false } })
  })

  it('exits cleanly instead of throwing when the user cancels pairing during a live reauth', async () => {
    vi.mocked(readCredentials).mockResolvedValue(credentials)
    vi.mocked(pairAgent).mockRejectedValue(new PairingCanceledError())
    const connection = mockConnection(rejection(true))

    await expect(connect(options)).resolves.toBeUndefined()
    expect(connection.outcome).toBe('stopped')
  })

  it('stops after one automatic reauth instead of pairing forever when the newly approved token is rejected again', async () => {
    vi.mocked(readCredentials).mockResolvedValue(credentials)
    mockPairing()
    mockConnection(rejection(true), rejection(true))

    await expect(connect(options)).rejects.toThrow(/rejected the newly approved token/)
    // One pairing only: the second rejection is a hard failure.
    expect(pairAgent).toHaveBeenCalledTimes(1)
  })
})
