import type { InfoResponse } from '@kubb/core'
import ws from 'ws'
import type { InfoMessage } from '../types/agent.ts'
import { useKubbAgentContext } from './useKubbAgentContext.ts'

type WebSocketLike = {
  send(data: string): void
  addEventListener(event: string, callback: (event: Event) => void): void
  removeEventListener(event: string, callback: (event: Event) => void): void
  close(): void
  readyState: number
}

const WEBSOCKET_READY = 1
const WEBSOCKET_CONNECTING = 0

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export async function connectStudio(studioUrl: string): Promise<WebSocketLike | null> {
  try {
    if (!studioUrl) {
      console.warn('KUBB_STUDIO_URL not set, skipping studio connection')
      return null
    }

    const token = process.env.KUBB_AGENT_TOKEN
    if (!token) {
      console.warn('KUBB_AGENT_TOKEN not set, cannot authenticate with studio')
      return null
    }

    // Convert http(s) to ws(s)
    const wsUrl = studioUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/api/agent/connect'

    const wsOptions = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    console.log(wsOptions, wsUrl)

    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl, wsOptions) as WebSocketLike

      const onOpen = () => {
        console.log('Connected to Kubb Studio')

        // Send initial info message
        try {
          const context = useKubbAgentContext()
          const infoPayload: InfoResponse = {
            version: context.config.root || 'unknown',
            configPath: process.env.KUBB_CONFIG || '',
            config: {
              name: context.config.name,
              root: context.config.root || '',
              input: {
                path:
                  typeof context.config.input === 'object' && !Array.isArray(context.config.input) && 'path' in context.config.input
                    ? (context.config.input as { path?: string }).path
                    : undefined,
              },
              output: {
                path: context.config.output?.path || '',
                write: context.config.output?.write,
                extension: (context.config.output as any)?.extension,
                barrelType: (context.config.output as any)?.barrelType,
              },
            },
          }

          const infoMessage: InfoMessage = {
            type: 'info',
            id: generateId(),
            payload: infoPayload,
          }

          ws.send(JSON.stringify(infoMessage))
        } catch (error) {
          console.warn('Failed to send info message to studio:', error)
        }

        // Store WebSocket in context
        try {
          const context = useKubbAgentContext()
          context.ws = ws
        } catch (error) {
          console.warn('Failed to store WebSocket in context:', error)
        }

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
