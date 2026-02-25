/**
 * A minimal WebSocket mock for use in tests.
 * Stores event listeners and supports async-safe triggering.
 */
export class MockWebSocket {
  private listeners = new Map<string, Array<(...args: any[]) => any>>()

  /** Simulates the OPEN ready state so sendAgentMessage does not bail early. */
  public readyState = 1

  addEventListener(event: string, cb: (...args: any[]) => any): void {
    if (!this.listeners.has(event)) this.listeners.set(event, [])
    this.listeners.get(event)!.push(cb)
  }

  removeEventListener(event: string, cb: (...args: any[]) => any): void {
    const list = this.listeners.get(event)
    if (list) {
      const idx = list.indexOf(cb)
      if (idx >= 0) list.splice(idx, 1)
    }
  }

  /** Trigger all listeners for an event and await their completion in order. */
  async trigger(event: string, data?: any): Promise<void> {
    for (const cb of this.listeners.get(event) ?? []) {
      await cb(data)
    }
  }
}
