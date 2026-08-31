/**
 * A minimal WebSocket mock for use in tests.
 * Stores event listeners and supports async-safe triggering.
 */
export class MockWebSocket {
  private listeners = new Map<string, Array<(...args: Array<unknown>) => unknown>>()

  /**
   * Simulates the OPEN ready state so sendAgentMessage does not bail early.
   */
  public readyState = 1

  /**
   * Tracks whether close() has been called.
   */
  public closed = false

  /**
   * Tracks whether terminate() has been called.
   */
  public terminated = false

  addEventListener(event: string, cb: (...args: Array<unknown>) => unknown): void {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event)!.push(cb)
  }

  removeEventListener(event: string, cb: (...args: Array<unknown>) => unknown): void {
    const list = this.listeners.get(event)
    if (list) {
      const idx = list.indexOf(cb)
      if (idx >= 0) list.splice(idx, 1)
    }
  }

  /**
   * Simulate the WebSocket being closed from the client side.
   */
  close(_code?: number, _reason?: string): void {
    this.closed = true
  }

  /**
   * Simulate an immediate teardown without a closing handshake.
   */
  terminate(): void {
    this.terminated = true
  }

  /**
   * Trigger all listeners for an event and await their completion in order.
   */
  async trigger(event: string, data?: unknown): Promise<void> {
    for (const cb of this.listeners.get(event) ?? []) {
      await cb(data)
    }
  }
}
