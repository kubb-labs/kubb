import { describe, expect, it } from 'vitest'
import type { AgentApi } from '../protocol/index.ts'
import { connectWebSocketRpc } from './rpc.ts'

const local = {} as AgentApi

describe('connectWebSocketRpc', () => {
  it('refuses a plaintext WebSocket to a remote host', async () => {
    await expect(connectWebSocketRpc({ url: 'ws://studio.example.com/s/1', token: 'secret', instanceId: 'instance-1', local })).rejects.toThrow(
      'Refusing unencrypted WebSocket to studio.example.com',
    )
  })

  // A port nothing binds, so this can't reach a real dev server on 3000.
  it.each(['ws://localhost:39847/s/1', 'ws://127.0.0.1:39847/s/1', 'ws://[::1]:39847/s/1'])('allows plaintext to the loopback host %s', async (url) => {
    const connection = await connectWebSocketRpc({ url, token: 'secret', instanceId: 'instance-1', local })
    connection.close()
  })
})
