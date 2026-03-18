import type { OperationNode, SchemaNode } from '@kubb/ast/types'
import type { Adapter, Config, Plugin, PluginFactoryOptions, PluginDriver, ReactGeneratorV2 } from '@kubb/core'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Operation, SchemaObject } from '@kubb/oas'
import { createReactFabric, Fabric } from '@kubb/react-fabric'
import type { Fabric as FabricType } from '@kubb/react-fabric/types'
import type { ReactGenerator } from './generators/createReactGenerator.ts'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'
import type { Schema } from './SchemaMapper.ts'

type BuildOperationsBaseOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
}

type BuildOperationsV1Options<TOptions extends PluginFactoryOptions> = BuildOperationsBaseOptions<TOptions> & {
  version?: '1'
  Component: ReactGenerator<TOptions>['Operations']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
}

type BuildOperationsV2Options<TOptions extends PluginFactoryOptions> = BuildOperationsBaseOptions<TOptions> & {
  version: '2'
  Component: ReactGeneratorV2<TOptions>['Operations'] | undefined
  adapter: Adapter
  pluginDriver: PluginDriver
  mode: KubbFile.Mode
  options: TOptions['resolvedOptions']
}

function isBuildOperationsV1Options<TOptions extends PluginFactoryOptions>(
  options: BuildOperationsV1Options<TOptions> | BuildOperationsV2Options<TOptions>,
): options is BuildOperationsV1Options<TOptions> {
  return (options.version ?? '1') === '1'
}

export async function buildOperations<TOptions extends PluginFactoryOptions>(
  operations: Array<Operation>,
  options: BuildOperationsV1Options<TOptions>,
): Promise<void>
export async function buildOperations<TOptions extends PluginFactoryOptions>(
  nodes: Array<OperationNode>,
  options: BuildOperationsV2Options<TOptions>,
): Promise<void>
export async function buildOperations<TOptions extends PluginFactoryOptions>(
  operationsOrNodes: Array<Operation> | Array<OperationNode>,
  options: BuildOperationsV1Options<TOptions> | BuildOperationsV2Options<TOptions>,
): Promise<void> {
  const { config, fabric, plugin } = options

  if (!options.Component) {
    return undefined
  }

  const fabricChild = createReactFabric()

  if (isBuildOperationsV1Options(options)) {
    const { generator, Component } = options
    const { pluginDriver, oas, mode } = generator.context

    await fabricChild.render(
      <Fabric meta={{ pluginDriver, plugin, mode, oas }}>
        <Component config={config} operations={operationsOrNodes as Array<Operation>} generator={generator} plugin={plugin} />
      </Fabric>,
    )
  } else {
    const { Component, adapter } = options

    await fabricChild.render(
      <Fabric meta={{ plugin }}>
        <Component config={config} adapter={adapter} nodes={operationsOrNodes as Array<OperationNode>} options={options.options} />
      </Fabric>,
    )
  }

  fabric.context.fileManager.upsert(...fabricChild.files)
  fabricChild.unmount()
}

type BuildOperationBaseOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
}

type BuildOperationV1Options<TOptions extends PluginFactoryOptions> = BuildOperationBaseOptions<TOptions> & {
  version?: '1'
  Component: ReactGenerator<TOptions>['Operation']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
}

type BuildOperationV2Options<TOptions extends PluginFactoryOptions> = BuildOperationBaseOptions<TOptions> & {
  version: '2'
  Component: ReactGeneratorV2<TOptions>['Operation'] | undefined
  adapter: Adapter
  pluginDriver: PluginDriver
  mode: KubbFile.Mode
  options: TOptions['resolvedOptions']
}

function isBuildOperationV1Options<TOptions extends PluginFactoryOptions>(
  options: BuildOperationV1Options<TOptions> | BuildOperationV2Options<TOptions>,
): options is BuildOperationV1Options<TOptions> {
  return (options.version ?? '1') === '1'
}

