import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { Config, InfoResponse, KubbEvents, LogLevel } from '@kubb/core'
import type { AsyncEventEmitter } from '@kubb/core/utils'
import { serializePluginOptions } from '@kubb/core/utils'
import { version } from '~~/package.json'
import type { AgentConnectResponse, InfoMessage } from '../types/agent.ts'
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

export async function connectStudio({ config, studioUrl, token }: ConnectStudioProps): Promise<WebSocket | null> {
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

    function sendInfoMessage(ws: WebSocket) {
      try {
        const infoMessage: InfoMessage = {
          type: 'info',
          id: generateId(),
          payload: infoResponse,
        }

        ws.send(JSON.stringify(infoMessage))

        console.log(`Sent info message to Kubb Studio ${JSON.stringify(infoMessage, null, 2)}`)
      } catch (error) {
        console.warn('Failed to send info message to studio:', error)
      }
    }

    return new Promise((resolve) => {
      const ws = new WebSocket(data.wsUrl, wsOptions)

      const onOpen = () => {
        console.log(`Connected to Kubb Studio on ${data.wsUrl}`)

        sendInfoMessage(ws)

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
