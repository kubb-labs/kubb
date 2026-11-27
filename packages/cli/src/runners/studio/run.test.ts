import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import * as utils from '@internals/utils'
import { type Config, Diagnostics } from '@kubb/core'
import {
  type ConnectAgentOptions,
  connectAgent,
  InvalidAgentTokenError,
  PairingCanceledError,
  PairingCodeError,
  pairAgent,
  redeemPairingCode,
  renewAgentToken,
} from '@kubb/studio'
import * as env from '../../utils/env.ts'
import * as config from '../../config.ts'
import * as credentialsStore from './credentials.ts'
import type { Credentials } from './credentials.ts'
import * as background from './background.ts'
import { resolvePermissions } from './permissions.ts'
import { connect, login, PAIRING_CODE_ENV, prepareConnection, runStudio, type StudioOptions } from './run.ts'

vi.mock('@clack/prompts', () => ({
  multiselect: vi.fn(),
  isCancel: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  log: { message: vi.fn() },
  intro: vi.fn(),
  outro: vi.fn(),
  updateSettings: vi.fn(),
  settings: { aliases: new Map([['\u0003', 'cancel']]) },
}))
vi.mock('@kubb/studio', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@kubb/studio')>()),
  connectAgent: vi.fn(),
  pairAgent: vi.fn(),
  redeemPairingCode: vi.fn(),
  renewAgentToken: vi.fn(),
}))

const multiselect = vi.mocked(prompts.multiselect)

const options: StudioOptions = {
  version: '0.0.0',
  studioUrl: 'http://localhost:3000',
  permission: {
    allowRead: false,
    allowReadAst: false,
    allowWrite: false,
    allowConfigEdit: false,
    allowInstall: false,
    allowUpdate: false,
    allowRemove: false,
    allowSaveInput: false,
    allowFileRefs: false,
    allowExec: false,
  },
  autoOpen: false,
}

const credentials: Credentials = { studioUrl: options.studioUrl, token: 'token', issuedAt: new Date().toISOString(), agentId: 'id', agentSlug: 'slug' }

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
  const update = vi.spyOn(credentialsStore, 'updateCredentials').mockImplementation(async (change) => {
    const next = change(await credentialsStore.readCredentials())
    if (next) await credentialsStore.writeCredentials(next)
    return next
  })
  const machineId = vi.spyOn(credentialsStore, 'getMachineId').mockResolvedValue('machine-secret')
  const configs = vi.spyOn(config, 'getConfigs').mockResolvedValue({
    configPath: '/project/kubb.config.ts',
    configs: [{ name: 'test', input: 'spec.yaml', output: { path: './gen' }, plugins: [] } as unknown as Config],
  })
  const isCI = vi.spyOn(utils, 'isCIEnvironment').mockReturnValue(ci)
  const canUseTTY = vi.spyOn(env, 'canUseTTY').mockReturnValue(tty)
  const copy = vi.spyOn(utils, 'copyToClipboard').mockResolvedValue(true)
  multiselect.mockResolvedValue([])
  // A Studio without the refresh route, unless a test says otherwise.
  vi.mocked(renewAgentToken).mockResolvedValue(null)

  return {
    write,
    clear,
    copy,
    [Symbol.dispose]() {
      for (const spy of [read, write, clear, update, machineId, configs, isCI, canUseTTY, copy]) {
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
function mockPairing(agentId: string = credentials.agentId, organizationSlug?: string) {
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

    return { token: 'new-token', agent: { id: agentId, slug: 'slug', name: 'demo', organizationSlug } }
  })
}

describe('runStudio', () => {
  it.each([
    ['the paired Studio without --url', undefined, 'http://localhost:4002'],
    ['--url over the paired Studio', 'https://studio.example.com', 'https://studio.example.com'],
  ])('uses %s', async (_case, url, expected) => {
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')
    using _paired = vi.spyOn(credentialsStore, 'readPairedStudioUrl').mockResolvedValue('http://localhost:4002')
    const action = vi.fn(async () => {})

    await runStudio({ url, logLevel: 'silent' }, action)

    expect(action).toHaveBeenCalledWith(expect.objectContaining({ studioUrl: expected }))
  })

  it('uses the hosted Studio when the project is not paired', async () => {
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')
    const action = vi.fn(async () => {})

    await runStudio({ logLevel: 'silent' }, action)

    expect(action).toHaveBeenCalledWith(expect.objectContaining({ studioUrl: 'https://kubb.studio' }))
  })

  it('prints the help of a failure and sets the exit code', async () => {
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')
    const printed = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = new Diagnostics.Error({ code: Diagnostics.code.unknown, severity: 'error', message: 'Studio is down.', help: 'Try again later.' })

    await runStudio({ logLevel: 'silent' }, async () => Promise.reject(failure), { json: true })

    expect(printed.mock.calls.join('\n')).toContain('fix: Try again later.')
    expect(process.exitCode).toBe(1)
    process.exitCode = undefined
  })
})

describe('login', () => {
  it('pairs this machine as a cli agent and stores the approved token', async () => {
    using project = stubProject()
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()

    await expect(login(options)).resolves.toMatchObject({ token: 'new-token', agentId: credentials.agentId })
    expect(pairAgent).toHaveBeenCalledWith(expect.objectContaining({ type: 'cli', studioUrl: options.studioUrl, machineId: 'machine-secret' }))
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token', issuedAt: expect.any(String) }))
  })

  it('keeps permissions saved while the pairing waited for approval', async () => {
    const saved = { ...credentials, projects: { '/project': { allowWrite: false } } }
    using project = stubProject({ stored: saved })
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()

    await login(options, { previousCredentials: { ...credentials, projects: { '/project': { allowWrite: true } } } })

    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ projects: saved.projects }))
  })

  it('pairs with a new agent key and stores it with the token', async () => {
    using project = stubProject()
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()

    const stored = await login(options)

    expect(stored.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/)
    expect(pairAgent).toHaveBeenCalledWith(expect.objectContaining({ privateKey: stored.privateKey }))
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token', privateKey: stored.privateKey }))
  })

  it('shows the code with its link, copies it in the background, and stores the organization', async () => {
    using project = stubProject()
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((...args) => void lines.push(args.join(' ')))
    mockPairing(credentials.agentId, 'kubb-labs')

    await login(options)

    const output = lines.join('\n')
    expect(output).toContain('Pair this machine')
    expect(output).toContain('https://studio/pair')
    expect(output).toContain('ABCD-EFGH')
    expect(output).toContain('expires in 1:00')
    expect(output).toContain('Paired as demo · org kubb-labs')
    expect(project.copy).toHaveBeenCalledWith('ABCD-EFGH')
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ organizationSlug: 'kubb-labs' }))
  })
})

