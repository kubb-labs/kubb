import type { Ast, PluginFactoryOptions } from '@kubb/core'
import type { OperationProps, OperationsProps, SchemaProps } from './types.ts'

type UserGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  operations?: (props: OperationsProps<TOptions>) => Promise<Ast.FileNode[]>
  operation?: (props: OperationProps<TOptions>) => Promise<Ast.FileNode[]>
  schema?: (props: SchemaProps<TOptions>) => Promise<Ast.FileNode[]>
}

export type CoreGenerator<TOptions extends PluginFactoryOptions> = {
  name: string
  type: 'core'
  version: '1'
  operations: (props: OperationsProps<TOptions>) => Promise<Ast.FileNode[]>
  operation: (props: OperationProps<TOptions>) => Promise<Ast.FileNode[]>
  schema: (props: SchemaProps<TOptions>) => Promise<Ast.FileNode[]>
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
