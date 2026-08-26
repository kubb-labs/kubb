import { readFile } from 'node:fs/promises'
import { defineRpcFunction, type DevframeScopedNodeContext } from 'devframe'
import type { DevtoolsStore } from './store.ts'

/**
 * One entry in the file browser. The full {@link FileNode} carries an AST of code
 * fragments that only a renderer can turn back into source, so the list stays flat
 * and `read-file` goes to disk for the content.
 */
export type FileEntry = {
  id: string
  name: string
  baseName: string
  path: string
}

/**
 * Registers the devtools RPC functions on a scoped context. Names are bare because the
 * scope prefixes them with `kubb:`.
 *
 * `jsonSerializable` is left at its default so payloads ride the structured-clone
 * encoder — Kubb's AST carries cycles through `$ref` chains, which strict JSON rejects.
 *
 * @example
 * ```ts
 * registerRpcFunctions({ scope: ctx.scope('kubb'), store })
 * ```
 */
export function registerRpcFunctions({ scope, store }: { scope: DevframeScopedNodeContext; store: DevtoolsStore }): void {
  const getAst = defineRpcFunction({
    name: 'get-ast',
    type: 'query',
    handler: () => store.getAst(),
  })

  const getPluginNames = defineRpcFunction({
    name: 'get-plugin-names',
    type: 'query',
    handler: () => store.getPluginNames(),
  })

  // The per-plugin view is what each plugin actually received, after its own `override`.
  // Comparing it against `get-ast` is what shows a schema being filtered out.
  const getPluginView = defineRpcFunction({
    name: 'get-plugin-view',
    type: 'query',
    handler: (name: string) => store.getPluginView(name),
  })

  const getFiles = defineRpcFunction({
    name: 'get-files',
    type: 'query',
    handler: (): Array<FileEntry> =>
      store.getFiles().map((file) => ({
        id: file.id,
        name: file.name,
        baseName: file.baseName,
        path: file.path,
      })),
  })

  // Takes a file id rather than a path: the path comes from the build's own file list,
  // so a client can never steer this at an arbitrary file on disk.
  const readGeneratedFile = defineRpcFunction({
    name: 'read-file',
    type: 'query',
    handler: async (id: string) => {
      const file = store.getFiles().find((entry) => entry.id === id)
      if (!file) return null

      try {
        return await readFile(file.path, 'utf8')
      } catch {
        return null
      }
    },
  })

  for (const fn of [getAst, getPluginNames, getPluginView, getFiles, readGeneratedFile]) {
    scope.rpc.register(fn)
  }
}
