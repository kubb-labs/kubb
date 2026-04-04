import type { FileNode } from '@kubb/ast/types'
import type { PluginFactoryOptions } from '@kubb/core'
import type { OperationProps, OperationsProps, SchemaProps } from './types.ts'

type UserGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  operations?: (props: OperationsProps<TOptions>) => Promise<FileNode[]>
  operation?: (props: OperationProps<TOptions>) => Promise<FileNode[]>
  schema?: (props: SchemaProps<TOptions>) => Promise<FileNode[]>
}

export type CoreGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  type: 'core'
  version: '1'
  operations: (props: OperationsProps<TOptions>) => Promise<FileNode[]>
  operation: (props: OperationProps<TOptions>) => Promise<FileNode[]>
  schema: (props: SchemaProps<TOptions>) => Promise<FileNode[]>
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