export async function buildOperation<TOptions extends PluginFactoryOptions>(operation: Operation, options: BuildOperationV1Options<TOptions>): Promise<void>
export async function buildOperation<TOptions extends PluginFactoryOptions>(node: OperationNode, options: BuildOperationV2Options<TOptions>): Promise<void>
export async function buildOperation<TOptions extends PluginFactoryOptions>(
  operationOrNode: Operation | OperationNode,
  options: BuildOperationV1Options<TOptions> | BuildOperationV2Options<TOptions>,
): Promise<void> {
  const { config, fabric, plugin } = options

  if (!options.Component) {
    return undefined
  }

  const fabricChild = createReactFabric()

  if (isBuildOperationV1Options(options)) {
    const { generator, Component } = options
    const { pluginDriver, oas, mode } = generator.context

    await fabricChild.render(
      <Fabric meta={{ pluginDriver, plugin, mode, oas }}>
        <Component config={config} operation={operationOrNode as Operation} plugin={plugin} generator={generator} />
      </Fabric>,
    )
  } else {
    const { Component, adapter, pluginDriver, mode } = options

    await fabricChild.render(
      <Fabric meta={{ plugin, pluginDriver, mode }}>
        <Component config={config} adapter={adapter} node={operationOrNode as OperationNode} options={options.options} />
      </Fabric>,
    )
  }

  fabric.context.fileManager.upsert(...fabricChild.files)
  fabricChild.unmount()
}

type BuildSchemaBaseOptions<TOptions extends PluginFactoryOptions> = {
  config: Config
  fabric: FabricType
  plugin: Plugin<TOptions>
}

type BuildSchemaV1Options<TOptions extends PluginFactoryOptions> = BuildSchemaBaseOptions<TOptions> & {
  version?: '1'
  Component: ReactGenerator<TOptions>['Schema']
  generator: Omit<SchemaGenerator<SchemaGeneratorOptions, TOptions>, 'build'>
}

type BuildSchemaV2Options<TOptions extends PluginFactoryOptions> = BuildSchemaBaseOptions<TOptions> & {
  version: '2'
  Component: ReactGeneratorV2<TOptions>['Schema'] | undefined
  adapter: Adapter
  pluginDriver: PluginDriver
  mode: KubbFile.Mode
  options: TOptions['resolvedOptions']
}

function isBuildSchemaV1Options<TOptions extends PluginFactoryOptions>(
  options: BuildSchemaV1Options<TOptions> | BuildSchemaV2Options<TOptions>,
): options is BuildSchemaV1Options<TOptions> {
  return (options.version ?? '1') === '1'
}

export async function buildSchema<TOptions extends PluginFactoryOptions>(
  schema: { name: string; tree: Array<Schema>; value: SchemaObject },
  options: BuildSchemaV1Options<TOptions>,
): Promise<void>
export async function buildSchema<TOptions extends PluginFactoryOptions>(schema: SchemaNode, options: BuildSchemaV2Options<TOptions>): Promise<void>
export async function buildSchema<TOptions extends PluginFactoryOptions>(
  schema: { name: string; tree: Array<Schema>; value: SchemaObject } | SchemaNode,
  options: BuildSchemaV1Options<TOptions> | BuildSchemaV2Options<TOptions>,
): Promise<void> {
  const { config, fabric, plugin } = options

  if (!options.Component) {
    return undefined
  }

  const fabricChild = createReactFabric()

  if (isBuildSchemaV1Options(options)) {
    const { generator, Component } = options
    const { pluginDriver, oas, mode } = generator.context

    await fabricChild.render(
      <Fabric meta={{ pluginDriver, plugin, mode, oas }}>
        <Component config={config} schema={schema as { name: string; tree: Array<Schema>; value: SchemaObject }} plugin={plugin} generator={generator} />
      </Fabric>,
    )
  } else {
    const { Component, adapter, pluginDriver, mode } = options

    await fabricChild.render(
      <Fabric meta={{ plugin, pluginDriver, mode }}>
        <Component config={config} adapter={adapter} node={schema as SchemaNode} options={options.options} />
      </Fabric>,
    )
  }

  fabric.context.fileManager.upsert(...fabricChild.files)

  fabricChild.unmount()
}
