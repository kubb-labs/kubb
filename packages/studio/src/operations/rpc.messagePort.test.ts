import { newMessagePortRpcSession, RpcTarget } from 'capnweb'
import { describe, expect, it } from 'vitest'

/** A real Cap'n Web session over a `MessagePort`, not a fake connector. */

class FakeGenerationRun extends RpcTarget {
  aborted = false

  async events() {
    return new ReadableStream<{ n: number }>({
      start(controller) {
        controller.enqueue({ n: 1 })
        controller.close()
      },
    })
  }
  result() {
    return new Promise(() => {})
  }
  cancel() {
    this.aborted = true
    return Promise.resolve()
  }
  [Symbol.dispose]() {
    this.aborted = true
  }
}

class FakeAgent extends RpcTarget {
  readonly run = new FakeGenerationRun()

  startGeneration() {
    return this.run
  }
}

describe('a real capnweb session', () => {
  it("invokes the target's disposer when the peer session is torn down, not just on explicit disposal", async () => {
    const { port1, port2 } = new MessageChannel()
    try {
      const agent = new FakeAgent()
      newMessagePortRpcSession(port2, agent)
      const studio = newMessagePortRpcSession<FakeAgent>(port1)

      const run = studio.startGeneration()
      const events = await run.events()
      const seen: Array<{ n: number }> = []
      for await (const event of events) seen.push(event)
      expect(seen).toStrictEqual([{ n: 1 }])

      expect(agent.run.aborted).toBe(false)

      // Drops the session without disposing the run stub - the case that matters.
      studio[Symbol.dispose]()
      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(agent.run.aborted).toBe(true)
    } finally {
      port1.close()
      port2.close()
    }
  })
})
