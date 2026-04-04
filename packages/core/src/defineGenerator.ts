import type { PossiblePromise } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast/types'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import { applyHookResult } from './renderNode.tsx'
import type { GeneratorContext, PluginFactoryOptions } from './types.ts'

export type { GeneratorContext } from './types.ts'

/**
 * A generator is a named object with optional `schema`, `operation`, and `operations`
 * methods. Each method is called with `this = PluginContext` of the parent plugin,
 * giving full access to `this.config`, `this.resolver`, `this.adapter`, `this.fabric`,
 * `this.driver`, etc.
 *
 * Return a React element, an array of `FileNode`, or `void` to handle file
 * writing manually via `this.upsertFile`. Both React and core (non-React) generators
 * use the same method signatures — the return type determines how output is handled.
 *
 * @example
 * ```ts
 * export const typeGenerator = defineGenerator<PluginTs>({
 *   name: 'typescript',
 *   schema(node, options) {
 *     const { adapter, resolver, root } = this
 *     return <File ...><Type node={node} resolver={resolver} /></File>
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
   * `this` is the parent plugin's context with `adapter` and `rootNode` guaranteed present.
   * `options` contains the per-node resolved options (after exclude/include/override).
   */
  schema?: (
    this: GeneratorContext<TOptions>,
    node: SchemaNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FileNode> | void>
  /**
   * Called for each operation node in the AST walk.
   * `this` is the parent plugin's context with `adapter` and `rootNode` guaranteed present.
   */
  operation?: (
    this: GeneratorContext<TOptions>,
    node: OperationNode,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FileNode> | void>
  /**
   * Called once after all operations have been walked.
   * `this` is the parent plugin's context with `adapter` and `rootNode` guaranteed present.
   */
  operations?: (
    this: GeneratorContext<TOptions>,
    nodes: Array<OperationNode>,
    options: TOptions['resolvedOptions'],
  ) => PossiblePromise<FabricReactNode | Array<FileNode> | void>
}

/**
 * Defines a generator. Returns the object as-is with correct `this` typings.
 * No type discrimination (`type: 'react' | 'core'`) needed — `applyHookResult`
 * handles React elements and `File[]` uniformly.
 */
export function defineGenerator<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(generator: Generator<TOptions>): Generator<TOptions> {
  return generator
}

/**
 * Merges an array of generators into a single generator.
 *
 * The merged generator's `schema`, `operation`, and `operations` methods run
 * the corresponding method from each input generator in sequence, applying each
 * result via `applyHookResult`. This eliminates the need to write the loop
 * manually in each plugin.
 *
 * @param generators - Array of generators to merge into a single generator.
 *
 * @example
 * ```ts
 * const merged = mergeGenerators(generators)
 *
 * return {
 *   name: pluginName,
 *   schema: merged.schema,
 *   operation: merged.operation,
 *   operations: merged.operations,
 * }
 * ```
 */
export function mergeGenerators<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(generators: Array<Generator<TOptions>>): Generator<TOptions> {
  return {
    name: generators.length > 0 ? generators.map((g) => g.name).join('+') : 'merged',
    async schema(node, options) {
      for (const gen of generators) {
        if (!gen.schema) continue
        const result = await gen.schema.call(this, node, options)

        await applyHookResult(result, this.fabric)
      }
    },
    async operation(node, options) {
      for (const gen of generators) {
        if (!gen.operation) continue
        const result = await gen.operation.call(this, node, options)

        await applyHookResult(result, this.fabric)
      }
    },
    async operations(nodes, options) {
      for (const gen of generators) {
        if (!gen.operations) continue
        const result = await gen.operations.call(this, nodes, options)

        await applyHookResult(result, this.fabric)
      }
    },
  }
}
