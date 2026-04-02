import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import type { FabricFile } from '@kubb/fabric-core/types'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PossiblePromise } from '@internals/utils'
import type { PluginContext, PluginFactoryOptions } from './types.ts'

/**
 * A generator is a named object with optional `schema`, `operation`, and `operations`
 * methods. Each method is called with `this = PluginContext` of the parent plugin,
 * giving full access to `this.config`, `this.resolver`, `this.adapter`, `this.fabric`,
 * `this.driver`, etc.
 *
 * Return a React element, an array of `FabricFile.File`, or `void` to handle file
 * writing manually via `this.upsertFile`. Both React and core (non-React) generators
 * use the same method signatures — the return type determines how output is handled.
 *
 * @example
 * ```ts
 * export const typeGenerator = defineGenerator<PluginTs>({
 *   name: 'typescript',
 *   schema(node, options) {
 *     const root = path.resolve(this.config.root, this.config.output.path)
 *     return <File ...><Type node={node} resolver={this.resolver} /></File>
 *   },
 *   operation(node, options) {
 *     return <File ...><OperationType node={node} /></File>
 *   },
 * })
 * ```
 */
export type Generator<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = {
  /** Used in diagnostic messages and debug output. */
  name: string
  /**
   * Called for each schema node in the AST walk.
   * `this` is the parent plugin's PluginContext.
   * `options` contains the per-node resolved options (after exclude/include/override).
   */
  schema?: (
    this: PluginContext<TOptions>,
    node: SchemaNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FabricFile.File> | void>
  /**
   * Called for each operation node in the AST walk.
   * `this` is the parent plugin's PluginContext.
   */
  operation?: (
    this: PluginContext<TOptions>,
    node: OperationNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FabricFile.File> | void>
  /**
   * Called once after all operations have been walked.
   * `this` is the parent plugin's PluginContext.
   */
  operations?: (
    this: PluginContext<TOptions>,
    nodes: Array<OperationNode>,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FabricFile.File> | void>
}

/**
 * Defines a generator. Returns the object as-is with correct `this` typings.
 * No type discrimination (`type: 'react' | 'core'`) needed — `applyHookResult`
 * handles React elements and `File[]` uniformly.
 */
export function defineGenerator<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(
  generator: Generator<TOptions>,
): Generator<TOptions> {
  return generator
}
