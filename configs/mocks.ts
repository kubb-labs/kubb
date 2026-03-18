import path from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import { createFile, FileProcessor } from '@kubb/react-fabric'
import { typescriptParser } from '@kubb/react-fabric/parsers'
import type { Options } from 'prettier'
import { format as prettierFormat } from 'prettier'
import pluginTypescript from 'prettier/plugins/typescript'
import { expect } from 'vitest'
import { camelCase, pascalCase } from '../internals/utils/src/index.ts'
import type { SchemaNode } from '../packages/ast/src/types.ts'
import type { Adapter, AdapterFactoryOptions, Plugin, PluginFactoryOptions, PluginManager, ResolveNameParams, ResolvePathParams } from '../packages/core/src'

const formatOptions: Options = {
  tabWidth: 2,
  printWidth: 160,
  parser: 'typescript',
  singleQuote: true,
  semi: false,
  bracketSameLine: false,
  endOfLine: 'auto',
  plugins: [pluginTypescript],
}

export async function format(source?: string): Promise<string> {
  if (!source) return ''
  try {
    return prettierFormat(source, formatOptions)
  } catch {
    return source
  }
}

export const createMockedPluginManager = (options: { name?: string; plugin?: Plugin<any>; config?: PluginManager['config'] } = {}) =>
  ({
    resolveName: (result: ResolveNameParams) => {
      if (result.type === 'file') {
        return camelCase(options?.name || result.name)
      }

      if (result.type === 'type') {
        return pascalCase(result.name)
      }

      if (result.type === 'function') {
        return camelCase(result.name)
      }

      return camelCase(result.name)
    },
    config: options?.config ?? {
      root: '.',
      output: {
        path: './path',
      },
    },
    resolvePath: ({ baseName }: ResolvePathParams) => baseName,
    getPluginByName: (_pluginName: string) => {
      return options?.plugin
    },
    getFile: ({ name, extname, pluginName }: { name: string; extname: KubbFile.Extname; pluginName: string }) => {
      const baseName = `${name}${extname}`

      return {
        path: baseName,
        baseName,
        meta: { pluginName },
      }
    },
    getPlugin(pluginName: Plugin['name']): Plugin | undefined {
      if (options?.plugin && options.plugin.name === pluginName) {
        return options.plugin
      }
      return (
        options.plugin ||
        ({
          name: pluginName,
          resolvers: [],
        } as unknown as Plugin)
      )
    },
  }) as unknown as PluginManager

export const mockedPluginManager = createMockedPluginManager()

/**
 * Creates a minimal `Adapter` mock suitable for unit tests.
 *
 * - `parse` returns an empty `RootNode` by default; override via `options.parse`.
 * - `getImports` returns `[]` by default (single-file mode, no cross-file imports).
 */
export function createMockedAdapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions>(
  options: {
    name?: TOptions['name']
    resolvedOptions?: TOptions['resolvedOptions']
    parse?: Adapter<TOptions>['parse']
    getImports?: Adapter<TOptions>['getImports']
  } = {},
): Adapter<TOptions> {
  return {
    name: (options.name ?? 'oas') as TOptions['name'],
    options: (options.resolvedOptions ?? {}) as TOptions['resolvedOptions'],
    parse: options.parse ?? (async () => ({ kind: 'Root' as const, schemas: [], operations: [] })),
    getImports: options.getImports ?? ((_node: SchemaNode, _resolve: (schemaName: string) => { name: string; path: string }) => []),
  } as Adapter<TOptions>
}

/**
 * Creates a minimal `Plugin` mock suitable for unit tests.
 *
 * @example
 * const plugin = createMockedPlugin<PluginTs>({ name: '@kubb/plugin-ts', options })
 */
export function createMockedPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(params: {
  name: TOptions['name']
  options: TOptions['resolvedOptions']
  pre?: Array<string>
  post?: Array<string>
}): Plugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    pre: params.pre,
    post: params.post,
    install: () => {},
    inject: () => undefined as TOptions['context'],
  } as unknown as Plugin<TOptions>
}

export async function matchFiles(files: Array<KubbFile.ResolvedFile | KubbFile.File> | undefined, pre?: string) {
  if (!files?.length) return

  const fileProcessor = new FileProcessor()
  const parsers = new Map<KubbFile.Extname, any>()
  parsers.set('.ts', typescriptParser)

  const processed = new Map<string, string>()

  for (const file of files) {
    if (!file?.path) {
      continue
    }

    if (processed.has(file.path)) {
      continue
    }

    const parsed = await fileProcessor.parse(createFile(file), { parsers })
    const code = file.baseName.endsWith('.json') ? parsed : await format(parsed)

    processed.set(file.path, code)

    const snapshotPath = path.join('__snapshots__', ...(pre ? [camelCase(pre)] : []), file.baseName)
    await expect(code).toMatchFileSnapshot(snapshotPath)
  }

  return processed
}
