import type { PluginFactoryOptions } from '@kubb/core'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { OperationProps, OperationsProps, SchemaProps, Version } from './types.ts'

type UserGenerator<TOptions extends PluginFactoryOptions, TVersion extends Version> = {
  name: string
  version?: TVersion
  operations?: (props: OperationsProps<TOptions, TVersion>) => Promise<KubbFile.File[]>
  operation?: (props: OperationProps<TOptions, TVersion>) => Promise<KubbFile.File[]>
  schema?: (props: SchemaProps<TOptions, TVersion>) => Promise<KubbFile.File[]>
}

export type CoreGenerator<TOptions extends PluginFactoryOptions, TVersion extends Version> = {
  name: string
  type: 'core'
  version: TVersion
  operations: (props: OperationsProps<TOptions, TVersion>) => Promise<KubbFile.File[]>
  operation: (props: OperationProps<TOptions, TVersion>) => Promise<KubbFile.File[]>
  schema: (props: SchemaProps<TOptions, TVersion>) => Promise<KubbFile.File[]>
}

export function createGenerator<TOptions extends PluginFactoryOptions, TVersion extends Version = '1'>(
  generator: UserGenerator<TOptions, TVersion>,
): CoreGenerator<TOptions, TVersion> {
  return {
    type: 'core',
    version: (generator.version ?? '1') as TVersion,
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
