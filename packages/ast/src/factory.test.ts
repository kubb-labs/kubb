import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  createArrowFunctionDeclaration,
  createConst,
  createExport,
  createFile,
  createFunctionDeclaration,
  createFunctionParameter,
  createFunctionParameters,
  createImport,
  createInput,
  createOperation,
  createParameter,
  createParameterGroup,
  createProperty,
  createResponse,
  createSchema,
  createSource,
  createTypeDeclaration,
  createTypeNode,
} from './factory.ts'
import type { ArrowFunctionDeclarationNode, ConstNode, FileNode, FunctionDeclarationNode, ObjectSchemaNode, StringSchemaNode, TypeDeclarationNode } from './nodes/index.ts'

describe('createInput', () => {
  it('creates an InputNode with default empty arrays', () => {
    const node = createInput()

    expect(node.kind).toBe('Input')
    expect(node.schemas).toEqual([])
    expect(node.operations).toEqual([])
  })

  it('accepts overrides', () => {
    const schema = createSchema({ type: 'string' })
    const node = createInput({ schemas: [schema] })

    expect(node.schemas).toHaveLength(1)
    expect(node.operations).toEqual([])
  })

  it('always sets kind to Input', () => {
    // @ts-expect-error — kind should be overridden back to 'Input'
    const node = createInput({ kind: 'Operation' })

    expect(node.kind).toBe('Input')
  })
})

describe('createOperation', () => {
  it('creates an OperationNode with required fields', () => {
    const node = createOperation({ operationId: 'getPets', method: 'GET', path: '/pets' })

    expect(node.kind).toBe('Operation')
    expect(node.operationId).toBe('getPets')
    expect(node.method).toBe('GET')
    expect(node.path).toBe('/pets')
    expect(node.tags).toEqual([])
    expect(node.parameters).toEqual([])
    expect(node.responses).toEqual([])
  })

  it('accepts optional fields', () => {
    const node = createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      summary: 'Create a pet',
      deprecated: true,
      tags: ['pets'],
    })

    expect(node.summary).toBe('Create a pet')
    expect(node.deprecated).toBe(true)
    expect(node.tags).toEqual(['pets'])
  })
})

describe('createSchema', () => {
  it('creates a SchemaNode with a type', () => {
    const node = createSchema({ type: 'string' })

    expect(node.kind).toBe('Schema')
    expect(node.type).toBe('string')
  })

  it('accepts nullable and description', () => {
    const node = createSchema({ type: 'number', nullable: true, description: 'An age value' })

    expect(node.nullable).toBe(true)
    expect(node.description).toBe('An age value')
  })

  it('creates an object schema with properties', () => {
    const prop = createProperty({ name: 'id', schema: createSchema({ type: 'integer' }) })
    const node = createSchema({ type: 'object', properties: [prop] })

    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('id')
  })

  it('creates a ref schema', () => {
    const node = createSchema({ type: 'ref', name: 'Pet' })

    expect(node.name).toBe('Pet')
  })

  it('narrows return type to StringSchemaNode for type "string"', () => {
    expectTypeOf(createSchema({ type: 'string' })).toMatchTypeOf<StringSchemaNode & { kind: 'Schema' }>()
  })

  it('narrows return type to ObjectSchemaNode for type "object"', () => {
    expectTypeOf(createSchema({ type: 'object' })).toMatchTypeOf<ObjectSchemaNode & { kind: 'Schema' }>()
  })
})

describe('createProperty', () => {
  it('defaults required to false', () => {
    const node = createProperty({ name: 'name', schema: createSchema({ type: 'string' }) })

    expect(node.kind).toBe('Property')
    expect(node.required).toBe(false)
  })

  it('accepts required: true', () => {
    const node = createProperty({
      name: 'id',
      schema: createSchema({ type: 'integer' }),
      required: true,
    })

    expect(node.required).toBe(true)
    expect(node.schema.optional).toBeFalsy()
    expect(node.schema.nullable).toBeFalsy()
    expect(node.schema.nullish).toBeFalsy()
  })
})