describe('resolvePermissions', () => {
  it('asks once in one list, with nothing checked, and writes every answer', async () => {
    using project = stubProject()
    multiselect.mockResolvedValueOnce(['allowReadAst', 'allowWrite', 'allowExec'])

    const answers = {
      allowRead: false,
      allowReadAst: true,
      allowWrite: true,
      allowConfigEdit: false,
      allowInstall: false,
      allowUpdate: false,
      allowRemove: false,
      allowSaveInput: false,
      allowFileRefs: false,
      allowExec: true,
    }

    await expect(resolvePermissions(options, credentials)).resolves.toEqual(answers)
    expect(multiselect).toHaveBeenCalledOnce()
    expect(multiselect.mock.calls[0]?.[0]).toMatchObject({ message: 'What may Kubb Studio do in this project?' })
    expect(multiselect.mock.calls[0]?.[0].initialValues).toBeUndefined()
    expect(project.write).toHaveBeenCalledTimes(1)
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ projects: { [process.cwd()]: answers } }))
  })

  it('names the config the project actually has, not the default', async () => {
    using _project = stubProject()

    await resolvePermissions(options, credentials, 'configs/kubb.config.mjs')

    expect(multiselect.mock.calls[0]?.[0].options.map(({ label }) => label)).toContain('Change configs/kubb.config.mjs')
  })

  it('asks nothing again once the project answered, and never stores a flag-granted permission', async () => {
    using project = stubProject()
    const remembered = {
      allowRead: false,
      allowReadAst: false,
      allowWrite: false,
      allowConfigEdit: false,
      allowInstall: false,
      allowUpdate: false,
      allowRemove: false,
      allowSaveInput: false,
      allowFileRefs: false,
      allowExec: false,
    }
    const stored: Credentials = { ...credentials, projects: { [process.cwd()]: remembered } }

    await expect(resolvePermissions({ ...options, permission: { ...options.permission, allowExec: true } }, stored)).resolves.toEqual({
      ...remembered,
      allowExec: true,
    })
    expect(multiselect).not.toHaveBeenCalled()
    expect(project.write).not.toHaveBeenCalled()
  })

  it('asks every permission again on edit, with the saved ones checked, and replaces them', async () => {
    using project = stubProject()
    const stored: Credentials = { ...credentials, projects: { [process.cwd()]: { ...options.permission, allowRead: true, allowWrite: true } } }
    multiselect.mockResolvedValueOnce(['allowRead', 'allowExec'])

    await expect(resolvePermissions(options, stored, undefined, { edit: true })).resolves.toEqual({ ...options.permission, allowRead: true, allowExec: true })
    expect(multiselect.mock.calls[0]?.[0].options).toHaveLength(Object.keys(options.permission).length)
    expect(multiselect.mock.calls[0]?.[0].initialValues).toEqual(['allowRead', 'allowWrite'])
    expect(project.write).toHaveBeenCalledWith(
      expect.objectContaining({ projects: { [process.cwd()]: { ...options.permission, allowRead: true, allowExec: true } } }),
    )
  })

  it('saves nothing when the edit list is canceled', async () => {
    using project = stubProject()
    vi.mocked(prompts.isCancel).mockReturnValueOnce(true)

    await expect(resolvePermissions(options, credentials, undefined, { edit: true })).rejects.toThrow('Permissions are unchanged')
    expect(project.write).not.toHaveBeenCalled()
  })
})

