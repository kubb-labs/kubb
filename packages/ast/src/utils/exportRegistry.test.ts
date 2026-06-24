import { describe, expect, it } from 'vitest'
import { createText } from '../nodes/code.ts'
import { createFile, createImport, createSource } from '../nodes/file.ts'
import { buildExportRegistry, hasDeferredImports, resolveDeferredImports } from './exportRegistry.ts'

function modelFile(name: string, path: string) {
  return createFile({
    baseName: `${name}.ts`,
    path,
    sources: [createSource({ name, isExportable: true, nodes: [createText(`export type ${name} = { id: number }`)] })],
  })
}

describe('buildExportRegistry', () => {
  it('maps exportable source names to their defining file path', () => {
    const registry = buildExportRegistry([modelFile('Pet', 'src/models/Pet.ts'), modelFile('Order', 'src/models/Order.ts')])

    expect(registry.get('Pet')).toBe('src/models/Pet.ts')
    expect(registry.get('Order')).toBe('src/models/Order.ts')
  })

  it('ignores non-exportable sources', () => {
    const file = createFile({
      baseName: 'internal.ts',
      path: 'src/internal.ts',
      sources: [createSource({ name: 'Helper', isExportable: false, nodes: [createText('const Helper = 1')] })],
    })

    expect(buildExportRegistry([file]).has('Helper')).toBe(false)
  })

  it('keeps the first file that exports a name when duplicates exist', () => {
    const registry = buildExportRegistry([modelFile('Pet', 'src/models/Pet.ts'), modelFile('Pet', 'src/other/Pet.ts')])

    expect(registry.get('Pet')).toBe('src/models/Pet.ts')
  })
})

describe('hasDeferredImports', () => {
  it('is true only when an import is marked resolveFromExports', () => {
    const deferred = createFile({
      baseName: 'useAddPet.ts',
      path: 'src/hooks/useAddPet.ts',
      imports: [createImport({ name: ['Pet'], path: '', resolveFromExports: true })],
    })
    const plain = createFile({
      baseName: 'plain.ts',
      path: 'src/plain.ts',
      imports: [createImport({ name: ['z'], path: 'zod' })],
      sources: [createSource({ name: 'x', nodes: [createText('const x = z')] })],
    })

    expect(hasDeferredImports(deferred)).toBe(true)
    expect(hasDeferredImports(plain)).toBe(false)
  })
})

describe('resolveDeferredImports', () => {
  const registry = buildExportRegistry([modelFile('Pet', 'src/models/Pet.ts'), modelFile('Error', 'src/models/Error.ts')])

  it('rewrites a deferred import to the files that define each name, grouped per file', () => {
    const consumer = createFile({
      baseName: 'useAddPet.ts',
      path: 'src/hooks/useAddPet.ts',
      imports: [createImport({ name: ['Pet', 'Error'], path: '', resolveFromExports: true, isTypeOnly: true })],
      sources: [createSource({ name: 'useAddPet', nodes: [createText('export function useAddPet(): Pet | Error { return {} as Pet }')] })],
    })

    const resolved = resolveDeferredImports(consumer, registry)

    expect(hasDeferredImports(resolved)).toBe(false)
    const byPath = Object.fromEntries(resolved.imports.map((imp) => [imp.path, imp]))
    expect(byPath['src/models/Pet.ts']?.name).toStrictEqual(['Pet'])
    expect(byPath['src/models/Error.ts']?.name).toStrictEqual(['Error'])
    expect(resolved.imports.every((imp) => imp.isTypeOnly)).toBe(true)
  })

  it('drops names that are not in the registry', () => {
    const consumer = createFile({
      baseName: 'useGhost.ts',
      path: 'src/hooks/useGhost.ts',
      imports: [createImport({ name: ['Ghost'], path: '', resolveFromExports: true })],
      sources: [createSource({ name: 'useGhost', nodes: [createText('export const useGhost = (): Ghost => ({}) as Ghost')] })],
    })

    expect(resolveDeferredImports(consumer, registry).imports).toHaveLength(0)
  })

  it('keeps non-deferred imports untouched', () => {
    const consumer = createFile({
      baseName: 'useAddPet.ts',
      path: 'src/hooks/useAddPet.ts',
      imports: [
        createImport({ name: ['useMutation'], path: '@tanstack/react-query' }),
        createImport({ name: ['Pet'], path: '', resolveFromExports: true, isTypeOnly: true }),
      ],
      sources: [createSource({ name: 'useAddPet', nodes: [createText('export const useAddPet = () => useMutation<Pet>()')] })],
    })

    const resolved = resolveDeferredImports(consumer, registry)
    const paths = resolved.imports.map((imp) => imp.path)

    expect(paths).toContain('@tanstack/react-query')
    expect(paths).toContain('src/models/Pet.ts')
  })

  it('returns the file unchanged when there are no deferred imports', () => {
    const file = createFile({
      baseName: 'plain.ts',
      path: 'src/plain.ts',
      imports: [createImport({ name: ['z'], path: 'zod' })],
      sources: [createSource({ name: 'x', nodes: [createText('const x = z')] })],
    })

    expect(resolveDeferredImports(file, registry)).toBe(file)
  })
})
