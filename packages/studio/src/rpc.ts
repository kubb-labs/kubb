import { newWebSocketRpcSession, RpcTarget } from 'capnweb'
import type { AgentApi, RpcConnection, RpcConnector, StudioApi } from './protocol/index.ts'
import { createWebsocket } from './ws.ts'

class AgentRpcTarget extends RpcTarget implements AgentApi {
  constructor(private readonly api: AgentApi) {
    super()
  }

  connect() {
    return this.api.connect()
  }
  startGeneration(input: Parameters<AgentApi['startGeneration']>[0]) {
    return this.api.startGeneration(input)
  }
  saveConfig(input: Parameters<AgentApi['saveConfig']>[0]) {
    return this.api.saveConfig(input)
  }
  publishSnapshot(input: Parameters<AgentApi['publishSnapshot']>[0]) {
    return this.api.publishSnapshot(input)
  }
  readFiles(input: Parameters<AgentApi['readFiles']>[0]) {
    return this.api.readFiles(input)
  }
}

export const connectWebSocketRpc: RpcConnector = async ({ url, token, local }): Promise<RpcConnection> => {
  const { protocol, hostname, host } = new URL(url)
  if (protocol !== 'wss:' && !(protocol === 'ws:' && (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'))) {
    throw new Error(`Refusing unencrypted WebSocket to ${host}`)
  }

  const socket = createWebsocket(url, { headers: { Authorization: `Bearer ${token}` } })
  const closed = new Promise<void>((resolve) => socket.once('close', resolve))
  const studio = newWebSocketRpcSession<StudioApi>(socket as unknown as globalThis.WebSocket, new AgentRpcTarget(local))
  studio.onRpcBroken(() => socket.close())

  return {
    studio,
    closed,
    close: () => studio[Symbol.dispose](),
  }
}
