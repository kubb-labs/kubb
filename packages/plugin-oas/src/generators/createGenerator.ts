import type { KubbFile, PluginFactoryOptions } from '@kubb/core'
import type { OperationProps, OperationsProps, SchemaProps } from './types.ts'

type UserGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  operations?: (props: OperationsProps<TOptions>) => Promise<KubbFile.File[]>
  operation?: (props: OperationProps<TOptions>) => Promise<KubbFile.File[]>
  schema?: (props: SchemaProps<TOptions>) => Promise<KubbFile.File[]>
}

export type CoreGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  type: 'core'
  version: '1'
  operations: (props: OperationsProps<TOptions>) => Promise<KubbFile.File[]>
  operation: (props: OperationProps<TOptions>) => Promise<KubbFile.File[]>
  schema: (props: SchemaProps<TOptions>) => Promise<KubbFile.File[]>
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
