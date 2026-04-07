import type { Config, Plugin, PluginDriver, PluginFactoryOptions } from '@kubb/core'
import type { Oas, Operation, SchemaObject } from '@kubb/oas'
import { createRenderer, KubbContext, OasContext, provide, unprovide } from '@kubb/renderer-jsx'
import type { ReactGenerator } from './generators/createReactGenerator.ts'
import type { OperationGenerator } from './OperationGenerator.ts'
import type { SchemaGenerator, SchemaGeneratorOptions } from './SchemaGenerator.ts'
import type { Schema } from './SchemaMapper.ts'

type BuildOperationsV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  driver: PluginDriver
  plugin: Plugin<TOptions>
  oas: Oas
  mode: 'single' | 'split'
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
  const { config, driver, plugin, oas, mode, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const renderer = createRenderer()

  provide(KubbContext, { driver, plugin, mode })
  provide(OasContext, oas)
  try {
    await renderer.render(<Component config={config} operations={operations} generator={generator} plugin={plugin} />)
  } finally {
    unprovide(OasContext)
    unprovide(KubbContext)
  }

  driver.fileManager.upsert(...renderer.files)
  renderer.unmount()
}

type BuildOperationV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  driver: PluginDriver
  plugin: Plugin<TOptions>
  oas: Oas
  mode: 'single' | 'split'
  Component: ReactGenerator<TOptions>['Operation']
  generator: Omit<OperationGenerator<TOptions>, 'build'>
}

/**
 * Renders a React component for a single operation (V1 generators).
 */
export async function renderOperation<TOptions extends PluginFactoryOptions>(operation: Operation, options: BuildOperationV1Options<TOptions>): Promise<void> {
  const { config, driver, plugin, oas, mode, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const renderer = createRenderer()

  provide(KubbContext, { driver, plugin, mode })
  provide(OasContext, oas)
  try {
    await renderer.render(<Component config={config} operation={operation} plugin={plugin} generator={generator} />)
  } finally {
    unprovide(OasContext)
    unprovide(KubbContext)
  }

  driver.fileManager.upsert(...renderer.files)
  renderer.unmount()
}

type BuildSchemaV1Options<TOptions extends PluginFactoryOptions> = {
  config: Config
  driver: PluginDriver
  plugin: Plugin<TOptions>
  oas: Oas
  mode: 'single' | 'split'
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
  const { config, driver, plugin, oas, mode, Component, generator } = options

  if (!Component) {
    return undefined
  }

  const renderer = createRenderer()

  provide(KubbContext, { driver, plugin, mode })
  provide(OasContext, oas)
  try {
    await renderer.render(<Component config={config} schema={schema} plugin={plugin} generator={generator} />)
  } finally {
    unprovide(OasContext)
    unprovide(KubbContext)
  }

  driver.fileManager.upsert(...renderer.files)
  renderer.unmount()
}
