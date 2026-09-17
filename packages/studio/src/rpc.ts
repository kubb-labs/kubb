import { newWebSocketRpcSession, RpcTarget } from 'capnweb'
import type {
  AgentApi,
  GenerateInput,
  PublishSnapshotInput,
  ReadFilesInput,
  RpcConnection,
  RpcConnector,
  SaveConfigInput,
  StudioApi,
} from './protocol/index.ts'
import { createWebsocket } from './ws.ts'

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
export const connectWebSocketRpc: RpcConnector = async ({ url, token, local }): Promise<RpcConnection> => {
  const { protocol, hostname, host } = new URL(url)
  // `URL` keeps the brackets on an IPv6 hostname, so `::1` arrives as `[::1]`.
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
  if (protocol !== 'wss:' && !(protocol === 'ws:' && isLoopback)) {
    throw new Error(`Refusing unencrypted WebSocket to ${host}`)
  }

  const socket = createWebsocket(url, { headers: { Authorization: `Bearer ${token}` } })
  const closed = new Promise<void>((resolve) => socket.once('close', resolve))
  // `ws` implements the browser WebSocket surface capnweb uses, but declares its own nominal type.
  const studio = newWebSocketRpcSession<StudioApi>(socket as unknown as globalThis.WebSocket, new AgentRpcTarget(local))
  studio.onRpcBroken(() => socket.close())

  return {
    studio,
    closed,
    close: () => studio[Symbol.dispose](),
  }
}
