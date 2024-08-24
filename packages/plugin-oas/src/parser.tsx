import type { PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import { App, createRoot, type KubbNode } from '@kubb/react'
import type * as KubbFile from '@kubb/fs/types'
import type { OperationsByMethod } from './types.ts'
import { Oas } from '@kubb/plugin-oas/components'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'

type OperationsProps<TOptions extends PluginFactoryOptions> = {
  generator: OperationGenerator<TOptions>
  options: TOptions['resolvedOptions']
  operations: Array<Operation>
  operationsByMethod: OperationsByMethod
}

type OperationProps<TOptions extends PluginFactoryOptions> = {
  generator: OperationGenerator<TOptions>
  options: TOptions['resolvedOptions']
  operation: Operation
}

type SchemaProps<TOptions extends PluginFactoryOptions> = {
  generator: SchemaGenerator<SchemaGeneratorOptions, TOptions>
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
}

export function createReactParser<TOptions extends PluginFactoryOptions>(parseOptions: ParserReactOptions<TOptions>): Parser<TOptions> {
  return {
    ...parseOptions,
    async operations({ generator, options, operations, operationsByMethod }) {
      if (!parseOptions.Operations) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = generator.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      root.render(
        <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
          <Oas oas={oas} operations={operations} generator={generator}>
            <parseOptions.Operations operations={operations} generator={generator} operationsByMethod={operationsByMethod} options={options} />
          </Oas>
        </App>,
      )

      return root.files
    },
    async operation({ generator, operation, options }) {
      if (!parseOptions.Operation) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = generator.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      root.render(
        <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
          <Oas oas={oas} operations={[operation]} generator={generator}>
            <Oas.Operation operation={operation}>
              <parseOptions.Operation operation={operation} options={options} generator={generator} />
            </Oas.Operation>
          </Oas>
        </App>,
      )

      return root.files
    },
    async schema({ generator, schema, name, options }) {
      if (!parseOptions.Schema) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = generator.context
      const root = createRoot({
        logger: pluginManager.logger,
      })

      const tree = generator.parse({ schema, name })

      root.render(
        <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
          <Oas oas={oas}>
            <Oas.Schema name={name} value={schema} tree={tree}>
              <parseOptions.Schema schema={schema} options={options} generator={generator} name={name} />
            </Oas.Schema>
          </Oas>
        </App>,
      )

      return root.files
    },
  }
}
