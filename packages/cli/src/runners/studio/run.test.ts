import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { stripVTControlCharacters } from 'node:util'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as prompts from '@clack/prompts'
import * as utils from '@internals/utils'
import type { Config } from '@kubb/core'
import { type ConnectAgentOptions, connectAgent, InvalidAgentTokenError, PairingCanceledError, pairAgent } from '@kubb/studio'
import * as env from '../../utils/env.ts'
import * as config from '../../config.ts'
import * as credentialsStore from './credentials.ts'
import type { Credentials } from './credentials.ts'
import * as background from './background.ts'
import { connect, login, resolvePermissions, type StudioOptions } from './run.ts'

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
    allowExec: false,
  },
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
  const copy = vi.spyOn(utils, 'copyToClipboard').mockResolvedValue(true)
  multiselect.mockResolvedValue([])

  return {
    write,
    clear,
    copy,
    [Symbol.dispose]() {
      for (const spy of [read, write, clear, machineId, configs, isCI, canUseTTY, copy]) {
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

describe('login', () => {
  it('pairs this machine as a cli agent and stores the approved token', async () => {
    using project = stubProject()
    using _log = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockPairing()

    await expect(login(options)).resolves.toMatchObject({ token: 'new-token', agentId: credentials.agentId })
    expect(pairAgent).toHaveBeenCalledWith(expect.objectContaining({ type: 'cli', studioUrl: options.studioUrl, machineId: 'machine-secret' }))
    expect(project.write).toHaveBeenCalledWith(expect.objectContaining({ token: 'new-token' }))
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

  it('prints the project and its permissions once connected', async () => {
    using _project = stubProject({ stored: { ...credentials, projects: { [process.cwd()]: { allowRead: true, allowReadAst: true } } } })
    const lines: Array<string> = []
    using _log = vi.spyOn(console, 'log').mockImplementation((...args) => void lines.push(args.join(' ')))
    vi.mocked(connectAgent).mockImplementation(async ({ hooks }) => {
      await hooks?.callHook('studio:connected', connected)
    })

    await connect(options)

    expect(lines.map((line) => stripVTControlCharacters(line)).join('\n')).toContain(`Project  ${path.basename(process.cwd())}   read source · read spec`)
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

    expect(startWorker).toHaveBeenCalledWith(options)
  })
})
