import WebSocket from 'ws'

type WebSocketOptions = WebSocket.ClientOptions

const CONNECT_TIMEOUT_MS = 5_000

/**
 * Opens a Studio WebSocket connection and closes it when the initial handshake exceeds the configured timeout.
 */
export function createWebsocket(url: string, options: WebSocketOptions): WebSocket {
  const ws = new WebSocket(url, options)

  const timer = setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      ws.close(3008, 'Connection timeout')
    }
  }, CONNECT_TIMEOUT_MS)

  // Once the handshake settles the timer has nothing left to check, and leaving it pending holds
  // the socket for the rest of the window.
  ws.once('open', () => clearTimeout(timer))
  ws.once('close', () => clearTimeout(timer))

  return ws
}
