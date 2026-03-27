import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import type { FabricFile } from '@kubb/fabric-core/types'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { PluginDriver } from './PluginDriver.ts'
import type { Adapter, Config, Plugin, PluginFactoryOptions } from './types.ts'

export type Version = '1' | '2'

/**
 * Props for the `operations` lifecycle — receives all operation nodes at once.
 */
export type OperationsV2Props<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  plugin: Plugin<TPlugin>
  adapter: Adapter
  driver: PluginDriver
  options: Plugin<TPlugin>['options']
  resolver: TPlugin['resolver']
  nodes: Array<OperationNode>
}

/**
 * Props for the `operation` lifecycle — receives a single operation node.
 */
export type OperationV2Props<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  adapter: Adapter
  driver: PluginDriver
  plugin: Plugin<TPlugin>
  options: Plugin<TPlugin>['options']
  resolver: TPlugin['resolver']
  node: OperationNode
}

/**
 * Props for the `schema` lifecycle — receives a single schema node.
 */
export type SchemaV2Props<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  adapter: Adapter
  driver: PluginDriver
  plugin: Plugin<TPlugin>
  options: Plugin<TPlugin>['options']
  resolver: TPlugin['resolver']
  node: SchemaNode
}

/**
 * Input shape for a core v2 async generator — lifecycle methods are optional.
 */
type UserCoreGeneratorV2<TPlugin extends PluginFactoryOptions> = {
  name: string
  type: 'core'
  version?: '2'
  operations?(props: OperationsV2Props<TPlugin>): Promise<Array<FabricFile.File>>
  operation?(props: OperationV2Props<TPlugin>): Promise<Array<FabricFile.File>>
  schema?(props: SchemaV2Props<TPlugin>): Promise<Array<FabricFile.File>>
}

/**
 * Input shape for a React v2 generator — component methods are optional.
 */
type UserReactGeneratorV2<TPlugin extends PluginFactoryOptions> = {
  name: string
  type: 'react'
  version?: '2'
  Operations?(props: OperationsV2Props<TPlugin>): FabricReactNode
  Operation?(props: OperationV2Props<TPlugin>): FabricReactNode
  Schema?(props: SchemaV2Props<TPlugin>): FabricReactNode
}

/**
 * A fully resolved core v2 generator with `version: '2'` and guaranteed async lifecycle methods.
 */
export type CoreGeneratorV2<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  name: string
  type: 'core'
  version: '2'
  operations(props: OperationsV2Props<TPlugin>): Promise<Array<FabricFile.File>>
  operation(props: OperationV2Props<TPlugin>): Promise<Array<FabricFile.File>>
  schema(props: SchemaV2Props<TPlugin>): Promise<Array<FabricFile.File>>
}

/**
 * A fully resolved React v2 generator with `version: '2'` and guaranteed component methods.
 */
export type ReactGeneratorV2<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  name: string
  type: 'react'
  version: '2'
  Operations(props: OperationsV2Props<TPlugin>): FabricReactNode
  Operation(props: OperationV2Props<TPlugin>): FabricReactNode
  Schema(props: SchemaV2Props<TPlugin>): FabricReactNode
}

/**
 * Union of all v2 generator shapes accepted by the plugin system.
 */
export type Generator<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = UserCoreGeneratorV2<TPlugin> | UserReactGeneratorV2<TPlugin>

/**
 * Defines a generator with no-op defaults for any omitted lifecycle methods.
 * Works for both `core` (async file output) and `react` (JSX component) generators.
 *
 * @example
 * // react generator
 * export const typeGenerator = defineGenerator<PluginTs>({
 *   name: 'typescript',
 *   type: 'react',
 *   Operation({ node, options }) { return <File>...</File> },
 *   Schema({ node, options }) { return <File>...</File> },
 * })
 *
 * @example
 * // core generator
 * export const myGenerator = defineGenerator<MyPlugin>({
 *   name: 'my-generator',
 *   type: 'core',
 *   async operation({ node, options }) { return [{ path: '...', content: '...' }] },
 * })
 */
export function defineGenerator<TPlugin extends PluginFactoryOptions = PluginFactoryOptions>(
  generator: UserReactGeneratorV2<TPlugin>,
): ReactGeneratorV2<TPlugin>

export function defineGenerator<TPlugin extends PluginFactoryOptions = PluginFactoryOptions>(generator: UserCoreGeneratorV2<TPlugin>): CoreGeneratorV2<TPlugin>
export function defineGenerator<TPlugin extends PluginFactoryOptions = PluginFactoryOptions>(
  generator: UserCoreGeneratorV2<TPlugin> | UserReactGeneratorV2<TPlugin>,
): unknown {
  if (generator.type === 'react') {
    return {
      version: '2',
      Operations() {
        return null
      },
      Operation() {
        return null
      },
      Schema() {
        return null
      },
      ...generator,
    }
  }

  return {
    version: '2',
    async operations() {
      return []
    },
    async operation() {
      return []
    },
    async schema() {
      return []
    },
    ...generator,
  }
}