describe('createParameter', () => {
  it('creates a path parameter', () => {
    const node = createParameter({
      name: 'petId',
      in: 'path',
      schema: createSchema({ type: 'integer' }),
      required: true,
    })

    expect(node.kind).toBe('Parameter')
    expect(node.in).toBe('path')
    expect(node.required).toBe(true)
  })

  it('defaults required to false', () => {
    const node = createParameter({
      name: 'limit',
      in: 'query',
      schema: createSchema({ type: 'integer' }),
    })

    expect(node.required).toBe(false)
  })
})

describe('createResponse', () => {
  it('creates a response with just a status code', () => {
    const node = createResponse({
      statusCode: '200',
      schema: createSchema({
        type: 'string',
      }),
    })

    expect(node.kind).toBe('Response')
    expect(node.statusCode).toBe('200')
  })

  it('accepts a schema and description', () => {
    const node = createResponse({
      statusCode: '200',
      schema: createSchema({ type: 'object' }),
      description: 'Success',
    })

    expect(node.schema?.type).toBe('object')
    expect(node.description).toBe('Success')
  })
})

describe('createFunctionParameter', () => {
  it('defaults optional to false', () => {
    const node = createFunctionParameter({ name: 'petId', type: createTypeNode({ variant: 'reference', name: 'string' }) })

    expect(node.kind).toBe('FunctionParameter')
    expect(node.name).toBe('petId')
    expect(node.type).toEqual({ kind: 'Type', variant: 'reference', name: 'string' })
    expect(node.optional).toBe(false)
  })

  it('supports optional true without default', () => {
    const node = createFunctionParameter({ name: 'query', type: createTypeNode({ variant: 'reference', name: 'Query' }), optional: true })

    expect(node.optional).toBe(true)
    expect(node.default).toBeUndefined()
  })

  it('supports default value with optional false/omitted', () => {
    const node = createFunctionParameter({ name: 'config', type: createTypeNode({ variant: 'reference', name: 'RequestConfig' }), default: '{}' })

    expect(node.optional).toBe(false)
    expect(node.default).toBe('{}')
  })
})

describe('createParameterGroup', () => {
  it('creates object binding parameter with properties', () => {
    const props = [createFunctionParameter({ name: 'id', type: createTypeNode({ variant: 'reference', name: 'string' }) })]
    const node = createParameterGroup({ properties: props })

    expect(node.kind).toBe('ParameterGroup')
    expect(node.properties).toEqual(props)
  })

  it('accepts inline and default options', () => {
    const node = createParameterGroup({
      properties: [createFunctionParameter({ name: 'id', type: createTypeNode({ variant: 'reference', name: 'string' }) })],
      inline: true,
      default: '{}',
    })

    expect(node.inline).toBe(true)
    expect(node.default).toBe('{}')
  })
})

describe('createFunctionParameters', () => {
  it('defaults params to empty array', () => {
    const node = createFunctionParameters()

    expect(node.kind).toBe('FunctionParameters')
    expect(node.params).toEqual([])
  })

  it('accepts params override', () => {
    const params = [createFunctionParameter({ name: 'petId', type: createTypeNode({ variant: 'reference', name: 'string' }) })]
    const node = createFunctionParameters({ params })

    expect(node.params).toEqual(params)
  })
})

describe('createImport', () => {
  it('creates a named import', () => {
    const node = createImport({ name: ['useState'], path: 'react' })

    expect(node.kind).toBe('Import')
    expect(node.name).toEqual(['useState'])
    expect(node.path).toBe('react')
  })

  it('creates a type-only import', () => {
    const node = createImport({ name: ['FC'], path: 'react', isTypeOnly: true })

    expect(node.isTypeOnly).toBe(true)
  })

  it('creates a default import (no name array)', () => {
    const node = createImport({ name: 'React', path: 'react' })

    expect(node.name).toBe('React')
    expect(node.kind).toBe('Import')
  })

  it('creates a namespace import', () => {
    const node = createImport({ name: ['*'], path: 'lodash', isTypeOnly: false })

    expect(node.name).toEqual(['*'])
  })

  it('always sets kind to Import', () => {
    // @ts-expect-error — kind should be forced to 'Import'
    const node = createImport({ name: ['x'], path: './x', kind: 'Export' })

    expect(node.kind).toBe('Import')
  })
})

