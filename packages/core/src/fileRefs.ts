import { AsyncLocalStorage } from 'node:async_hooks'

const fileRefsKey = Symbol.for('kubb.fileRefs')

// On `globalThis`, so the ESM and CommonJS builds of `@kubb/core` share one store, as `kubbContext` does.
const host = globalThis as typeof globalThis & { [fileRefsKey]?: AsyncLocalStorage<boolean> }
const blocked: AsyncLocalStorage<boolean> = (host[fileRefsKey] ??= new AsyncLocalStorage<boolean>())

/**
 * Runs `run` with every local file `$ref` refused, for a spec the host did not write itself, such as
 * one a Studio sandbox or managed agent loads. The input file itself is still read.
 */
export function withoutFileRefs<T>(run: () => Promise<T>): Promise<T> {
  return blocked.run(true, run)
}

/**
 * Whether the running load is inside {@link withoutFileRefs}.
 */
export function fileRefsBlocked(): boolean {
  return blocked.getStore() === true
}
