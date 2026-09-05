import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import { InvalidAgentTokenError, PairingCanceledError } from '@kubb/studio'
import type { Credentials } from './credentials.ts'
import { connect, formatPermissionRows, resolvePermissions, type StudioOptions } from './run.ts'

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  log: { message: vi.fn() },
  intro: vi.fn(),
  outro: vi.fn(),
}))
vi.mock('../../utils/env.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/env.ts')>()),
  isCIEnvironment: vi.fn(() => false),
  canUseTTY: vi.fn(() => true),
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
  createClient: vi.fn(),
  startPairing: vi.fn(),
  pollForPairingToken: vi.fn(),
  setStorage: vi.fn(),
  createFileStorage: vi.fn(),
}))

const confirm = vi.mocked(prompts.confirm)
const { readCredentials, writeCredentials, clearCredentials } = await import('./credentials.ts')
const { createClient, startPairing, pollForPairingToken } = await import('@kubb/studio')
const { isCIEnvironment, canUseTTY } = await import('../../utils/env.ts')

const options: StudioOptions = {
  action: 'connect',
  version: '0.0.0',
  studioUrl: 'http://localhost:3000',
  permission: { allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false },
  autoOpen: false,
}

const credentials: Credentials = { studioUrl: options.studioUrl, token: 'token', agentId: 'id', agentSlug: 'slug' }

beforeEach(() => {
  confirm.mockReset()
  vi.mocked(writeCredentials).mockClear()
  vi.mocked(readCredentials).mockReset().mockResolvedValue(null)
  vi.mocked(clearCredentials).mockReset().mockResolvedValue(undefined)
  vi.mocked(createClient).mockReset()
  vi.mocked(startPairing).mockReset()
  vi.mocked(pollForPairingToken).mockReset()
  vi.mocked(isCIEnvironment).mockReset().mockReturnValue(false)
  vi.mocked(canUseTTY).mockReset().mockReturnValue(true)
  delete process.env.KUBB_AGENT_TOKEN
})

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * A `createClient` stand-in whose `connect()` and `disconnect()` behavior each test controls, and
 * that records the options every call was created with so a test can trigger `onAuthRequired` the
 * way a live background rejection would.
 */
function mockClient(connectImpl: () => Promise<void>) {
  const disconnect = vi.fn()
  let onAuthRequired: ((error: InvalidAgentTokenError) => void) | undefined

  vi.mocked(createClient).mockImplementationOnce((clientOptions) => {
    onAuthRequired = clientOptions.onAuthRequired
    return { connect: connectImpl, disconnect }
  })

  return {
    disconnect,
    triggerAuthRequired(error: InvalidAgentTokenError) {
      onAuthRequired?.(error)
    },
  }
}

/**
 * Mocks a browser pairing the user approves. `agentId` is what decides whether the reauthenticated
 * agent keeps the stored credential's identity, and so its saved project permissions.
 */
function mockPairing(agentId: string = credentials.agentId) {
  vi.mocked(startPairing).mockResolvedValue({
    device_code: 'device',
    user_code: 'ABCD-EFGH',
    verification_uri: 'https://studio/pair',
    verification_uri_complete: 'https://studio/pair?user_code=ABCD-EFGH',
    expires_in: 60,
    interval: 1,
  })
  vi.mocked(pollForPairingToken).mockResolvedValue({ token: 'new-token', agent: { id: agentId, slug: 'slug', name: 'demo' } })
}