describe('createExport', () => {
  it('creates a named export', () => {
    const node = createExport({ name: ['Pet'], path: './Pet' })

    expect(node.kind).toBe('Export')
    expect(node.name).toEqual(['Pet'])
    expect(node.path).toBe('./Pet')
  })

  it('creates a wildcard export (no name)', () => {
    const node = createExport({ path: './utils' })

    expect(node.kind).toBe('Export')
    expect(node.name).toBeUndefined()
    expect(node.path).toBe('./utils')
  })

  it('creates a type-only export', () => {
    const node = createExport({ name: ['Pet'], path: './Pet', isTypeOnly: true })

    expect(node.isTypeOnly).toBe(true)
  })

  it('creates an aliased export', () => {
    const node = createExport({ name: ['default'], path: './Pet', asAlias: true })

    expect(node.asAlias).toBe(true)
  })

  it('always sets kind to Export', () => {
    // @ts-expect-error — kind should be forced to 'Export'
    const node = createExport({ name: ['x'], path: './x', kind: 'Import' })

    expect(node.kind).toBe('Export')
  })
})

describe('createSource', () => {
  it('creates a source node with a value', () => {
    const node = createSource({ name: 'Pet', value: 'export type Pet = { id: number }' })

    expect(node.kind).toBe('Source')
    expect(node.name).toBe('Pet')
    expect(node.value).toBe('export type Pet = { id: number }')
  })

  it('supports isExportable flag', () => {
    const node = createSource({ name: 'Pet', value: 'export type Pet = {}', isExportable: true })

    expect(node.isExportable).toBe(true)
  })

  it('supports isTypeOnly flag', () => {
    const node = createSource({ value: 'export type X = string', isTypeOnly: true })

    expect(node.isTypeOnly).toBe(true)
    expect(node.name).toBeUndefined()
  })

  it('always sets kind to Source', () => {
    // @ts-expect-error — kind should be forced to 'Source'
    const node = createSource({ value: 'x', kind: 'Import' })

    expect(node.kind).toBe('Source')
  })
})

describe('createFile', () => {
  it('creates a FileNode with correct kind, id, name and extname', () => {
    const file = createFile({ baseName: 'petStore.ts', path: 'src/models/petStore.ts' })

    expect(file.kind).toBe('File')
    expect(file.name).toBe('petStore')
    expect(file.extname).toBe('.ts')
    expect(typeof file.id).toBe('string')
    expect(file.id.length).toBeGreaterThan(0)
  })

  it('generates a stable id from the path', () => {
    const a = createFile({ baseName: 'pet.ts', path: 'src/pet.ts' })
    const b = createFile({ baseName: 'pet.ts', path: 'src/pet.ts' })

    expect(a.id).toBe(b.id)
  })

  it('generates different ids for different paths', () => {
    const a = createFile({ baseName: 'pet.ts', path: 'src/a/pet.ts' })
    const b = createFile({ baseName: 'pet.ts', path: 'src/b/pet.ts' })

    expect(a.id).not.toBe(b.id)
  })

  it('throws when baseName has no extension', () => {
    expect(() => createFile({ baseName: 'petStore' as `.${string}`, path: 'src/petStore' })).toThrow(/No extname found/)
  })

  it('deduplicates sources', () => {
    const src = createSource({ name: 'Pet', value: 'export type Pet = {}' })
    const file = createFile({ baseName: 'pet.ts', path: 'src/pet.ts', sources: [src, src] })

    expect(file.sources).toHaveLength(1)
  })

  it('deduplicates exports', () => {
    const exp = createExport({ name: ['Pet'], path: './Pet' })
    const file = createFile({ baseName: 'index.ts', path: 'src/index.ts', exports: [exp, exp] })

    expect(file.exports).toHaveLength(1)
  })

  it('filters unused imports', () => {
    const usedImport = createImport({ name: ['z'], path: 'zod' })
    const unusedImport = createImport({ name: ['unused'], path: 'lodash' })
    const src = createSource({ value: 'const schema = z.string()' })
    const file = createFile({
      baseName: 'schema.ts',
      path: 'src/schema.ts',
      sources: [src],
      imports: [usedImport, unusedImport],
    })

    expect(file.imports.map((i) => i.path)).toContain('zod')
    expect(file.imports.map((i) => i.path)).not.toContain('lodash')
  })

  it('carries through meta, banner and footer', () => {
    const file = createFile({
      baseName: 'pet.ts',
      path: 'src/pet.ts',
      meta: { tag: 'pets' },
      banner: '// generated',
      footer: '// end',
    })

    expect(file.meta).toEqual({ tag: 'pets' })
    expect(file.banner).toBe('// generated')
    expect(file.footer).toBe('// end')
  })

  it('narrows the return type to FileNode', () => {
    expectTypeOf(createFile({ baseName: 'pet.ts', path: 'src/pet.ts' })).toMatchTypeOf<FileNode>()
  })
})