/** Makes stdin look like a terminal without touching the real one. */
function fakeTty() {
  const stdin = process.stdin as NodeJS.ReadStream & { setRawMode?: (mode: boolean) => NodeJS.ReadStream }
  const original = { isTTY: stdin.isTTY, setRawMode: stdin.setRawMode }
  const setRawMode = vi.fn(() => stdin)
  const resume = vi.spyOn(stdin, 'resume').mockImplementation(() => stdin)
  const pause = vi.spyOn(stdin, 'pause').mockImplementation(() => stdin)
  Object.defineProperty(stdin, 'isTTY', { value: true, configurable: true })
  stdin.setRawMode = setRawMode

  return {
    setRawMode,
    [Symbol.dispose]() {
      Object.defineProperty(stdin, 'isTTY', { value: original.isTTY, configurable: true })
      stdin.setRawMode = original.setRawMode
      resume.mockRestore()
      pause.mockRestore()
    },
  }
}

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
    // The token as the socket would read it when it opens.
    calls.push({ ...connectOptions, token: typeof connectOptions.token === 'function' ? await connectOptions.token() : connectOptions.token })
    const attempt = attempts[calls.length - 1]
    if (!attempt) return
    if (attempt === 'connected then rejected') await connectOptions.hooks?.callHook('studio:connected', connected)
    throw new InvalidAgentTokenError(options.studioUrl)
  })

  return calls
}

