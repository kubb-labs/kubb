import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { FabricReactNode } from '@kubb/react-fabric/types'
import type { Adapter, Config, Plugin, PluginFactoryOptions } from './types.ts'

export type Version = '1' | '2'

// V2 props — fully typed with @kubb/ast (already a @kubb/core dependency)
export type OperationsV2Props<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  adapter: Adapter
  options: Plugin<TPlugin>['options']
  nodes: Array<OperationNode>
}

export type OperationV2Props<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  adapter: Adapter
  options: Plugin<TPlugin>['options']
  node: OperationNode
}

export type SchemaV2Props<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  config: Config
  adapter: Adapter
  options: Plugin<TPlugin>['options']
  node: SchemaNode
}

type UserCoreGeneratorV2<TPlugin extends PluginFactoryOptions> = {
  name: string
  type: 'core'
  version: '2'
  operations?(props: OperationsV2Props<TPlugin>): Promise<Array<KubbFile.File>>
  operation?(props: OperationV2Props<TPlugin>): Promise<Array<KubbFile.File>>
  schema?(props: SchemaV2Props<TPlugin>): Promise<Array<KubbFile.File>>
}

type UserReactGeneratorV2<TPlugin extends PluginFactoryOptions> = {
  name: string
  type: 'react'
  version: '2'
  Operations?(props: OperationsV2Props<TPlugin>): FabricReactNode
  Operation?(props: OperationV2Props<TPlugin>): FabricReactNode
  Schema?(props: SchemaV2Props<TPlugin>): FabricReactNode
}

export type CoreGeneratorV2<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  name: string
  type: 'core'
  version: '2'
  operations(props: OperationsV2Props<TPlugin>): Promise<Array<KubbFile.File>>
  operation(props: OperationV2Props<TPlugin>): Promise<Array<KubbFile.File>>
  schema(props: SchemaV2Props<TPlugin>): Promise<Array<KubbFile.File>>
}

export type ReactGeneratorV2<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = {
  name: string
  type: 'react'
  version: '2'
  Operations(props: OperationsV2Props<TPlugin>): FabricReactNode
  Operation(props: OperationV2Props<TPlugin>): FabricReactNode
  Schema(props: SchemaV2Props<TPlugin>): FabricReactNode
}

export type Generator<TPlugin extends PluginFactoryOptions = PluginFactoryOptions> = UserCoreGeneratorV2<TPlugin> | UserReactGeneratorV2<TPlugin>

export function defineGenerator<TPlugin extends PluginFactoryOptions = PluginFactoryOptions>(
  generator: UserReactGeneratorV2<TPlugin>,
): ReactGeneratorV2<TPlugin>

export function defineGenerator<TPlugin extends PluginFactoryOptions = PluginFactoryOptions>(generator: UserCoreGeneratorV2<TPlugin>): CoreGeneratorV2<TPlugin>

export function defineGenerator<TPlugin extends PluginFactoryOptions = PluginFactoryOptions>(
  generator: UserCoreGeneratorV2<TPlugin> | UserReactGeneratorV2<TPlugin>,
): unknown {
  if (generator.type === 'react') {
    return {
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
