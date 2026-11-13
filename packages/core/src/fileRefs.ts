import { AsyncLocalStorage } from 'node:async_hooks'

const fileRefsKey = Symbol.for('kubb.fileRefs')

// On `globalThis`, so the ESM and CommonJS builds of `@kubb/core` share one store, as `kubbContext` does.
const host = globalThis as typeof globalThis & { [fileRefsKey]?: AsyncLocalStorage<string | false> }
const scope: AsyncLocalStorage<string | false> = (host[fileRefsKey] ??= new AsyncLocalStorage<string | false>())

/**
 * Runs `run` with local file `$ref`s limited to the input's folder and `root`, or refused entirely
 * with `false`, for a spec the host did not write itself, such as one Studio sends an agent. The
 * input file itself is still read. Outside it, a `$ref` reads any local file.
 */
export function withFileRefs<T>(root: string | false, run: () => Promise<T>): Promise<T> {
  return scope.run(root, run)
}

/** The scope {@link withFileRefs} set for the running load, if any. */
export function fileRefScope(): string | false | undefined {
  return scope.getStore()
}
