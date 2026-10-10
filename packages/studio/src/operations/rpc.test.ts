import { createHash } from 'node:crypto'
import { createServer, type IncomingHttpHeaders } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { AGENT_INSTANCE_HEADER, type AgentApi } from '../protocol/index.ts'
import { connectWebSocketRpc } from './rpc.ts'

const local = {} as AgentApi

/** A WebSocket endpoint that, like Studio's agent socket, accepts only `Bearer good` and then closes with 1000. */
async function startStudioSocket(): Promise<{ url: string; seen: Array<IncomingHttpHeaders>; close: () => void }> {
  const seen: Array<IncomingHttpHeaders> = []
  const server = createServer()
  server.on('upgrade', (req, socket) => {
    seen.push(req.headers)
    if (req.headers.authorization !== 'Bearer good') {
      socket.end('HTTP/1.1 401 Unauthorized\r\nContent-Length: 0\r\n\r\n')
      return
    }
    const accept = createHash('sha1').update(`${req.headers['sec-websocket-key']}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest('base64')
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)
    socket.end(Buffer.from([0x88, 0x02, 0x03, 0xe8]))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  return { url: `ws://127.0.0.1:${port}/s/1`, seen, close: () => server.close() }
}

let studioSocket: Awaited<ReturnType<typeof startStudioSocket>> | undefined

afterEach(() => {
  studioSocket?.close()
  studioSocket = undefined
})

describe('connectWebSocketRpc', () => {
  it('refuses a plaintext WebSocket to a remote host', async () => {
    await expect(connectWebSocketRpc({ url: 'ws://studio.example.com/s/1', token: 'secret', instanceId: 'instance-1', local })).rejects.toThrow(
      'Refusing unencrypted WebSocket to studio.example.com',
    )
  })

  // A port nothing binds, so this can't reach a real dev server on 3000: the URL passes the
  // loopback check, then the socket fails to connect and closes abnormally (1006).
  it.each(['ws://localhost:39847/s/1', 'ws://127.0.0.1:39847/s/1', 'ws://[::1]:39847/s/1'])('allows plaintext to the loopback host %s', async (url) => {
    const connection = await connectWebSocketRpc({ url, token: 'secret', instanceId: 'instance-1', local })
    connection.close()

    await expect(connection.closed).resolves.toStrictEqual({ code: 1006, reason: '' })
  })

  it('sends the bearer token and instance id on the handshake', async () => {
    studioSocket = await startStudioSocket()

    const connection = await connectWebSocketRpc({ url: studioSocket.url, token: 'good', instanceId: 'instance-1', local })

    await expect(connection.closed).resolves.toStrictEqual({ code: 1000, reason: '' })
    expect(studioSocket.seen[0]).toMatchObject({ authorization: 'Bearer good', [AGENT_INSTANCE_HEADER]: 'instance-1' })
  })

  it('closes with 1006 when Studio rejects the token on the handshake', async () => {
    studioSocket = await startStudioSocket()

    const connection = await connectWebSocketRpc({ url: studioSocket.url, token: 'bad', instanceId: 'instance-1', local })

    await expect(connection.closed).resolves.toStrictEqual({ code: 1006, reason: '' })
    expect(studioSocket.seen[0]).toMatchObject({ authorization: 'Bearer bad' })
  })
})
