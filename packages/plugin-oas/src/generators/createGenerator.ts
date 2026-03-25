import type { PluginFactoryOptions } from '@kubb/core'
import type { FabricFile } from '@kubb/fabric-core/types'
import type { OperationProps, OperationsProps, SchemaProps } from './types.ts'

type UserGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  operations?: (props: OperationsProps<TOptions>) => Promise<FabricFile.File[]>
  operation?: (props: OperationProps<TOptions>) => Promise<FabricFile.File[]>
  schema?: (props: SchemaProps<TOptions>) => Promise<FabricFile.File[]>
}

export type CoreGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  type: 'core'
  version: '1'
  operations: (props: OperationsProps<TOptions>) => Promise<FabricFile.File[]>
  operation: (props: OperationProps<TOptions>) => Promise<FabricFile.File[]>
  schema: (props: SchemaProps<TOptions>) => Promise<FabricFile.File[]>
}

export function createGenerator<TOptions extends PluginFactoryOptions>(generator: UserGenerator<TOptions>): CoreGenerator<TOptions> {
  return {
    type: 'core',
    version: '1',
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
