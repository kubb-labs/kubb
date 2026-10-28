import path from 'node:path'
import { ast } from '@kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import ts from '@typescript/typescript6'
import { describe, expect, it } from 'vitest'
import { buildBarrelIndex, getBarrelFiles } from './utils.ts'

const ROOT = path.resolve(import.meta.dirname, '__fixtures__/services').replaceAll('\\', '/')

function makeFile({ relativePath, names, code }: { relativePath: string; names: Array<string>; code: string }): ast.FileNode {
  return ast.factory.createFile({
    path: `${ROOT}/${relativePath}`,
    baseName: path.basename(relativePath) as `${string}.${string}`,
    sources: names.map((name, index) => ast.factory.createSource({ name, isIndexable: true, nodes: index === 0 ? [ast.factory.createText(code)] : [] })),
    imports: [],
    exports: [],
  })
}

describe('service namespace TypeScript integration', () => {
  it('type-checks service calls and React Query imports and offers a service auto-import', async () => {
    const files = [
      makeFile({
        relativePath: 'client/PetService/getPet.ts',
        names: ['getPet'],
        code: `export async function getPet({ path }: { path: { petId: string } }): Promise<{ id: string }> {
          const response = await fetch('/pet/' + path.petId)
          return response.json()
        }`,
      }),
      makeFile({
        relativePath: 'hooks/useGetPet.ts',
        names: ['getPetQueryOptions', 'useGetPet'],
        code: `import { queryOptions, useQuery } from '@tanstack/react-query'
        import { getPet } from '../client/PetService/getPet'
        export function getPetQueryOptions(path: { petId: string }) {
          return queryOptions({ queryKey: ['getPet', path], queryFn: () => getPet({ path }) })
        }
        export function useGetPet(path: { petId: string }) {
          return useQuery(getPetQueryOptions(path))
        }`,
      }),
    ]
    const index = buildBarrelIndex(ROOT, files)
    const client = [...getBarrelFiles({ index, targetPath: `${ROOT}/client`, barrelType: 'named', namespace: true })]
    const namespaceExports = client
      .at(-1)!
      .exports.filter((item) => item.asAlias)
      .map((item) => ast.factory.createExport({ ...item, path: `./client/${item.path.slice(2)}` }))
    const root = [...getBarrelFiles({ index, barrelType: 'named', additionalExports: namespaceExports })]
    const printer = parserTs()
    const sources = new Map(await Promise.all([...files, ...client, ...root].map(async (file) => [file.path, await printer.parse(file)] as const)))
    const consumerPath = `${ROOT}/consumer.ts`
    sources.set(
      consumerPath,
      `import { PetService, getPet, getPetQueryOptions, useGetPet } from './index'
      import { PetService as ClientService, getPet as clientGetPet } from './client'
      const params = { path: { petId: '123' } }
      const a: Promise<{ id: string }> = PetService.getPet(params)
      const b: typeof a = ClientService.getPet(params)
      const c: typeof a = getPet(params)
      const d: typeof a = clientGetPet(params)
      const options = getPetQueryOptions(params.path)
      const query = useGetPet(params.path)
      const id: string | undefined = query.data?.id
    `,
    )
    const completionPath = `${ROOT}/completion.ts`
    sources.set(completionPath, 'PetServ')
    const options: ts.CompilerOptions = {
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      types: [],
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
    }
    const service = ts.createLanguageService({
      getCompilationSettings: () => options,
      getScriptFileNames: () => [...sources.keys()],
      getScriptVersion: () => '0',
      getScriptSnapshot(fileName) {
        const text = sources.get(fileName) ?? ts.sys.readFile(fileName)
        return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text)
      },
      getCurrentDirectory: () => ROOT,
      getDefaultLibFileName: ts.getDefaultLibFilePath,
      fileExists: (fileName) => sources.has(fileName) || ts.sys.fileExists(fileName),
      readFile: (fileName) => sources.get(fileName) ?? ts.sys.readFile(fileName),
      directoryExists: (directory) => [...sources.keys()].some((fileName) => fileName.startsWith(`${directory}/`)) || ts.sys.directoryExists(directory),
    })

    try {
      const diagnostics = [...sources.keys()]
        .filter((fileName) => fileName !== completionPath)
        .flatMap((fileName) => [...service.getSyntacticDiagnostics(fileName), ...service.getSemanticDiagnostics(fileName)])
      expect(diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toStrictEqual([])
      expect(sources.get(`${ROOT}/client/index.ts`)).toContain("export * as PetService from './PetService/index'")
      const completions = service.getCompletionsAtPosition(completionPath, 'PetServ'.length, {
        includeCompletionsForModuleExports: true,
        includeCompletionsWithInsertText: true,
      })
      expect(completions?.entries.some((entry) => entry.name === 'PetService' && entry.hasAction)).toBe(true)
    } finally {
      service.dispose()
    }
  })
})
