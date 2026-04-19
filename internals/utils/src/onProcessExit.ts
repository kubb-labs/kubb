const SIGNALS: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];

/**
 * Register a callback to run when the process exits (via exit event or common signals).
 * Returns an unsubscribe function.
 *
 * Dynamically adjusts `process.maxListeners` to avoid MaxListenersExceededWarning
 * when multiple instances are created (e.g. in tests).
 */
export function onProcessExit(
  callback: (code: number | null) => void,
): () => void {
  const exitHandler = (code: number) => callback(code);

  const signalHandlers = new Map<NodeJS.Signals, () => void>();
  const count = SIGNALS.length + 1; // SIGINT + SIGTERM + SIGHUP + exit

  // Increase the limit to accommodate this registration
  process.setMaxListeners(process.getMaxListeners() + count);

  for (const signal of SIGNALS) {
    const handler = () => {
      unsubscribe();
      try {
        callback(null);
      } finally {
        process.kill(process.pid, signal);
      }
    };
    signalHandlers.set(signal, handler);
    process.on(signal, handler);
  }

  process.on("exit", exitHandler);

  function unsubscribe() {
    process.removeListener("exit", exitHandler);
    for (const [signal, handler] of signalHandlers) {
      process.removeListener(signal, handler);
    }
    // Restore the limit when listeners are removed
    process.setMaxListeners(Math.max(process.getMaxListeners() - count, 0));
  }

  return unsubscribe;
}