describe('createSource (nodes field)', () => {
  it('accepts structured child nodes', () => {
    const constNode = createConst({ name: 'pet', export: true })
    const node = createSource({ name: 'pet', isExportable: true, nodes: [constNode] })

    expect(node.nodes).toHaveLength(1)
    expect(node.nodes?.[0]?.kind).toBe('Const')
  })

  it('omits nodes when not provided', () => {
    const node = createSource({ name: 'pet', value: 'const pet = {}' })

    expect(node.nodes).toBeUndefined()
  })
})

describe('createConst', () => {
  it('creates a ConstNode with required name', () => {
    const node = createConst({ name: 'pet' })

    expect(node.kind).toBe('Const')
    expect(node.name).toBe('pet')
    expect(node.export).toBeUndefined()
    expect(node.asConst).toBeUndefined()
    expect(node.type).toBeUndefined()
    expect(node.JSDoc).toBeUndefined()
    expect(node.nodes).toBeUndefined()
  })

  it('accepts export, type and asConst flags', () => {
    const node = createConst({ name: 'pets', export: true, type: 'Pet[]', asConst: true })

    expect(node.export).toBe(true)
    expect(node.type).toBe('Pet[]')
    expect(node.asConst).toBe(true)
  })

  it('accepts JSDoc comments', () => {
    const node = createConst({ name: 'pet', JSDoc: { comments: ['@description A pet resource'] } })

    expect(node.JSDoc?.comments).toEqual(['@description A pet resource'])
  })

  it('accepts child nodes', () => {
    const child = createTypeDeclaration({ name: 'Pet' })
    const node = createConst({ name: 'pet', nodes: [child] })

    expect(node.nodes).toHaveLength(1)
    expect(node.nodes?.[0]?.kind).toBe('TypeDeclaration')
  })

  it('always sets kind to Const', () => {
    // @ts-expect-error — kind should be forced to 'Const'
    const node = createConst({ name: 'x', kind: 'Import' })

    expect(node.kind).toBe('Const')
  })

  it('narrows the return type to ConstNode', () => {
    expectTypeOf(createConst({ name: 'pet' })).toMatchTypeOf<ConstNode>()
  })
})

describe('createTypeDeclaration', () => {
  it('creates a TypeDeclarationNode with required name', () => {
    const node = createTypeDeclaration({ name: 'Pet' })

    expect(node.kind).toBe('TypeDeclaration')
    expect(node.name).toBe('Pet')
    expect(node.export).toBeUndefined()
    expect(node.JSDoc).toBeUndefined()
    expect(node.nodes).toBeUndefined()
  })

  it('accepts export flag and JSDoc', () => {
    const node = createTypeDeclaration({
      name: 'PetStatus',
      export: true,
      JSDoc: { comments: ['@description Status of a pet'] },
    })

    expect(node.export).toBe(true)
    expect(node.JSDoc?.comments).toEqual(['@description Status of a pet'])
  })

  it('accepts child nodes', () => {
    const child = createConst({ name: 'value' })
    const node = createTypeDeclaration({ name: 'PetStatus', nodes: [child] })

    expect(node.nodes).toHaveLength(1)
    expect(node.nodes?.[0]?.kind).toBe('Const')
  })

  it('always sets kind to TypeDeclaration', () => {
    // @ts-expect-error — kind should be forced to 'TypeDeclaration'
    const node = createTypeDeclaration({ name: 'X', kind: 'Import' })

    expect(node.kind).toBe('TypeDeclaration')
  })

  it('narrows the return type to TypeDeclarationNode', () => {
    expectTypeOf(createTypeDeclaration({ name: 'Pet' })).toMatchTypeOf<TypeDeclarationNode>()
  })
})

