import type { PluginFactoryOptions } from '@kubb/core'
import type { Operation } from '@kubb/oas'
import type { KubbNode } from '@kubb/react'

type OperationsProps<TOptions extends PluginFactoryOptions> = {
  options: TOptions['resolvedOptions']
  operations: Array<Operation>
}

type OperationProps<TOptions extends PluginFactoryOptions> = {
  options: TOptions['resolvedOptions']
  operation: Operation
}

type SchemaProps<TOptions extends PluginFactoryOptions> = {
  children?: KubbNode
}

export type ParserOptions<TOptions extends PluginFactoryOptions> = {
  name: string
  templates?: {
    Operations?: (props: OperationsProps<TOptions>) => KubbNode
    Operation?: (props: OperationProps<TOptions>) => KubbNode
    Schema?: (props: SchemaProps<TOptions>) => KubbNode
  }
}

export type Parser<TOptions extends PluginFactoryOptions> = {
  name: string
  templates?: {
    Operations?: (props: OperationsProps<TOptions>) => KubbNode
    Operation?: (props: OperationProps<TOptions>) => KubbNode
    Schema?: (props: SchemaProps<TOptions>) => KubbNode
  }
}

export function createParser<TOptions extends PluginFactoryOptions>(options: ParserOptions<TOptions>): Parser<TOptions> {
  return options
}
