import type { PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import { App, createRoot, type KubbNode } from '@kubb/react'
import type * as KubbFile from '@kubb/fs/types'
import type { OperationsByMethod } from './types.ts'
import { Oas } from '@kubb/plugin-oas/components'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'

type OperationsProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  operations: Array<Operation>
  operationsByMethod: OperationsByMethod
}

type OperationProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  operation: Operation
}

type SchemaProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
  name: string
  schema: SchemaObject
  options: TOptions['resolvedOptions']
}

export type ParserOptions<TOptions extends PluginFactoryOptions> = {
  name: string
  operations?: (props: OperationsProps<TOptions>) => Promise<KubbFile.File[]>
  operation?: (props: OperationProps<TOptions>) => Promise<KubbFile.File[]>
  schema?: (props: SchemaProps<TOptions>) => Promise<KubbFile.File[]>
}

export type Parser<TOptions extends PluginFactoryOptions> = ParserOptions<TOptions>

export function createParser<TOptions extends PluginFactoryOptions>(parseOptions: ParserOptions<TOptions>): Parser<TOptions> {
  return parseOptions
}

export type ParserReactOptions<TOptions extends PluginFactoryOptions> = {
  name: string
  Operations?: (props: OperationsProps<TOptions>) => KubbNode
  Operation?: (props: OperationProps<TOptions>) => KubbNode
  Schema?: (props: SchemaProps<TOptions>) => KubbNode
  /**
   * Combine all react nodes and only render ones(to string or render)
   */
  render?: ()=> any
}

export function createReactParser<TOptions extends PluginFactoryOptions>(parseOptions: ParserReactOptions<TOptions>): Parser<TOptions> {
  return {
    ...parseOptions,
    async operations({ instance, options, operations, operationsByMethod }) {
      if (!parseOptions.Operations) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = instance.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      root.render(
        <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
          <Oas oas={oas} operations={operations} generator={instance}>
            <parseOptions.Operations operations={operations} instance={instance} operationsByMethod={operationsByMethod} options={options} />
          </Oas>
        </App>,
      )

      return root.files
    },
    async operation({ instance, operation, options }) {
      if (!parseOptions.Operation) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = instance.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      root.render(
        <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
          <Oas oas={oas} operations={[operation]} generator={instance}>
            <Oas.Operation operation={operation}>
              <parseOptions.Operation operation={operation} options={options} instance={instance} />
            </Oas.Operation>
          </Oas>
        </App>,
      )

      return root.files
    },
    async schema({ instance, schema, name, options }) {
      if (!parseOptions.Schema) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = instance.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      const tree = instance.parse({ schema, name })

      root.render(
        <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
          <Oas oas={oas}>
            <Oas.Schema name={name} value={schema} tree={tree}>
              <parseOptions.Schema schema={schema} options={options} instance={instance} name={name} />
            </Oas.Schema>
          </Oas>
        </App>,
      )

      return root.files
    },
  }
}
