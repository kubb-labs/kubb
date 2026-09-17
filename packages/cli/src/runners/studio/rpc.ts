import type { AgentApi, RpcAttach, StudioApi } from '@kubb/studio'
import { newWebSocketRpcSession, RpcTarget } from 'capnweb'

class AgentRpcTarget extends RpcTarget implements AgentApi {
  constructor(private readonly api: AgentApi) {
    super()
  }

  connect() { return this.api.connect() }
  generate(input: Parameters<AgentApi['generate']>[0]) { return this.api.generate(input) }
  saveConfig(input: Parameters<AgentApi['saveConfig']>[0]) { return this.api.saveConfig(input) }
  snapshot(input: Parameters<AgentApi['snapshot']>[0]) { return this.api.snapshot(input) }
  readFiles(input: Parameters<AgentApi['readFiles']>[0]) { return this.api.readFiles(input) }
  cancel(input: Parameters<AgentApi['cancel']>[0]) { return this.api.cancel(input) }
}

export const attachRpc: RpcAttach = (socket, local) => {
  const remote = newWebSocketRpcSession<StudioApi>(socket as unknown as globalThis.WebSocket, new AgentRpcTarget(local))
  remote.onRpcBroken(() => socket.close())

  return { remote, close: () => remote[Symbol.dispose]() }
}
