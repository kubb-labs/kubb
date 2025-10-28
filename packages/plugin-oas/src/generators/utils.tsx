import type { PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import { App, createReactFabric, type Fabric } from '@kubb/react-fabric'
import { Oas } from '../components/Oas.tsx'
import type { OperationGenerator } from '../OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from '../SchemaGenerator.ts'
import type { Schema } from '../SchemaMapper.ts'
import type { ReactGenerator } from './/createReactGenerator.ts'

type BuildOperationsOptions<TOptions extends PluginFactoryOptions> = {
  fabric: Fabric
  generator: ReactGenerator<any>
  /**
   * @deprecated
   */
  instance: Omit<OperationGenerator<TOptions>, 'build'>
  options: TOptions['resolvedOptions']
}

export async function buildOperations<TOptions extends PluginFactoryOptions>(
  operations: Array<Operation>,
  { fabric, options, instance, generator }: BuildOperationsOptions<TOptions>,
): Promise<void> {
  if (!generator.Operations) {
    return undefined
  }

  const { pluginManager, oas, plugin, mode } = instance.context

  function Component() {
    return (
      <App meta={{ pluginManager, plugin, mode }}>
        <Oas oas={oas} operations={operations} generator={instance}>
          <generator.Operations operations={operations} instance={instance} options={options} />
        </Oas>
      </App>
    )
  }

  const fabricChild = createReactFabric()
  fabricChild.render(Component)

  await fabric.context.fileManager.add(...fabricChild.files)
}

type BuildOperationOptions<TOptions extends PluginFactoryOptions> = BuildOperationsOptions<TOptions>

export async function buildOperation<TOptions extends PluginFactoryOptions>(
  operation: Operation,
  { fabric, options, instance, generator }: BuildOperationOptions<TOptions>,
): Promise<void> {
  if (!generator.Operation) {
    return undefined
  }

  const { pluginManager, oas, plugin, mode } = instance.context

  function Component() {
    return (
      <App meta={{ pluginManager, plugin: { ...plugin, options }, mode }}>
        <Oas oas={oas} operations={[operation]} generator={instance}>
          <Oas.Operation operation={operation}>
            <generator.Operation operation={operation} options={options} instance={instance} />
          </Oas.Operation>
        </Oas>
      </App>
    )
  }
  const fabricChild = createReactFabric()
  fabricChild.render(Component)

  await fabric.context.fileManager.add(...fabricChild.files)
}

type BuildSchemaOptions<TOptions extends PluginFactoryOptions> = {
  fabric: Fabric
  generator: ReactGenerator<any>
  /**
   * @deprecated
   */
  instance: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
  options: TOptions['resolvedOptions']
}

export async function buildSchema<TOptions extends PluginFactoryOptions>(
  schema: {
    name: string
    tree: Array<Schema>
    value: SchemaObject
  },
  { fabric, options, instance, generator }: BuildSchemaOptions<TOptions>,
): Promise<void> {
  if (!generator.Schema) {
    return undefined
  }

  const { pluginManager, oas, plugin, mode } = instance.context

  function Component() {
    return (
      <App meta={{ pluginManager, plugin: { ...plugin, options }, mode }}>
        <Oas oas={oas}>
          <Oas.Schema name={schema.name} schemaObject={schema.value} tree={schema.tree}>
            <generator.Schema schema={schema} options={options} instance={instance} />
          </Oas.Schema>
        </Oas>
      </App>
    )
  }
  const fabricChild = createReactFabric()
  fabricChild.render(Component)

  await fabric.context.fileManager.add(...fabricChild.files)
}
