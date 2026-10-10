import { newWebSocketRpcSession, RpcTarget } from 'capnweb'
import type {
  AgentApi,
  GenerateInput,
  PublishSnapshotInput,
  ReadFilesInput,
  RpcClose,
  RpcConnection,
  RpcConnector,
  SaveConfigInput,
  StudioApi,
} from '../protocol/index.ts'
import { AGENT_INSTANCE_HEADER } from '../protocol/index.ts'
import { isLoopbackHost } from './url.ts'

const CONNECT_TIMEOUT_MS = 5_000

/**
 * The only methods Studio may call on an agent. A `StudioSession` carries far more than
 * {@link AgentApi}, so it is wrapped rather than exposed: what Cap'n Web can reach is exactly what
 * this class re-declares.
 */
class AgentRpcTarget extends RpcTarget implements AgentApi {
  constructor(private readonly api: AgentApi) {
    super()
  }

  connect() {
    return this.api.connect()
  }
  startGeneration(input: GenerateInput) {
    return this.api.startGeneration(input)
  }
  saveConfig(input: SaveConfigInput) {
    return this.api.saveConfig(input)
  }
  publishSnapshot(input: PublishSnapshotInput) {
    return this.api.publishSnapshot(input)
  }
  readFiles(input: ReadFilesInput) {
    return this.api.readFiles(input)
  }
  cancel(jobId: string) {
    return this.api.cancel(jobId)
  }
}

/** Node's `WebSocket` takes undici's `headers` option, which the DOM typing leaves out. */
type NodeWebSocket = new (url: string, init: { headers: Record<string, string> }) => WebSocket

/**
 * Opens a Studio WebSocket and closes it when the handshake exceeds {@link CONNECT_TIMEOUT_MS}.
 * `closed` settles once the socket is gone. Node fires no `close` event when the handshake itself
 * fails, only `error`, so that case settles as an abnormal closure (1006).
 */
function openSocket({ url, headers }: { url: string; headers: Record<string, string> }): { socket: WebSocket; closed: Promise<RpcClose> } {
  const socket = new (WebSocket as unknown as NodeWebSocket)(url, { headers })

  const closed = new Promise<RpcClose>((resolve) => {
    let opened = false
    const timer = setTimeout(() => {
      if (socket.readyState === WebSocket.CONNECTING) {
        socket.close(3008, 'Connection timeout')
      }
    }, CONNECT_TIMEOUT_MS)

    socket.addEventListener(
      'open',
      () => {
        opened = true
        clearTimeout(timer)
      },
      { once: true },
    )
    socket.addEventListener(
      'close',
      (event) => {
        clearTimeout(timer)
        resolve({ code: event.code, reason: event.reason })
      },
      { once: true },
    )
    socket.addEventListener('error', () => {
      if (opened) return
      clearTimeout(timer)
      resolve({ code: 1006, reason: '' })
    })
  })

  return { socket, closed }
}

/**
 * Opens an authenticated Cap'n Web session to Studio over a WebSocket. Rejects an unencrypted URL
 * before opening the socket, so a bearer token never reaches a plaintext host.
 *
 * @example
 * ```ts
 * const rpc = await connectWebSocketRpc({ url: 'wss://studio.kubb.dev/s/1', token, local: session })
 * await rpc.studio.ping()
 * ```
 */
export const connectWebSocketRpc: RpcConnector = async ({ url, token, instanceId, local }): Promise<RpcConnection> => {
  const { protocol, hostname, host } = new URL(url)
  if (protocol !== 'wss:' && !(protocol === 'ws:' && isLoopbackHost(hostname))) {
    throw new Error(`Refusing unencrypted WebSocket to ${host}`)
  }

  const { socket, closed } = openSocket({ url, headers: { Authorization: `Bearer ${token}`, [AGENT_INSTANCE_HEADER]: instanceId } })
  const studio = newWebSocketRpcSession<StudioApi>(socket, new AgentRpcTarget(local))
  studio.onRpcBroken(() => socket.close())

  return {
    studio,
    closed,
    close: () => studio[Symbol.dispose](),
  }
}
