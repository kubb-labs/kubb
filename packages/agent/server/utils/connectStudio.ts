import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { Config, InfoResponse, KubbEvents, LogLevel } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { serializePluginOptions } from '@kubb/core/utils'
import { generate } from '~/utils/generate.ts'
import { version } from '~~/package.json'
import type { AgentConnectResponse, AgentMessage, ConnectedMessage, PingMessage } from '../types/agent.ts'
import { useKubbAgentContext } from './useKubbAgentContext.ts'

const WEBSOCKET_READY = 1
const WEBSOCKET_CONNECTING = 0

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

type ConnectStudioProps = {
  configPath: string
  config: Config
  events: AsyncEventEmitter<KubbEvents>
  logLevel: (typeof LogLevel)[keyof typeof LogLevel]
  studioUrl: string
  token: string
}

export async function connectStudio({ config, studioUrl, token, events, logLevel }: ConnectStudioProps): Promise<WebSocket | null> {
  try {
    const connectUrl = `${studioUrl}/api/agent/connect`

    const data = await $fetch<AgentConnectResponse>(connectUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const wsOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    // Read OpenAPI spec if available
    let specContent: string | undefined
    if (config && 'path' in config.input) {
      const specPath = path.resolve(process.cwd(), config.root, config.input.path)
      try {
        specContent = readFileSync(specPath, 'utf-8')
      } catch {
        // Spec file not found or unreadable
      }
    }

    const infoResponse: InfoResponse = {
      version,
      configPath: process.env.KUBB_CONFIG || '',
      spec: specContent,
      config: {
        name: config.name,
        root: config.root,
        input: {
          path: 'path' in config.input ? config.input.path : undefined,
        },
        output: {
          path: config.output.path,
          write: config.output.write,
          extension: config.output.extension,
          barrelType: config.output.barrelType,
        },
        plugins: config.plugins?.map((plugin: any) => ({
          name: `@kubb/${plugin.name}`,
          options: serializePluginOptions(plugin.options),
        })),
      },
    }

    function sendConnectedMessage(ws: WebSocket) {
      try {
        const message: ConnectedMessage = {
          type: 'connected',
          id: generateId(),
          payload: infoResponse,
        }

        ws.send(JSON.stringify(message))

        console.log('Sent connected message to Kubb Studio')
      } catch (error) {
        console.warn('Failed to send info message to studio:', error)
      }
    }

    function sendPingMessage(ws: WebSocket) {
      try {
        const message: PingMessage = {
          type: 'ping',
        }

        ws.send(JSON.stringify(message))

        console.log('Sent ping message')
      } catch (error) {
        console.warn('Failed to send info message to studio:', error)
      }
    }

    async function createWebsocker() {
      return new Promise<WebSocket>((resolve) => {
        const ws = new WebSocket(data.wsUrl, wsOptions)

        const onOpen = () => {
          console.log(`Connected to Kubb Studio on ${data.wsUrl}`)

          ws.removeEventListener('open', onOpen)
          ws.removeEventListener('error', onError)
          resolve(ws)
        }

        const onError = (error: Event) => {
          console.warn('Failed to connect to Kubb Studio:', error)
          ws.removeEventListener('open', onOpen)
          ws.removeEventListener('error', onError)
          resolve(null)
        }

        ws.addEventListener('open', onOpen)
        ws.addEventListener('error', onError)

        // Timeout after 5 seconds
        setTimeout(() => {
          if (ws.readyState === WEBSOCKET_CONNECTING) {
            ws.close()
            resolve(null)
          }
        }, 5000)
      })
    }

    const ws = await createWebsocker()
    sendConnectedMessage(ws)

    setInterval(() => {
      sendPingMessage(ws)
    }, 30000)

    ws.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data) as AgentMessage

      switch (data.type) {
        case 'command':
          if (data.command === 'generate') {
            console.log('Generated command')
            await generate({
              config,
              events,
              logLevel,
            })
            console.log('Generated command success')
            // Handle generate command if needed
          }
          break

        default:
          console.warn('Unknown message type from Kubb Studio:', data)
      }
    })
  } catch (error) {
    console.warn('Error connecting to Kubb Studio:', error)
    return null
  }
}

export function sendMessage(message: Record<string, unknown>): void {
  try {
    const context = useKubbAgentContext()
    if (context.ws && context.ws.readyState === WEBSOCKET_READY) {
      context.ws.send(JSON.stringify(message))
    }
  } catch (error) {
    console.warn('Failed to send message to studio:', error)
  }
}
