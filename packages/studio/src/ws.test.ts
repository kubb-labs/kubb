import { Hookable, memoryStorage, type Config, type KubbHooks, type KubbPluginStartContext } from '@kubb/core'
import type WebSocket from 'ws'
import { describe, expect, it, vi } from 'vitest'
import type { AgentMessage } from './protocol/index.ts'
import { setupEventsStream } from './ws.ts'

/**
 * `sendAgentMessage` only needs a socket that reports OPEN and records what it was handed, so the
 * fake stays smaller than `MockWebSocket` (which has no `send`).
 */
function fakeSocket() {
  const send = vi.fn()

  return {
    send,
    ws: { readyState: 1, send } as unknown as WebSocket,
    sent(): Array<AgentMessage> {
      return send.mock.calls.map(([frame]) => JSON.parse(frame as string) as AgentMessage)
    },
  }
}

describe('setupEventsStream', () => {
  it('forwards a generation event as an agent:data envelope around its kubb: payload', async () => {
    const socket = fakeSocket()
    const hooks = new Hookable<KubbHooks>()
    setupEventsStream(socket.ws, hooks, 'job-1')

    await hooks.callHook('kubb:plugin:start', { plugin: { name: 'plugin-ts' } as unknown as KubbPluginStartContext['plugin'] })

    expect(socket.sent()).toStrictEqual([
      {
        type: 'agent:data',
        jobId: 'job-1',
        payload: { type: 'kubb:plugin:start', data: [{ plugin: { name: 'plugin-ts' } }], timestamp: expect.any(Number), seq: 0 },
      },
    ])
  })

  it('keeps session events off the wire', async () => {
    const socket = fakeSocket()
    const hooks = new Hookable<KubbHooks>()
    setupEventsStream(socket.ws, hooks, 'job-1')

    // `studio:*` narrates the connection for whoever is running the agent. Studio has its own view
    // of the session, so forwarding these would duplicate it and leak local paths and remedies.
    // `setupEventsStream` subscribes to hook names one by one, so one event proves the namespace.
    await hooks.callHook('studio:warn', { message: 'Ignored save: editing kubb.config.ts was not granted' })

    expect(socket.send).not.toHaveBeenCalled()
  })

  it('sends kubb:generation:end with no file, config or dependency data', async () => {
    const socket = fakeSocket()
    const hooks = new Hookable<KubbHooks>()
    setupEventsStream(socket.ws, hooks, 'job-1')
    const config = {
      root: '/project',
      plugins: [{ name: '@kubb/core' }, { name: '@kubb/missing-plugin' }, { name: '@kubb/core' }],
    } as Config

    await hooks.callHook('kubb:generation:end', {
      config,
      storage: memoryStorage(),
    })

    expect(socket.sent()).toStrictEqual([
      {
        type: 'agent:data',
        jobId: 'job-1',
        payload: {
          type: 'kubb:generation:end',
          data: [],
          timestamp: expect.any(Number),
          seq: 0,
        },
      },
    ])
  })

  it('hands the generated files, peer dependencies and missing dependencies to onGenerationEnd instead of the wire', async () => {
    const socket = fakeSocket()
    const hooks = new Hookable<KubbHooks>()
    const onGenerationEnd = vi.fn()
    setupEventsStream(socket.ws, hooks, 'job-1', { onGenerationEnd })
    const config = {
      root: '/project',
      plugins: [{ name: '@kubb/core' }, { name: '@kubb/missing-plugin' }, { name: '@kubb/core' }],
    } as Config

    await hooks.callHook('kubb:generation:end', {
      config,
      storage: {
        readKeys: async () => ['/project/src/index.ts'],
        readItem: async () => 'export {}',
      } as never,
    })

    expect(onGenerationEnd).toHaveBeenCalledWith({
      files: { 'src/index.ts': 'export {}' },
      peerDependencies: { '@kubb/core': expect.any(String) },
      missingDependencies: ['@kubb/missing-plugin'],
    })
  })

  it('sends kubb:build:end paths relative to the project root, matching studio:files keys', async () => {
    const socket = fakeSocket()
    const hooks = new Hookable<KubbHooks>()
    setupEventsStream(socket.ws, hooks, 'job-1')

    await hooks.callHook('kubb:build:end', {
      config: { root: '/home/runner/work/plugins/plugins/examples/advanced' } as unknown as Config,
      files: [{ path: '/home/runner/work/plugins/plugins/examples/advanced/src/gen/index.ts', name: 'index' }] as never,
      outputDir: '/home/runner/work/plugins/plugins/examples/advanced/src/gen',
    })

    expect(socket.sent()[0]).toMatchObject({
      payload: { data: [{ files: [{ path: 'src/gen/index.ts', name: 'index' }] }] },
    })
  })

  it('round-trips kubb:build:end paths through onGenerationEnd, so a fetched path matches the tree', async () => {
    const socket = fakeSocket()
    const hooks = new Hookable<KubbHooks>()
    const onGenerationEnd = vi.fn()
    setupEventsStream(socket.ws, hooks, 'job-1', { onGenerationEnd })
    const config = { root: '/project', plugins: [] } as unknown as Config

    await hooks.callHook('kubb:build:end', {
      config,
      files: [{ path: '/project/src/gen/index.ts', name: 'index' }] as never,
      outputDir: '/project/src/gen',
    })

    const treePath = (socket.sent()[0] as { payload: { data: [{ files: Array<{ path: string }> }] } }).payload.data[0].files[0]?.path

    await hooks.callHook('kubb:generation:end', {
      config,
      storage: {
        readKeys: async () => ['/project/src/gen/index.ts'],
        readItem: async () => 'export {}',
      } as never,
    })

    expect(onGenerationEnd).toHaveBeenCalledWith(expect.objectContaining({ files: { [treePath as string]: 'export {}' } }))
  })
})
