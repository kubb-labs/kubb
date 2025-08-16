import type { PluginFactoryOptions } from '@kubb/core'
import type { KubbFile } from '@kubb/core/fs'
import type { Operation, SchemaObject } from '@kubb/oas'
import { App, createRoot } from '@kubb/react'
import type { KubbNode } from '@kubb/react/types'
import { Oas } from './components/Oas.tsx'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'
import type { Schema } from './SchemaMapper.ts'

type OperationsProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  operations: Array<Operation>
}

type OperationProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  operation: Operation
}

type SchemaProps<TOptions extends PluginFactoryOptions> = {
  instance: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
  options: TOptions['resolvedOptions']
  schema: {
    name: string
    tree: Array<Schema>
    value: SchemaObject
  }
}

export type GeneratorOptions<TOptions extends PluginFactoryOptions> = {
  name: string
  operations?: (this: GeneratorOptions<TOptions>, props: OperationsProps<TOptions>) => Promise<KubbFile.File[]>
  operation?: (this: GeneratorOptions<TOptions>, props: OperationProps<TOptions>) => Promise<KubbFile.File[]>
  schema?: (this: GeneratorOptions<TOptions>, props: SchemaProps<TOptions>) => Promise<KubbFile.File[]>
}

export type Generator<TOptions extends PluginFactoryOptions> = GeneratorOptions<TOptions>

export function createGenerator<TOptions extends PluginFactoryOptions>(parseOptions: GeneratorOptions<TOptions>): Generator<TOptions> {
  return parseOptions
}

export type ReactGeneratorOptions<TOptions extends PluginFactoryOptions> = {
  name: string
  Operations?: (this: ReactGeneratorOptions<TOptions>, props: OperationsProps<TOptions>) => KubbNode
  Operation?: (this: ReactGeneratorOptions<TOptions>, props: OperationProps<TOptions>) => KubbNode
  Schema?: (this: ReactGeneratorOptions<TOptions>, props: SchemaProps<TOptions>) => KubbNode
}

/****
 * Creates a generator that uses React component functions to generate files for OpenAPI operations and schemas.
 *
 * The returned generator exposes async methods for generating files from operations, a single operation, or a schema, using the corresponding React components if provided. If a component is not defined, the method returns an empty array.
 *
 * @returns A generator object with async methods for operations, operation, and schema file generation.
 */
export function createReactGenerator<TOptions extends PluginFactoryOptions>(parseOptions: ReactGeneratorOptions<TOptions>): Generator<TOptions> {
  return {
    ...parseOptions,
    async operations({ instance, options, operations }) {
      if (!parseOptions.Operations) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = instance.context
      const root = createRoot({
        logger: pluginManager.logger,
      })
      const Component = parseOptions.Operations.bind(this)

      root.render(
        <App pluginManager={pluginManager} plugin={plugin} mode={mode}>
          <Oas oas={oas} operations={operations} generator={instance}>
            <Component operations={operations} instance={instance} options={options} />
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
      const Component = parseOptions.Operation.bind(this)

      root.render(
        <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
          <Oas oas={oas} operations={[operation]} generator={instance}>
            <Oas.Operation operation={operation}>
              <Component operation={operation} options={options} instance={instance} />
            </Oas.Operation>
          </Oas>
        </App>,
      )
      return root.files
    },
    async schema({ instance, schema, options }) {
      if (!parseOptions.Schema) {
        return []
      }

      const { pluginManager, oas, plugin, mode } = instance.context

      const Component = parseOptions.Schema.bind(this)
      const root = createRoot({
        logger: pluginManager.logger,
      })
      root.render(
        <App pluginManager={pluginManager} plugin={{ ...plugin, options }} mode={mode}>
          <Oas oas={oas}>
            <Oas.Schema name={schema.name} schemaObject={schema.value} tree={schema.tree}>
              <Component schema={schema} options={options} instance={instance} />
            </Oas.Schema>
          </Oas>
        </App>,
      )
      return root.files
    },
  }
}
