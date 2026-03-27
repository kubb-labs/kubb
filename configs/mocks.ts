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
import type { Adapter, AdapterFactoryOptions, Plugin, PluginDriver, PluginFactoryOptions, ResolveNameParams, ResolvePathParams } from '../packages/core/src'

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

export const createMockedPluginDriver = (options: { name?: string; plugin?: Plugin<any>; config?: PluginDriver['config'] } = {}) =>
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
    getFile: ({
      name,
      extname,
      pluginName,
      options,
    }: {
      name: string
      extname: KubbFile.Extname
      pluginName: string
      options?: { group?: { tag?: string; path?: string } }
    }) => {
      const baseName = `${name}${extname}`
      // Mirror plugin-ts resolvePath: for tag groups use the tag directly; for path groups
      // take the first non-empty segment (strips leading '/') to avoid absolute-looking paths.
      const groupDir = options?.group?.tag ?? options?.group?.path?.split('/').filter(Boolean)[0]
      const filePath = groupDir ? `${groupDir}/${baseName}` : baseName

      return {
        path: filePath,
        baseName,
        meta: { pluginName },
      }
    },
    getPlugin(_pluginName: Plugin['name']): Plugin | undefined {
      return options?.plugin
    },
  }) as unknown as PluginDriver

export const mockedPluginDriver = createMockedPluginDriver()

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
  resolver?: TOptions['resolver']
  pre?: Array<string>
  post?: Array<string>
}): Plugin<TOptions> {
  return {
    name: params.name,
    options: params.options,
    resolver: params.resolver,
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
