import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { type Config, memoryStorage } from '@kubb/core'
import { adapterOas } from '@kubb/adapter-oas'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WebSocketServer, type WebSocket } from 'ws'
import { createClient } from './index.ts'
import type { AgentMessage, ConnectedMessage, DataMessage } from './protocol/index.ts'

/**
 * A Kubb Studio small enough to run in a test: the two REST calls an agent makes on startup, and
 * the session socket it then talks over. Everything the client does is real — the HTTP requests,
 * the WebSocket frames, the generation.
 */
type FakeStudioOptions = {
  /**
   * How many session-create calls to answer with a 403 before succeeding. Studio replies this way
   * when the stored machine token no longer matches the agent.
   */
  rejectMachineToken?: number
}

function createFakeStudio({ rejectMachineToken = 0 }: FakeStudioOptions = {}) {
  const sockets: Array<WebSocket> = []
  const received: Array<AgentMessage> = []
  const calls: Array<string> = []
  let rejectionsLeft = rejectMachineToken

  const wss = new WebSocketServer({ noServer: true })
  const server: Server = createServer((req, res) => {
    // The POST body is not read, but it still has to be drained before `end` fires.
    req.resume()
    req.on('end', () => {
      res.setHeader('content-type', 'application/json')
      calls.push(req.url ?? '')

      if (req.url === '/api/agent/connect') {
        return res.end(JSON.stringify({ success: true }))
      }

      if (req.url === '/api/agent/session/create') {
        if (rejectionsLeft > 0) {
          rejectionsLeft--
          res.statusCode = 403

          return res.end(JSON.stringify({ message: 'machine token mismatch' }))
        }

        const { port } = server.address() as AddressInfo

        return res.end(
          JSON.stringify({
            sessionId: 'session-1',
            slug: 'brave-otter',
            wsUrl: `ws://127.0.0.1:${port}/api/ws/session/session-1`,
            expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
            revokedAt: null,
            isSandbox: false,
          }),
        )
      }

      res.end('{}')
    })
  })

  server.on('upgrade', (req, duplex, head) => {
    wss.handleUpgrade(req, duplex, head, (ws) => {
      sockets.push(ws)
      ws.on('message', (raw) => {
        received.push(JSON.parse(String(raw)) as AgentMessage)
      })
    })
  })

  return {
    received,
    calls,
    async listen(): Promise<string> {
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

      return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    },
    async close() {
      sockets.forEach((ws) => ws.close())
      wss.close()
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
    /**
     * Sends to every attached agent. With a pool each slot has its own socket, and a command Studio
     * broadcasts reaches all of them.
     */
    send(message: unknown) {
      sockets.forEach((ws) => ws.send(JSON.stringify(message)))
    },
    /**
     * Resolves once the agent has sent a message matching `predicate`, so tests wait on the socket
     * rather than on a timer.
     */
    waitFor<T extends AgentMessage>(predicate: (message: AgentMessage) => message is T): Promise<T> {
      return vi.waitFor(() => {
        const match = received.find(predicate)
        if (!match) {
          throw new Error(`No message from the agent matched. Received: ${received.map((message) => message.type).join(', ') || 'nothing'}`)
        }

        return match
      })
    },
  }
}

const spec = JSON.stringify({
  openapi: '3.0.0',
  info: { title: 'Pets', version: '1.0.0' },
  paths: { '/pets': { get: { operationId: 'listPets', responses: { '200': { description: 'ok' } } } } },
})

/**
 * What a project's `kubb.config.ts` resolves to. Nothing is written to disk: the client is
 * read-only unless a host grants otherwise, so `storage` stays in memory.
 */
function projectConfig(): Config {
  return {
    root: process.cwd(),
    input: spec,
    output: { path: './gen', write: false },
    storage: memoryStorage(),
    adapter: adapterOas({}),
    plugins: [],
  } as unknown as Config
}

const isConnected = (message: AgentMessage): message is ConnectedMessage => message.type === 'connected'
const isEnd = (message: AgentMessage): message is DataMessage => message.type === 'data' && message.payload.type === 'kubb:generation:end'
const isError = (message: AgentMessage): message is DataMessage => message.type === 'data' && message.payload.type === 'kubb:error'

describe('createClient against a Studio instance', () => {
  let studio: ReturnType<typeof createFakeStudio>
  let client: ReturnType<typeof createClient> | undefined

  beforeEach(() => {
    studio = createFakeStudio()
  })

  afterEach(async () => {
    client?.disconnect()
    client = undefined
    await studio.close()
  })

  async function connect(options: Partial<Parameters<typeof createClient>[0]> = {}) {
    const studioUrl = await studio.listen()

    client = createClient({
      token: 'test-token',
      studioUrl,
      configPath: 'kubb.config.ts',
      version: '0.0.0-test',
      loadConfig: async () => projectConfig(),
      ...options,
    })

    await client.connect()

    return studio.waitFor(isConnected)
  }

  it('registers, opens a session, and introduces itself with the local config', async () => {
    const connected = await connect()

    expect(connected.payload.configPath).toBe('kubb.config.ts')
    expect(connected.payload.versions?.agent).toBe('0.0.0-test')
    expect(studio.calls).toStrictEqual(['/api/agent/connect', '/api/agent/session/create'])
  })

  // Studio answers 403 when its stored machine token no longer matches, which happens whenever a
  // restart raced a failed registration. One re-register and retry has to recover it, or the agent
  // can never open a session again.
  it('re-registers and retries once when Studio rejects the machine token', async () => {
    studio = createFakeStudio({ rejectMachineToken: 1 })

    await connect()

    expect(studio.calls).toStrictEqual(['/api/agent/connect', '/api/agent/session/create', '/api/agent/connect', '/api/agent/session/create'])
  })

  it('is read-only until a host grants otherwise', async () => {
    const connected = await connect()

    expect(connected.payload.permissions).toMatchObject({ allowWrite: false, allowInput: false, allowExec: false })
  })

  it('runs a generation and streams it back to Studio', async () => {
    await connect()

    studio.send({ type: 'command', command: 'generate', payload: { plugins: [] } })

    await studio.waitFor(isEnd)

    const types = studio.received.filter((message) => message.type === 'data').map((message) => (message as DataMessage).payload.type)

    expect(types).toContain('kubb:generation:start')
    expect(types).toContain('kubb:build:start')
    expect(types).toContain('kubb:generation:end')
  })

  // The allow-list has to reject the payload *before* resolution reaches `import(name)`. Asserting
  // on the message rather than on "some error happened" is what tells the two apart: without the
  // allow-list the same payload still fails, just later, from the import itself.
  it('refuses a plugin the local config does not import, before importing it', async () => {
    await connect({ allowedPlugins: ['@kubb/plugin-ts'] })

    studio.send({ type: 'command', command: 'generate', payload: { plugins: [{ name: 'evil-module', options: {} }] } })

    const error = await studio.waitFor(isError)

    expect((error.payload.data[0] as { message: string }).message).toContain('the local Kubb config does not import')
  })

  it('reaches the import, and fails there, when no allow-list is set', async () => {
    await connect()

    studio.send({ type: 'command', command: 'generate', payload: { plugins: [{ name: 'evil-module', options: {} }] } })

    const error = await studio.waitFor(isError)

    expect((error.payload.data[0] as { message: string }).message).toContain('could not be loaded')
  })
})