describe('resolvePermissions', () => {
  it('asks for every permission and stores the answers', async () => {
    confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const answers = { allowWrite: true, allowConfigEdit: false, allowInput: false, allowExec: true }

    await expect(resolvePermissions(options, credentials)).resolves.toEqual(answers)
    expect(confirm).toHaveBeenCalledTimes(4)
    expect(writeCredentials).toHaveBeenCalledWith(expect.objectContaining({ projects: { [process.cwd()]: answers } }))
  })

  it('asks for editing kubb.config.ts on its own, not as part of writing generated files', async () => {
    confirm.mockResolvedValue(false)

    await resolvePermissions(options, credentials)

    // The project path is machine-specific, so it is stood in for rather than snapshotted.
    const questions = confirm.mock.calls.map(([call]) => call?.message?.replace(process.cwd(), '<project>'))
    expect(questions).toStrictEqual([
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
    const remembered = { allowWrite: false, allowConfigEdit: false, allowInput: false, allowExec: false }
    const stored: Credentials = { ...credentials, projects: { [process.cwd()]: remembered } }

    await expect(resolvePermissions({ ...options, permission: { ...options.permission, allowExec: true } }, stored)).resolves.toEqual({
      ...remembered,
      allowExec: true,
    })
    expect(confirm).not.toHaveBeenCalled()
    expect(writeCredentials).not.toHaveBeenCalled()
  })

  it('still asks for the other three when one permission is granted by flag', async () => {
    confirm.mockResolvedValue(false)

    await resolvePermissions({ ...options, permission: { ...options.permission, allowConfigEdit: true } }, credentials)

    expect(confirm).toHaveBeenCalledTimes(3)
    expect(confirm.mock.calls.some(([call]) => call?.message?.includes('plugin options'))).toBe(false)
  })

  it('still answers the questions but never writes to disk when persist is false', async () => {
    confirm.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const answers = { allowWrite: true, allowConfigEdit: false, allowInput: false, allowExec: true }

    await expect(resolvePermissions(options, credentials, undefined, false)).resolves.toEqual(answers)
    expect(confirm).toHaveBeenCalledTimes(4)
    expect(writeCredentials).not.toHaveBeenCalled()
  })
})

describe('formatPermissionRows', () => {
  it('marks every permission with whether it was granted', () => {
    expect(formatPermissionRows({ allowWrite: true, allowConfigEdit: false, allowInput: true, allowExec: false })).toStrictEqual([
      '✔ write generated files',
      '✘ edit kubb.config.ts',
      '✔ use a Studio spec',
      '✘ run formatter, linter, postGenerate',
    ])
  })
})

describe('connect', () => {
  it('tells the operator to update KUBB_AGENT_TOKEN when a live rejection hits an env-sourced token, without touching stored credentials', async () => {
    process.env.KUBB_AGENT_TOKEN = 'env-token'
    const client = mockClient(() => Promise.resolve())

    const promise = connect(options)
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(1))
    client.triggerAuthRequired(new InvalidAgentTokenError(options.studioUrl))

    await expect(promise).rejects.toThrow(/update KUBB_AGENT_TOKEN/)
    expect(clearCredentials).not.toHaveBeenCalled()
    expect(writeCredentials).not.toHaveBeenCalled()
    expect(client.disconnect).toHaveBeenCalled()
  })

  it('tells the operator to run kubb studio login when a live rejection hits a CI run, without touching stored credentials', async () => {
    vi.mocked(readCredentials).mockResolvedValue(credentials)
    vi.mocked(isCIEnvironment).mockReturnValue(true)
    const client = mockClient(() => Promise.resolve())

    const promise = connect(options)
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(1))
    client.triggerAuthRequired(new InvalidAgentTokenError(options.studioUrl))

    await expect(promise).rejects.toThrow(/kubb studio login/)
    expect(clearCredentials).not.toHaveBeenCalled()
    expect(writeCredentials).not.toHaveBeenCalled()
  })

  it('reauthenticates interactively on a live rejection and carries saved permissions forward for the same agent identity', async () => {
    vi.mocked(readCredentials).mockResolvedValue({ ...credentials, projects: { [process.cwd()]: { allowWrite: true } } })
    // The same agentId as the stored credential, so the reauth keeps the identity.
    mockPairing()

    const first = mockClient(() => Promise.resolve())
    mockClient(() => Promise.resolve())

    const promise = connect(options)
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(1))
    first.triggerAuthRequired(new InvalidAgentTokenError(options.studioUrl))

    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(2))
    // Second client is live: end the run the same way Ctrl+C would.
    process.emit('SIGINT' as never)

    await promise

    expect(writeCredentials).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token', projects: { [process.cwd()]: { allowWrite: true } } }))
  })

  it('does not carry saved permissions forward when the reauthenticated agent identity differs', async () => {
    vi.mocked(readCredentials).mockResolvedValue({ ...credentials, projects: { [process.cwd()]: { allowWrite: true } } })
    mockPairing('a-different-agent')

    const first = mockClient(() => Promise.resolve())
    mockClient(() => Promise.resolve())

    const promise = connect(options)
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(1))
    first.triggerAuthRequired(new InvalidAgentTokenError(options.studioUrl))

    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(2))
    process.emit('SIGINT' as never)

    await promise

    const written = vi
      .mocked(writeCredentials)
      .mock.calls.map(([call]) => call)
      .find((call) => call.token === 'new-token')
    expect(written?.projects).toBeUndefined()
  })

  it('exits cleanly instead of throwing when the user cancels pairing during a live reauth', async () => {
    vi.mocked(readCredentials).mockResolvedValue(credentials)
    vi.mocked(startPairing).mockImplementation(
      ({ signal }) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new PairingCanceledError()))
        }),
    )

    const client = mockClient(() => Promise.resolve())

    const promise = connect(options)
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(1))
    client.triggerAuthRequired(new InvalidAgentTokenError(options.studioUrl))

    await vi.waitFor(() => expect(startPairing).toHaveBeenCalledTimes(1))
    process.emit('SIGINT' as never)

    await expect(promise).resolves.toBeUndefined()
    // Only one client was ever created: cancellation during the reauth stops before a new one connects.
    expect(createClient).toHaveBeenCalledTimes(1)
  })

  it('stops after one automatic reauth instead of pairing forever when the newly approved token is rejected again', async () => {
    vi.mocked(readCredentials).mockResolvedValue(credentials)
    mockPairing()

    const first = mockClient(() => Promise.resolve())
    const second = mockClient(() => Promise.resolve())

    const promise = connect(options)
    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(1))
    first.triggerAuthRequired(new InvalidAgentTokenError(options.studioUrl))

    await vi.waitFor(() => expect(createClient).toHaveBeenCalledTimes(2))
    // The freshly approved token is rejected again immediately.
    second.triggerAuthRequired(new InvalidAgentTokenError(options.studioUrl))

    await expect(promise).rejects.toThrow(/rejected the newly approved token/)
    // No third client: one automatic reauth is all this ever attempts.
    expect(createClient).toHaveBeenCalledTimes(2)
  })

  it('keeps retrying an ordinary network failure without reauthenticating, since only an InvalidAgentTokenError triggers pairing', async () => {
    vi.mocked(readCredentials).mockResolvedValue(credentials)
    // A plain connection failure at startup is not InvalidAgentTokenError, so it should surface as-is.
    mockClient(() => Promise.reject(new Error('ECONNREFUSED')))

    await expect(connect(options)).rejects.toThrow('ECONNREFUSED')
    expect(startPairing).not.toHaveBeenCalled()
    expect(clearCredentials).not.toHaveBeenCalled()
  })
})
