import type { FileNode } from '@kubb/ast/types'
import type { Config, Plugin, PluginDriver, PluginFactoryOptions } from '@kubb/core'
import type { Operation, SchemaObject } from '@kubb/oas'
import { createReactFabric, Fabric } from '@kubb/react-fabric'
import type { ReactGenerator } from './generators/createReactGenerator.ts'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'
import type { Schema } from './SchemaMapper.ts'

type BuildOperationsV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  driver: PluginDriver
  plugin: Plugin<TOptions>
  Component: ReactGenerator<TOptions>['Operations']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
}

/**
 * Renders a React component for a list of operations (V1 generators).
 */
export async function renderOperations<TOptions extends PluginFactoryOptions>(
  operations: Array<Operation>,
  options: BuildOperationsV1Options<TOptions>,
): Promise<void> {
  const { config, driver, plugin, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const { driver: genDriver, oas, mode } = generator.context
  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric meta={{ driver: genDriver, plugin, mode, oas }}>
      <Component config={config} operations={operations} generator={generator} plugin={plugin} />
    </Fabric>,
  )

  driver.fileManager.upsert(...(fabricChild.files as unknown as Array<FileNode>))
  fabricChild.unmount()
}

type BuildOperationV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  driver: PluginDriver
  plugin: Plugin<TOptions>
  Component: ReactGenerator<TOptions>['Operation']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
}

/**
 * Renders a React component for a single operation (V1 generators).
 */
export async function renderOperation<TOptions extends PluginFactoryOptions>(operation: Operation, options: BuildOperationV1Options<TOptions>): Promise<void> {
  const { config, driver, plugin, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const { driver: genDriver, oas, mode } = generator.context
  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric meta={{ driver: genDriver, plugin, mode, oas }}>
      <Component config={config} operation={operation} plugin={plugin} generator={generator} />
    </Fabric>,
  )

  driver.fileManager.upsert(...(fabricChild.files as unknown as Array<FileNode>))
  fabricChild.unmount()
}

type BuildSchemaV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  driver: PluginDriver
  plugin: Plugin<TOptions>
  Component: ReactGenerator<TOptions>['Schema']
  generator: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
}

/**
 * Renders a React component for a single schema (V1 generators).
 */
export async function renderSchema<TOptions extends PluginFactoryOptions>(
  schema: { name: string; tree: Array<Schema>; value: SchemaObject },
  options: BuildSchemaV1Options<TOptions>,
): Promise<void> {
  const { config, driver, plugin, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const { driver: genDriver, oas, mode } = generator.context
  const fabricChild = createReactFabric()

  await fabricChild.render(
    <Fabric meta={{ driver: genDriver, plugin, mode, oas }}>
      <Component config={config} schema={schema} plugin={plugin} generator={generator} />
    </Fabric>,
  )

  driver.fileManager.upsert(...(fabricChild.files as unknown as Array<FileNode>))
  fabricChild.unmount()
}
