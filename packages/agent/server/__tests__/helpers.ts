import { type ChildProcess, spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { type WebSocket, WebSocketServer } from 'ws'
import type { AgentMessage, CommandMessage } from '../types/agent.ts'

export const AGENT_OUTPUT = path.resolve(import.meta.dirname, '../../.output/server/index.mjs')
export const STARTUP_TIMEOUT = 60_000
export const MESSAGE_TIMEOUT = 8_000

export const MINIMAL_SPEC = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths: {}
`.trim()

export const MINIMAL_CONFIG = `
export default {
  input: { path: './spec.yaml' },
  output: { path: './gen', write: false },
  plugins: [],
}
`.trim()

/** A connect command using the agent's own permissions (agent ignores the permissions field). */
export const connectCmd: CommandMessage = { type: 'command', command: 'connect', permissions: { allowAll: false, allowWrite: false } }

export type MockStudio = {
  port: number
  agentWs: () => WebSocket | null
  waitForConnection: () => Promise<void>
  waitForMessage<T extends AgentMessage>(predicate: (msg: AgentMessage) => msg is T): Promise<T>
  waitForMessage(predicate: (msg: AgentMessage) => boolean): Promise<AgentMessage>
  send: (msg: AgentMessage) => void
  clearMessages: () => void
  close: () => Promise<void>
}

export function createMockStudio({ isSandbox = false } = {}): Promise<MockStudio> {
  return new Promise((resolve) => {
    const _messages: AgentMessage[] = []
    const _messageListeners: Array<(msg: AgentMessage) => void> = []
    let _connectionResolve: (() => void) | null = null
    const _connectionPromise = new Promise<void>((res) => {
      _connectionResolve = res
    })

    const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
      let _body = ''
      req.on('data', (chunk) => {
        _body += chunk
      })
      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'POST' && req.url === '/api/agent/register') {
          res.writeHead(200)
          res.end(JSON.stringify({ success: true }))
          return
        }

        if (req.method === 'POST' && req.url === '/api/agent/session/create') {
          const port = (httpServer.address() as { port: number }).port
          // Use a unique token per request so pool connections get independent sessions
          const token = `e2e-session-${Date.now()}-${Math.random().toString(36).slice(2)}`
          res.writeHead(200)
          res.end(
            JSON.stringify({
              sessionToken: token,
              wsUrl: `ws://127.0.0.1:${port}/api/ws/session/${token}`,
              expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
              revokedAt: null,
              isSandbox,
            }),
          )
          return
        }

        if (req.method === 'POST' && req.url?.includes('/disconnect')) {
          res.writeHead(200)
          res.end(JSON.stringify({ message: 'Agent session disconnected successfully' }))
          return
        }

        res.writeHead(404)
        res.end()
      })
    })

    const wss = new WebSocketServer({ server: httpServer })
    const agentSockets = new Set<WebSocket>()

    wss.on('connection', (ws) => {
      agentSockets.add(ws)
      ws.on('close', () => agentSockets.delete(ws))
      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString()) as AgentMessage
          _messages.push(msg)
          _messageListeners.forEach((fn) => {
            fn(msg)
          })
        } catch {}
      })
      _connectionResolve?.()
    })

    httpServer.listen(0, '127.0.0.1', () => {
      const { port } = httpServer.address() as { port: number }

      resolve({
        port,
        // Return the first (oldest) connected socket for backwards compatibility
        agentWs: () => agentSockets.values().next().value ?? null,
        waitForConnection: () => _connectionPromise,
        waitForMessage(predicate) {
          return new Promise<AgentMessage>((res, rej) => {
            const existing = _messages.find(predicate)
            if (existing) {
              res(existing)
              return
            }
            const timer = setTimeout(() => rej(new Error('Timeout waiting for agent message')), MESSAGE_TIMEOUT)
            _messageListeners.push((msg) => {
              if (predicate(msg)) {
                clearTimeout(timer)
                res(msg)
              }
            })
          })
        },
        // Broadcast to all connected agent sockets
        send(msg) {
          const payload = JSON.stringify(msg)
          for (const ws of agentSockets) {
            ws.send(payload)
          }
        },
        clearMessages() {
          _messages.length = 0
        },
        close() {
          return new Promise((res) => {
            wss.close()
            httpServer.close(() => res())
          })
        },
      })
    })
  })
}

export type AgentOptions = {
  studioPort: number
  tmpDir: string
  allowWrite?: boolean
  allowAll?: boolean
  retryTimeout?: number
  heartbeatInterval?: number
  poolSize?: number
}

export function spawnAgent({
  studioPort,
  tmpDir,
  allowWrite = false,
  allowAll = false,
  retryTimeout = 2000,
  heartbeatInterval = 200,
  poolSize = 1,
}: AgentOptions): ChildProcess {
  return spawn('node', [AGENT_OUTPUT], {
    env: {
      ...process.env,
      PORT: '0',
      KUBB_AGENT_TOKEN: 'e2e-test-token',
      KUBB_STUDIO_URL: `http://127.0.0.1:${studioPort}`,
      KUBB_AGENT_CONFIG: path.join(tmpDir, 'kubb.config.js'),
      KUBB_AGENT_ROOT: tmpDir,
      KUBB_AGENT_ALLOW_WRITE: String(allowWrite),
      KUBB_AGENT_ALLOW_ALL: String(allowAll),
      KUBB_AGENT_RETRY_TIMEOUT: String(retryTimeout),
      KUBB_AGENT_HEARTBEAT_INTERVAL: String(heartbeatInterval),
      KUBB_AGENT_NO_CACHE: 'true',
      KUBB_AGENT_POOL_SIZE: String(poolSize),
    },
    stdio: 'pipe',
  })
}

export function waitForAgentReady(proc: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Agent process did not start in time')), STARTUP_TIMEOUT)
    const onData = (chunk: Buffer) => {
      if (chunk.toString().includes('Listening')) {
        clearTimeout(timer)
        resolve()
      }
    }
    proc.stdout?.on('data', onData)
    proc.stderr?.on('data', onData)
    proc.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })
  })
}

export function makeTmpDir(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'kubb-agent-e2e-'))
  writeFileSync(path.join(dir, 'kubb.config.js'), MINIMAL_CONFIG)
  writeFileSync(path.join(dir, 'spec.yaml'), MINIMAL_SPEC)
  return dir
}
