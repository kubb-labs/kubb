import { readFileSync } from 'node:fs'
import path from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { diagnosticCode } from './diagnosticCatalog.ts'
import { Diagnostics } from './Diagnostics.ts'
import type { Config } from './types.ts'

type Schema = boolean | Record<string, any>

const packages = path.resolve(import.meta.dirname, '../..')
const readJson = (file: string): any => JSON.parse(readFileSync(file, 'utf8'))
const schemas = {
  ast: readJson(path.join(packages, 'ast/schemas/ast.json')),
  file: readJson(path.join(packages, 'ast/schemas/file.json')),
  diagnostic: readJson(path.join(packages, 'core/schemas/diagnostic.json')),
  config: readJson(path.join(packages, 'core/schemas/config.json')),
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

function typeOf(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/**
 * Checks `value` against the draft 2020-12 keywords these schemas use. Returns the property names
 * the schema evaluated, which `unevaluatedProperties` needs, or `null` when the value fails.
 * shortcut: covers only the keywords in packages/{ast,core}/schemas; switch to ajv once it is a dependency.
 */
function check(root: Schema, schema: Schema, value: unknown, at: string, errors: Array<string>): Set<string> | null {
  if (schema === true) return new Set()
  if (schema === false) return (errors.push(`${at}: not allowed`), null)
  const fail = (message: string) => (errors.push(`${at}: ${message}`), null)
  const evaluated = new Set<string>()
  const merge = (keys: Set<string> | null) => keys && keys.forEach((key) => evaluated.add(key))

  if (schema.$ref) {
    const keys = check(root, resolveRef(root, schema.$ref), value, at, errors)
    if (!keys) return null
    merge(keys)
  }
  if ('const' in schema && !isDeepStrictEqual(value, schema.const)) return fail(`expected ${JSON.stringify(schema.const)}`)
  if (schema.enum && !schema.enum.some((item: unknown) => isDeepStrictEqual(value, item))) return fail(`${JSON.stringify(value)} is not in the enum`)
  if (schema.type) {
    const types: Array<string> = [schema.type].flat()
    const actual = typeOf(value)
    if (!types.includes(actual) && !(actual === 'number' && types.includes('integer') && Number.isInteger(value))) return fail(`expected ${types.join(' or ')}`)
  }
  if (typeof value === 'string' && schema.pattern && !new RegExp(schema.pattern, 'u').test(value)) return fail(`does not match ${schema.pattern}`)
  if (Array.isArray(value) && schema.items) {
    if (!value.every((item, index) => check(root, schema.items, item, `${at}[${index}]`, errors))) return null
  }
  for (const sub of schema.allOf ?? []) {
    const keys = check(root, sub, value, at, errors)
    if (!keys) return null
    merge(keys)
  }
  for (const [keyword, wanted] of [
    ['anyOf', (n: number) => n > 0],
    ['oneOf', (n: number) => n === 1],
  ] as const) {
    if (!schema[keyword]) continue
    const branches: Array<{ keys: Set<string> | null; errors: Array<string> }> = schema[keyword].map((sub: Schema) => {
      const branchErrors: Array<string> = []
      return { keys: check(root, sub, value, at, branchErrors), errors: branchErrors }
    })
    const passed = branches.filter((branch) => branch.keys)
    if (!wanted(passed.length)) {
      // A branch that fails a const or enum is another variant, so report the first branch that does not.
      const isOtherVariant = (branch: (typeof branches)[number]) => branch.errors.some((error) => /: (expected "|.* is not in the enum)/.test(error))
      const closest = branches.find((branch) => !isOtherVariant(branch))
      if (!passed.length && closest) errors.push(...closest.errors)
      return fail(`matches ${passed.length} ${keyword} branches`)
    }
    passed.forEach((branch) => merge(branch.keys))
  }
  if (!isObject(value)) return evaluated

  let ok = true
  for (const [key, child] of Object.entries(value)) {
    const own = schema.properties && key in schema.properties ? schema.properties[key] : schema.additionalProperties
    if (own !== undefined) {
      ok = !!check(root, own, child, `${at}.${key}`, errors) && ok
      evaluated.add(key)
    } else if (schema.unevaluatedProperties === false && !evaluated.has(key)) {
      ok = !!fail(`unknown property ${key}`) && ok
    }
  }
  if (!ok) return null
  for (const key of schema.required ?? []) {
    if (!(key in value)) return fail(`missing ${key}`)
  }
  for (const [key, needs] of Object.entries<Array<string>>(schema.dependentRequired ?? {})) {
    if (key in value && needs.some((need) => !(need in value))) return fail(`${key} needs ${needs.join(', ')}`)
  }
  return evaluated
}

function resolveRef(root: Schema, ref: string): Schema {
  const target = ref
    .replace(/^#\//, '')
    .split('/')
    .reduce<any>((node, part) => node?.[part], root)
  if (target === undefined) throw new Error(`Unresolved $ref ${ref}`)
  return target
}

function validate(schema: Schema, value: unknown): Array<string> {
  const errors: Array<string> = []
  return check(schema, schema, value, '$', errors) ? [] : errors
}

function collectRefs(node: unknown): Array<string> {
  if (Array.isArray(node)) return node.flatMap(collectRefs)
  if (!isObject(node)) return []
  return Object.entries(node).flatMap(([key, child]) => (key === '$ref' && typeof child === 'string' ? [child] : collectRefs(child)))
}

describe('boundary JSON schemas', () => {
  it.each(Object.entries(schemas))('%s is a draft 2020-12 schema whose refs resolve', (_name, schema) => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema')
    expect(schema.$id).toMatch(/^https:\/\/kubb\.dev\/schemas\/\w+\.json$/)
    for (const ref of collectRefs(schema)) expect(() => resolveRef(schema, ref)).not.toThrow()
  })

  it('an AST built with the factories matches ast.json', () => {
    const { createContent, createInput, createOperation, createParameter, createProperty, createResponse, createSchema } = ast.factory
    const pet = createSchema({
      type: 'object',
      name: 'Pet',
      properties: [
        createProperty({ name: 'id', schema: createSchema({ type: 'integer' }), required: true }),
        createProperty({ name: 'status', schema: createSchema({ type: 'enum', enumValues: ['available', 'sold'] }) }),
        createProperty({ name: 'tags', schema: createSchema({ type: 'array', items: [createSchema({ type: 'string' })] }) }),
        createProperty({
          name: 'owner',
          schema: createSchema({ type: 'union', members: [createSchema({ type: 'ref', name: 'User' }), createSchema({ type: 'null' })] }),
        }),
      ],
    })
    const operation = createOperation({
      operationId: 'getPetById',
      method: 'GET',
      path: '/pets/{petId}',
      tags: ['pets'],
      parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'integer' }), required: true })],
      responses: [
        createResponse({
          statusCode: '200',
          content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'ref', name: 'Pet' }) })],
        }),
      ],
    })
    const input = createInput({ schemas: [pet, createSchema({ type: 'object', name: 'User', properties: [] })], operations: [operation] })

    expect(validate(schemas.ast, JSON.parse(JSON.stringify(input)))).toStrictEqual([])
  })

  it('rejects AST data the types do not allow', () => {
    const input = { kind: 'Input', schemas: [{ kind: 'Schema', type: 'string', primitive: 'string', unknownField: 1 }], operations: [], meta: {} }
    const operation = { kind: 'Operation', operationId: 'a', tags: [], parameters: [], responses: [], method: 'GET' }

    expect(validate(schemas.ast, input)).toContain('$.schemas[0]: unknown property unknownField')
    expect(validate(schemas.ast, { ...input, schemas: [], operations: [operation] })).toContain('$.operations[0]: method needs path')
  })

  it('a FileNode from createFile matches file.json', () => {
    const file = ast.factory.createFile({
      baseName: 'pet.ts',
      path: '/out/pet.ts',
      banner: '/* banner */',
      imports: [ast.factory.createImport({ name: ['z', { propertyName: 'Pet', name: 'PetType' }], path: 'zod', isTypeOnly: true })],
      exports: [ast.factory.createExport({ name: ['pet'], path: './pet.ts' })],
      sources: [
        ast.factory.createSource({
          name: 'pet',
          isExportable: true,
          nodes: [
            ast.factory.createConst({ name: 'pet', export: true, JSDoc: { comments: ['A pet.', undefined] }, nodes: [ast.factory.createText('z.object({})')] }),
            ast.factory.createFunction({ name: 'getPet', params: 'id: string', generics: ['T'], nodes: [ast.factory.createText('return id')] }),
          ],
        }),
      ],
    })

    expect(validate(schemas.file, JSON.parse(JSON.stringify(file)))).toStrictEqual([])
    expect(validate(schemas.file, { ...file, extname: 'ts' })).toContain('$.extname: does not match ^\\..+$')
  })

  it('lists every diagnostic code', () => {
    const { ProblemDiagnostic, PerformanceDiagnostic, UpdateDiagnostic } = schemas.diagnostic.$defs
    const codes = [...schemas.diagnostic.$defs.ProblemCode.enum, PerformanceDiagnostic.properties.code.const, UpdateDiagnostic.properties.code.const]

    expect(ProblemDiagnostic.properties.code.$ref).toBe('#/$defs/ProblemCode')
    expect(codes.toSorted()).toStrictEqual(Object.values(diagnosticCode).toSorted())
  })

  it('diagnostics of every kind match diagnostic.json', () => {
    const { cause: _cause, ...unknown } = Diagnostics.from(new Error('boom'))
    const diagnostics = [
      unknown,
      {
        kind: 'problem',
        code: diagnosticCode.refNotFound,
        severity: 'error',
        message: 'x',
        location: { kind: 'schema', pointer: '#/a', ref: '#/b' },
        plugin: 'p',
      },
      { code: diagnosticCode.deprecated, severity: 'warning', message: 'x', location: { kind: 'config' } },
      { kind: 'performance', code: diagnosticCode.performance, severity: 'info', message: 'x', plugin: 'p', duration: 3 },
      { kind: 'update', code: diagnosticCode.updateAvailable, severity: 'info', message: 'x', currentVersion: '1.0.0', latestVersion: '2.0.0' },
    ]

    for (const diagnostic of diagnostics) expect(validate(schemas.diagnostic, diagnostic)).toStrictEqual([])
    expect(validate(schemas.diagnostic, { code: diagnosticCode.performance, severity: 'error', message: 'x' })).not.toStrictEqual([])
  })

  it('config.json covers every data field of Config', () => {
    const dataKeys = { name: true, root: true, input: true, output: true } satisfies Record<
      Exclude<keyof Config, 'parsers' | 'adapter' | 'storage' | 'plugins' | 'reporters'>,
      true
    >
    const outputKeys = { path: true, clean: true, format: true, lint: true, postGenerate: true, defaultBanner: true } satisfies Record<
      keyof Config['output'],
      true
    >
    const config = {
      name: 'api',
      root: '/project',
      input: { openapi: '3.1.0' },
      output: { path: './gen', clean: true, format: false, lint: 'auto', postGenerate: ['echo', { name: 'x', command: 'y' }], defaultBanner: 'simple' },
    } satisfies Omit<Config<Record<string, unknown>>, keyof Config & ('parsers' | 'adapter' | 'storage' | 'plugins' | 'reporters')>

    expect(Object.keys(schemas.config.properties)).toStrictEqual(Object.keys(dataKeys))
    expect(Object.keys(schemas.config.properties.output.properties)).toStrictEqual(Object.keys(outputKeys))
    expect(validate(schemas.config, config)).toStrictEqual([])
    expect(validate(schemas.config, { ...config, plugins: [] })).toContain('$.plugins: not allowed')
  })
})