describe('createFunctionDeclaration', () => {
  it('creates a FunctionDeclarationNode with required name', () => {
    const node = createFunctionDeclaration({ name: 'getPet' })

    expect(node.kind).toBe('FunctionDeclaration')
    expect(node.name).toBe('getPet')
    expect(node.export).toBeUndefined()
    expect(node.async).toBeUndefined()
    expect(node.params).toBeUndefined()
    expect(node.returnType).toBeUndefined()
    expect(node.generics).toBeUndefined()
    expect(node.JSDoc).toBeUndefined()
    expect(node.nodes).toBeUndefined()
  })

  it('accepts export, async, params, returnType and generics', () => {
    const node = createFunctionDeclaration({
      name: 'fetchPet',
      export: true,
      async: true,
      params: 'id: string',
      returnType: 'Pet',
      generics: ['T'],
    })

    expect(node.export).toBe(true)
    expect(node.async).toBe(true)
    expect(node.params).toBe('id: string')
    expect(node.returnType).toBe('Pet')
    expect(node.generics).toEqual(['T'])
  })

  it('accepts default export flag', () => {
    const node = createFunctionDeclaration({ name: 'handler', default: true, export: true })

    expect(node.default).toBe(true)
  })

  it('accepts JSDoc and child nodes', () => {
    const node = createFunctionDeclaration({
      name: 'getPet',
      JSDoc: { comments: ['@description Fetch a pet'] },
      nodes: [createConst({ name: 'url' })],
    })

    expect(node.JSDoc?.comments).toEqual(['@description Fetch a pet'])
    expect(node.nodes).toHaveLength(1)
  })

  it('always sets kind to FunctionDeclaration', () => {
    // @ts-expect-error — kind should be forced to 'FunctionDeclaration'
    const node = createFunctionDeclaration({ name: 'x', kind: 'Import' })

    expect(node.kind).toBe('FunctionDeclaration')
  })

  it('narrows the return type to FunctionDeclarationNode', () => {
    expectTypeOf(createFunctionDeclaration({ name: 'getPet' })).toMatchTypeOf<FunctionDeclarationNode>()
  })
})

describe('createArrowFunctionDeclaration', () => {
  it('creates an ArrowFunctionDeclarationNode with required name', () => {
    const node = createArrowFunctionDeclaration({ name: 'getPet' })

    expect(node.kind).toBe('ArrowFunctionDeclaration')
    expect(node.name).toBe('getPet')
    expect(node.export).toBeUndefined()
    expect(node.async).toBeUndefined()
    expect(node.singleLine).toBeUndefined()
    expect(node.params).toBeUndefined()
    expect(node.returnType).toBeUndefined()
    expect(node.generics).toBeUndefined()
    expect(node.JSDoc).toBeUndefined()
    expect(node.nodes).toBeUndefined()
  })

  it('accepts export, async, params, returnType, generics and singleLine', () => {
    const node = createArrowFunctionDeclaration({
      name: 'double',
      export: true,
      async: false,
      params: 'n: number',
      returnType: 'number',
      generics: 'T',
      singleLine: true,
    })

    expect(node.export).toBe(true)
    expect(node.async).toBe(false)
    expect(node.params).toBe('n: number')
    expect(node.returnType).toBe('number')
    expect(node.generics).toBe('T')
    expect(node.singleLine).toBe(true)
  })

  it('accepts JSDoc and child nodes', () => {
    const node = createArrowFunctionDeclaration({
      name: 'fetchPet',
      JSDoc: { comments: ['@description Fetch a pet'] },
      nodes: [createConst({ name: 'url' })],
    })

    expect(node.JSDoc?.comments).toEqual(['@description Fetch a pet'])
    expect(node.nodes).toHaveLength(1)
  })

  it('always sets kind to ArrowFunctionDeclaration', () => {
    // @ts-expect-error — kind should be forced to 'ArrowFunctionDeclaration'
    const node = createArrowFunctionDeclaration({ name: 'x', kind: 'Import' })

    expect(node.kind).toBe('ArrowFunctionDeclaration')
  })

  it('narrows the return type to ArrowFunctionDeclarationNode', () => {
    expectTypeOf(createArrowFunctionDeclaration({ name: 'getPet' })).toMatchTypeOf<ArrowFunctionDeclarationNode>()
  })
})