describe('connect', () => {
  it('forgets a rejected token on a run that cannot pair again, and says how to pair', async () => {
    using project = stubProject({ stored: credentials, ci: true })
    mockConnection('rejected')

    await expect(connect(options)).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_STUDIO_REFUSED', help: 'Run `kubb studio login --url http://localhost:3000` to pair again.' },
    })
    expect(project.clear).toHaveBeenCalled()
  })

  it('leaves --url out of the pairing hint for the hosted Studio', async () => {
    const hosted = { ...options, studioUrl: 'https://kubb.studio' }
    using _project = stubProject({ stored: { ...credentials, studioUrl: hosted.studioUrl }, ci: true })
    mockConnection('rejected')

    await expect(connect(hosted)).rejects.toMatchObject({ diagnostic: { help: 'Run `kubb studio login` to pair again.' } })
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

  it.each([
    ['issued more than a day ago', { issuedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() }],
    ['stored by a release without token refresh', { issuedAt: undefined }],
  ])('refreshes a token %s before it connects, and stores the new one', async (_case, issued) => {
    using project = stubProject({ stored: { ...credentials, ...issued } })
    vi.mocked(renewAgentToken).mockResolvedValueOnce({ token: 'refreshed-token' })
    const calls = mockConnection()
    const onCredentials = vi.fn()

    await connect(options, { onCredentials })

    expect(renewAgentToken).toHaveBeenCalledWith(expect.objectContaining({ studioUrl: options.studioUrl, token: 'token', machineId: 'machine-secret' }))
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'refreshed-token', issuedAt: expect.any(String) }))
    expect(calls.map(({ token }) => token)).toStrictEqual(['refreshed-token'])
    expect(onCredentials).toHaveBeenCalledWith(expect.objectContaining({ token: 'refreshed-token' }))
  })

  it('does not store a refreshed token over credentials another pairing replaced', async () => {
    const stale = { ...credentials, issuedAt: undefined }
    using project = stubProject({ stored: stale })
    vi.mocked(credentialsStore.readCredentials)
      .mockResolvedValueOnce(stale)
      .mockResolvedValue({ ...stale, token: 'paired-elsewhere' })
    vi.mocked(renewAgentToken).mockResolvedValueOnce({ token: 'refreshed-token' })
    mockConnection()

    await connect(options)

    expect(project.write).not.toHaveBeenCalledWith(expect.objectContaining({ token: 'refreshed-token' }))
  })

  it('hands the stored agent key to the connection and the refresh, and connects without one when it has none', async () => {
    using _project = stubProject({ stored: { ...credentials, issuedAt: undefined, privateKey: 'pem' } })
    const calls = mockConnection()

    await connect(options)

    expect(calls[0]?.privateKey).toBe('pem')
    expect(renewAgentToken).toHaveBeenCalledWith(expect.objectContaining({ privateKey: 'pem' }))

    using _old = stubProject({ stored: credentials })
    const old = mockConnection()
    await connect(options)
    expect(old[0]?.privateKey).toBeUndefined()
  })

  it('keeps a token issued within the day, and refreshes it once a day while connected', async () => {
    using project = stubProject({ stored: credentials })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    vi.mocked(renewAgentToken).mockResolvedValueOnce({ token: 'refreshed-token' })
    let readToken: (() => string | Promise<string>) | undefined
    vi.mocked(connectAgent).mockImplementation(async ({ token }) => {
      readToken = token as () => string
      expect(renewAgentToken).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000)
    })

    try {
      await connect(options)
    } finally {
      vi.useRealTimers()
    }

    expect(renewAgentToken).toHaveBeenCalledOnce()
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'refreshed-token' }))
    // The next socket opens with the refreshed token.
    expect(await readToken?.()).toBe('refreshed-token')
  })

  it('trades a rejected token in once before it asks for a new pairing', async () => {
    using project = stubProject({ stored: credentials })
    vi.mocked(renewAgentToken).mockResolvedValueOnce({ token: 'refreshed-token' })
    const calls = mockConnection('rejected')

    await connect(options)

    expect(renewAgentToken).toHaveBeenCalledOnce()
    expect(pairAgent).not.toHaveBeenCalled()
    expect(project.clear).not.toHaveBeenCalled()
    expect(calls.map(({ token }) => token)).toStrictEqual(['token', 'refreshed-token'])
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

  it('prints the agent ID, the project, and its permissions once connected', async () => {
    using _project = stubProject({ stored: { ...credentials, projects: { [process.cwd()]: { allowRead: true, allowReadAst: true } } } })
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((...args) => void lines.push(args.join(' ')))
    vi.mocked(connectAgent).mockImplementation(async ({ hooks }) => {
      await hooks?.callHook('studio:connected', connected)
    })

    await connect(options)

    const printed = lines.map((line) => stripVTControlCharacters(line)).join('\n')
    expect(printed).toContain(`Agent ID  ${credentials.agentId}`)
    expect(printed).toContain(`Project  ${path.basename(process.cwd())}   read source · read spec`)
  })

  it('hands the session to the background worker when b is pressed', async () => {
    using _project = stubProject({ stored: credentials })
    using _tty = fakeTty()
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    using startWorker = vi.spyOn(background, 'startWorker').mockResolvedValue(undefined)
    vi.mocked(connectAgent).mockImplementation(async ({ hooks, signal }) => {
      await hooks?.callHook('studio:connected', connected)
      process.stdin.emit('data', Buffer.from('b'))
      expect(signal?.aborted).toBe(true)
    })

    await connect(options)

    expect(startWorker).toHaveBeenCalledWith(options, expect.any(Function))
  })
})

describe('pairing code', () => {
  const pairingCode = `kubb_pair_${'x'.repeat(43)}`
  const writeOnly = { ...options, permission: { ...options.permission, allowWrite: true } }
  const agent = { id: 'mcp-agent', slug: 'brave-otter', name: 'demo' }

  function captureOutput() {
    const lines: Array<string> = []
    const capture = (...args: Array<unknown>) => void lines.push(args.map(String).join(' '))
    const log = vi.spyOn(console, 'log').mockImplementation(capture)
    const error = vi.spyOn(console, 'error').mockImplementation(capture)
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      capture(chunk)
      return true
    })
    return {
      text: () => lines.join('\n'),
      [Symbol.dispose]() {
        for (const spy of [log, error, stdout]) spy.mockRestore()
      },
    }
  }

  it('redeems the code instead of a browser pairing, stores the token, and connects with the flags alone', async () => {
    vi.stubEnv(PAIRING_CODE_ENV, pairingCode)
    using project = stubProject({ stored: credentials, tty: true })
    using output = captureOutput()
    using open = vi.spyOn(utils, 'openInBrowser').mockImplementation(() => {})
    vi.mocked(redeemPairingCode).mockResolvedValueOnce({ token: 'mcp-token', expiresIn: 3600, agent })
    const calls = mockConnection()

    await connect({ ...writeOnly, autoOpen: true })

    expect(redeemPairingCode).toHaveBeenCalledWith(
      expect.objectContaining({ studioUrl: options.studioUrl, pairingCode, machineId: 'machine-secret', privateKey: expect.stringMatching(/PRIVATE KEY/) }),
    )
    expect(pairAgent).not.toHaveBeenCalled()
    expect(open).not.toHaveBeenCalled()
    // No person is there to answer, so the permission list is never shown.
    expect(multiselect).not.toHaveBeenCalled()
    expect(project.write).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'mcp-token', agentId: 'mcp-agent', pairedWith: 'code', issuedAt: expect.any(String), expiresAt: expect.any(String) }),
    )
    const stored = vi.mocked(project.write).mock.calls[0]![0]
    expect(Date.parse(stored.expiresAt!) - Date.parse(stored.issuedAt!)).toBe(3600 * 1000)
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ token: 'mcp-token', privateKey: stored.privateKey })
    expect(calls[0]?.permissions).toStrictEqual(writeOnly.permission)
    expect(process.env[PAIRING_CODE_ENV]).toBeUndefined()
    expect(output.text()).not.toContain(pairingCode)
  })

  it('takes the code out of the environment, so a second preparation does not send it again', async () => {
    vi.stubEnv(PAIRING_CODE_ENV, pairingCode)
    using _project = stubProject()
    using _output = captureOutput()
    vi.mocked(redeemPairingCode).mockResolvedValueOnce({ token: 'mcp-token', expiresIn: 3600, agent })

    await prepareConnection(writeOnly)
    vi.mocked(credentialsStore.readCredentials).mockResolvedValue({ ...credentials, token: 'mcp-token', pairedWith: 'code' })
    await prepareConnection(writeOnly)

    expect(redeemPairingCode).toHaveBeenCalledOnce()
  })

  it('redeems the code in CI, where a browser pairing is refused', async () => {
    vi.stubEnv(PAIRING_CODE_ENV, pairingCode)
    using _project = stubProject({ ci: true, tty: false })
    using _output = captureOutput()
    vi.mocked(redeemPairingCode).mockResolvedValueOnce({ token: 'mcp-token', expiresIn: 3600, agent })

    await expect(prepareConnection(writeOnly)).resolves.toMatchObject({ credentials: { token: 'mcp-token' } })
  })

  it.each([
    ['invalid_grant', 'already used'],
    ['expired_token', 'expired'],
    ['access_denied', 'MCP agent limit'],
  ] as const)('prints a clear message for %s, exits non-zero, and keeps the code out of the output', async (code, message) => {
    vi.stubEnv(PAIRING_CODE_ENV, pairingCode)
    vi.stubEnv('KUBB_DISABLE_TELEMETRY', '1')
    using project = stubProject()
    using output = captureOutput()
    vi.mocked(redeemPairingCode).mockRejectedValueOnce(new PairingCodeError({ code }))

    await runStudio({ ...writeOnly.permission, logLevel: 'silent' }, (resolved) => connect(resolved))

    expect(process.exitCode).toBe(1)
    process.exitCode = undefined
    expect(output.text()).toContain(message)
    expect(output.text()).not.toContain(pairingCode)
    expect(redeemPairingCode).toHaveBeenCalledOnce()
    expect(pairAgent).not.toHaveBeenCalled()
    expect(project.write).not.toHaveBeenCalled()
  })

  it('refuses a value that is not a pairing code without echoing it', async () => {
    vi.stubEnv(PAIRING_CODE_ENV, 'ghp_not-a-pairing-code')
    using _project = stubProject()

    const error = (await prepareConnection(writeOnly).catch((error: unknown) => error)) as Error

    expect(error.message).toContain('is not a Kubb Studio pairing code')
    expect(error.message).not.toContain('ghp_not-a-pairing-code')
    expect(redeemPairingCode).not.toHaveBeenCalled()
  })

  it('asks for a new code instead of a browser pairing when the token of a code pairing is rejected', async () => {
    using project = stubProject({ stored: { ...credentials, pairedWith: 'code' } })
    using _output = captureOutput()
    mockConnection('rejected', 'rejected')

    await expect(connect(writeOnly)).rejects.toMatchObject({
      diagnostic: { code: 'KUBB_STUDIO_REFUSED', help: 'Ask the MCP client for a new pairing code.' },
    })
    expect(pairAgent).not.toHaveBeenCalled()
    expect(project.clear).toHaveBeenCalledWith('token')
  })
})
