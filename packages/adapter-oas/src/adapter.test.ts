import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'

const minimalSpec = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/pets': {
      get: {
        operationId: 'listPets',
        responses: { '200': { description: 'ok' } },
      },
    },
  },
  components: {
    schemas: {
      Pet: {
        type: 'object',
        properties: { id: { type: 'string' }, name: { type: 'string' } },
        required: ['id'],
      },
      Category: {
        type: 'object',
        properties: { id: { type: 'integer' } },
      },
    },
  },
} as const

describe('adapterOas.parse', () => {
  it('emits nested OpenAPI 3.1 definitions and resolves their references', async () => {
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'Nested definitions', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            Box: {
              type: 'object',
              properties: { card: { $ref: '#/components/schemas/Box/$defs/Card' } },
              $defs: {
                Card: {
                  type: 'object',
                  properties: { next: { $ref: '#/components/schemas/Box/$defs/Card' } },
                },
              },
            },
          },
        },
      },
    })

    expect(node.schemas.map((schema) => schema.name)).toStrictEqual(['Box_Card', 'Box'])
    const box = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Box')!,
      'object',
    )
    expect(ast.narrowSchema(box!.properties[0]!.schema, 'ref')).toMatchObject({ targetName: 'Box_Card' })
  })

  it('parses each schema and operation', async () => {
    const adapter = adapterOas({ validate: false })

    const node = await adapter.parse({ type: 'data', data: minimalSpec })

    expect(node.schemas.map((s) => s.name)).toStrictEqual(['Pet', 'Category'])
    expect(node.operations.map((operation) => operation.operationId)).toStrictEqual(['listPets'])
  })

  it('links each schema, operation, parameter, request body and response to its JSON pointer, also for a renamed schema', async () => {
    const spec = {
      openapi: '3.0.3',
      info: { title: 'Links', version: '1.0.0' },
      paths: {
        '/pets/{id}': {
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          get: {
            operationId: 'getPet',
            parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer' } }],
            requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
            responses: { '200': { description: 'ok', content: { 'application/json': { schema: { $ref: '#/components/schemas/Pet' } } } } },
          },
        },
      },
      components: {
        schemas: { Pet: { type: 'object' } },
        responses: { Pet: { description: 'ok', content: { 'application/json': { schema: { type: 'string' } } } } },
      },
    }

    const node = await adapterOas({ validate: false }).parse({ type: 'data', data: spec })

    expect(node.schemas.map(({ name, pointer }) => ({ name, pointer }))).toStrictEqual([
      { name: 'PetSchema', pointer: '#/components/schemas/Pet' },
      { name: 'PetResponse', pointer: '#/components/responses/Pet/content/application~1json/schema' },
    ])
    const [operation] = node.operations
    expect(operation?.pointer).toBe('#/paths/~1pets~1{id}/get')
    expect(operation?.responses.map((response) => response.pointer)).toStrictEqual(['#/paths/~1pets~1{id}/get/responses/200'])
    expect(operation?.parameters.map(({ name, pointer }) => ({ name, pointer }))).toStrictEqual([
      { name: 'id', pointer: '#/paths/~1pets~1{id}/parameters/0' },
      { name: 'limit', pointer: '#/paths/~1pets~1{id}/get/parameters/0' },
    ])
    expect(operation?.requestBody?.pointer).toBe('#/paths/~1pets~1{id}/get/requestBody')
  })

  it('sets pointers on nested and operation schemas that locate resolves in the spec text', async () => {
    const spec = {
      openapi: '3.0.3',
      info: { title: 'Nested', version: '1.0.0' },
      paths: {
        '/pets': {
          post: {
            operationId: 'addPet',
            parameters: [{ name: 'tag', in: 'query', schema: { type: 'string' } }],
            requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } },
            responses: { '200': { description: 'ok', content: { 'application/json': { schema: { type: 'array', items: { type: 'string' } } } } } },
          },
        },
      },
      components: {
        schemas: {
          Pet: { type: 'object', properties: { tags: { type: 'array', items: { type: 'string' } } } },
          Shape: { oneOf: [{ type: 'string' }, { type: 'number' }] },
        },
        responses: {
          Error: { description: 'error', content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string' } } } } } },
        },
      },
    }
    const text = JSON.stringify(spec, null, 2)
    const adapter = adapterOas({ validate: false })
    const node = await adapter.parse({ type: 'data', data: spec })

    const pet = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Pet')!,
      'object',
    )!
    const tags = ast.narrowSchema(pet.properties[0]!.schema, 'array')!
    const error = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Error')!,
      'object',
    )!
    const shape = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Shape')!,
      'union',
    )!
    const [operation] = node.operations
    const body = ast.narrowSchema(operation!.requestBody!.content![0]!.schema!, 'object')!
    const pointers = [
      tags.pointer,
      tags.items![0]!.pointer,
      shape.members![1]!.pointer,
      operation!.parameters[0]!.schema.pointer,
      body.pointer,
      body.properties[0]!.schema.pointer,
      operation!.responses[0]!.content![0]!.schema!.pointer,
      error.properties[0]!.schema.pointer,
    ]

    expect(pointers).toStrictEqual([
      '#/components/schemas/Pet/properties/tags',
      '#/components/schemas/Pet/properties/tags/items',
      '#/components/schemas/Shape/oneOf/1',
      '#/paths/~1pets/post/parameters/0/schema',
      '#/paths/~1pets/post/requestBody/content/application~1json/schema',
      '#/paths/~1pets/post/requestBody/content/application~1json/schema/properties/name',
      '#/paths/~1pets/post/responses/200/content/application~1json/schema',
      '#/components/responses/Error/content/application~1json/schema/properties/code',
    ])
    for (const pointer of pointers) expect(adapter.locate!(text, { kind: 'schema', pointer: pointer! }), pointer).toBeDefined()
  })

  it('parses OpenAPI 3.2 query operations as QUERY', async () => {
    const spec = {
      openapi: '3.2.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/pets/search': {
          query: {
            operationId: 'searchPets',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { type: 'object', properties: { name: { type: 'string' } } },
                },
              },
            },
            responses: { '200': { description: 'ok' } },
          },
        },
      },
    } as const
    const adapter = adapterOas({ validate: false })

    const node = await adapter.parse({ type: 'data', data: spec })

    expect(node.operations).toHaveLength(1)
    expect(node.operations[0]).toMatchObject({ operationId: 'searchPets', method: 'QUERY', path: '/pets/search' })
    expect(node.operations[0]?.requestBody?.content?.[0]?.schema).toBeDefined()
  })

  it('parses each source when one adapter instance is reused across configs', async () => {
    const other = {
      openapi: '3.0.0',
      info: { title: 'Other API', version: '2.0.0' },
      paths: {},
      components: { schemas: { Order: { type: 'object', properties: { id: { type: 'string' } } } } },
    } as const

    // A `defineConfig` array shares one adapter instance across configs. Each source must produce
    // its own document instead of replaying the first one.
    const adapter = adapterOas({ validate: false })

    const first = await adapter.parse({ type: 'data', data: minimalSpec })
    const second = await adapter.parse({ type: 'data', data: other })

    expect(first.schemas.map((s) => s.name)).toStrictEqual(['Pet', 'Category'])
    expect(second.schemas.map((s) => s.name)).toStrictEqual(['Order'])
    expect(second.meta?.title).toBe('Other API')
  })

  it('exposes meta', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.parse({ type: 'data', data: minimalSpec })

    expect(node.meta).toMatchObject({
      baseURL: null,
      circularNames: [],
      enumNames: [],
      title: 'Test API',
      version: '1.0.0',
      servers: [],
      securitySchemes: [],
    })
  })

  it('carries x-* vendor extensions on the operation and the document root', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.parse({
      type: 'data',
      data: {
        ...minimalSpec,
        'x-org-constants': { retries: 3 },
        paths: {
          '/pets': {
            'x-org-path': true,
            get: { ...minimalSpec.paths['/pets'].get, 'x-org-ignore': true, 'x-org-streaming': false },
            post: { operationId: 'createPet', responses: { '200': { description: 'ok' } } },
          },
        },
      },
    })

    expect(node.meta.extensions).toEqual({ 'x-org-constants': { retries: 3 } })
    expect(node.operations[0]?.extensions).toEqual({ 'x-org-ignore': true, 'x-org-streaming': false })
    expect(node.operations[1]?.extensions).toBeUndefined()
  })

  it('lists servers with variable defaults filled in and resolves a referenced security scheme', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.parse({
      type: 'data',
      data: {
        ...minimalSpec,
        servers: [
          { url: 'https://{env}.example.com', description: 'Main', variables: { env: { default: 'api' } } },
          { url: 'https://{env}.example.com', variables: { env: { default: 'staging', enum: ['dev', 'prod'] } } },
        ],
        components: {
          securitySchemes: {
            bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            shared: { $ref: '#/components/securitySchemes/bearer' },
          },
        },
      },
    })

    expect(node.meta.servers).toEqual([
      { url: 'https://api.example.com', description: 'Main', variables: { env: { default: 'api' } } },
      { url: 'https://{env}.example.com', variables: { env: { default: 'staging', enum: ['dev', 'prod'] } } },
    ])
    expect(node.meta.securitySchemes).toEqual([
      { name: 'bearer', type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      { name: 'shared', type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    ])
  })

  it('leaves variables off a server that declares none', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.parse({
      type: 'data',
      data: { ...minimalSpec, servers: [{ url: '/api' }, { url: '/v1', variables: {} }] },
    })

    expect(node.meta.servers).toEqual([{ url: '/api' }, { url: '/v1' }])
    expect(node.meta.servers?.[0]).not.toHaveProperty('variables')
  })

  it('lists the servers and security schemes of a Swagger 2.0 document', async () => {
    const adapter = adapterOas({ validate: false })
    const node = await adapter.parse({
      type: 'data',
      data: {
        swagger: '2.0',
        info: { title: 'Legacy', version: '1' },
        host: 'api.example.com',
        basePath: '/v2',
        schemes: ['https'],
        securityDefinitions: { api_key: { type: 'apiKey', in: 'header', name: 'X-API-Key' } },
        paths: {},
      },
    })

    expect(node.meta.servers).toEqual([{ url: 'https://api.example.com/v2' }])
    expect(node.meta.securitySchemes).toEqual([{ name: 'api_key', type: 'apiKey', in: 'header', parameterName: 'X-API-Key' }])
  })
})

describe('adapterOas options', () => {
  const discriminatedSpec = {
    openapi: '3.0.0',
    info: { title: 'Pets', version: '1.0.0' },
    paths: {},
    components: {
      schemas: {
        Pet: {
          oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
          discriminator: { propertyName: 'petType', mapping: { cat: '#/components/schemas/Cat', dog: '#/components/schemas/Dog' } },
        },
        Cat: { type: 'object', required: ['petType'], properties: { petType: { type: 'string' }, name: { type: 'string' } } },
        Dog: { type: 'object', properties: { bark: { type: 'boolean' } } },
      },
    },
  } as const

  it('leaves child schemas as written for discriminator: preserve (default)', async () => {
    const node = await adapterOas({ validate: false }).parse({ type: 'data', data: discriminatedSpec })

    const cat = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Cat')!,
      'object',
    )
    const dog = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Dog')!,
      'object',
    )

    expect(cat?.properties.find((property) => property.name === 'petType')?.schema.type).toBe('string')
    expect(dog?.properties.map((property) => property.name)).toStrictEqual(['bark'])
  })

  it('pins the discriminator property to its mapping key on each child for discriminator: propagate', async () => {
    const node = await adapterOas({ validate: false, discriminator: 'propagate' }).parse({ type: 'data', data: discriminatedSpec })

    const cat = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Cat')!,
      'object',
    )
    const dog = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Dog')!,
      'object',
    )

    // An existing property is replaced in place, a missing one is appended.
    expect(cat?.properties.map((property) => property.name)).toStrictEqual(['petType', 'name'])
    expect(cat?.properties[0]).toMatchObject({ name: 'petType', required: true, schema: { type: 'enum', enumValues: ['cat'] } })
    expect(dog?.properties.map((property) => property.name)).toStrictEqual(['bark', 'petType'])
    expect(dog?.properties[1]).toMatchObject({ name: 'petType', required: true, schema: { type: 'enum', enumValues: ['dog'] } })
  })

  it.each([
    { type: 'integer', keys: ['1', '2'], expected: [[1], [2]] },
    { type: 'number', keys: ['1.5', '2'], expected: [[1.5], [2]] },
    { type: 'boolean', keys: ['True', 'false'], expected: [[true], [false]] },
    { type: 'string', keys: ['1', '2'], expected: [['1'], ['2']] },
    { type: 'integer', keys: ['one', '2'], expected: [['one'], [2]] },
  ])('coerces mapping keys to the discriminator property type $type $keys', async ({ type, keys, expected }) => {
    const child = () => ({ type: 'object', required: ['kind'], properties: { kind: { type } } })
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            Parent: {
              oneOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }],
              discriminator: { propertyName: 'kind', mapping: { [keys[0]!]: '#/components/schemas/A', [keys[1]!]: '#/components/schemas/B' } },
            },
            A: child(),
            B: child(),
          },
        },
      },
    })

    const union = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Parent')!,
      'union',
    )
    const values = union?.members?.map((member) => {
      const discriminant = ast.narrowSchema(ast.narrowSchema(member, 'intersection')!.members![1]!, 'object')
      return ast.narrowSchema(discriminant!.properties[0]!.schema, 'enum')?.enumValues
    })

    expect(values).toStrictEqual(expected)
  })

  it('coerces mapping keys when the discriminator property is a $ref', async () => {
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            Kind: { type: 'integer' },
            Parent: {
              type: 'object',
              properties: { kind: { $ref: '#/components/schemas/Kind' } },
              discriminator: { propertyName: 'kind', mapping: { '1': '#/components/schemas/A', '2': '#/components/schemas/B' } },
            },
            A: { type: 'object', properties: { kind: { type: 'integer' } } },
            B: { type: 'object', properties: { kind: { type: 'integer' } } },
          },
        },
      },
    })

    const parent = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Parent')!,
      'object',
    )

    expect(ast.narrowSchema(parent!.properties[0]!.schema, 'enum')?.enumValues).toStrictEqual([1, 2])
  })

  it('coerces mapping keys when the shared discriminator property is a $ref', async () => {
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            Kind: { type: 'integer' },
            Parent: {
              oneOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }],
              properties: { kind: { $ref: '#/components/schemas/Kind' } },
              discriminator: { propertyName: 'kind', mapping: { '1': '#/components/schemas/A', '2': '#/components/schemas/B' } },
            },
            A: { type: 'object', properties: { name: { type: 'string' } } },
            B: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      },
    })

    const parent = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Parent')!,
      'intersection',
    )
    const union = ast.narrowSchema(parent!.members![0]!, 'union')
    const values = union?.members?.map((member) => {
      const discriminant = ast.narrowSchema(ast.narrowSchema(member, 'intersection')!.members![1]!, 'object')
      return ast.narrowSchema(discriminant!.properties[0]!.schema, 'enum')?.enumValues
    })

    expect(values).toStrictEqual([[1], [2]])
  })

  it.each([
    { title: 'a nullable type array', member: { type: 'object', properties: { kind: { type: ['integer', 'null'] } } } },
    { title: 'an allOf member', member: { allOf: [{ type: 'object', properties: { kind: { type: 'integer' } } }] } },
    { title: 'a $ref inside allOf', member: { allOf: [{ $ref: '#/components/schemas/Base' }] } },
  ])('coerces mapping keys when the member declares the discriminator through $title', async ({ member }) => {
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            Base: { type: 'object', properties: { kind: { type: 'integer' } } },
            Parent: {
              oneOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }],
              discriminator: { propertyName: 'kind', mapping: { '1': '#/components/schemas/A', '2': '#/components/schemas/B' } },
            },
            A: member,
            B: member,
          },
        },
      },
    })

    const union = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Parent')!,
      'union',
    )
    const values = union?.members?.map((member) => {
      const discriminant = ast.narrowSchema(ast.narrowSchema(member, 'intersection')!.members!.at(-1)!, 'object')
      return ast.narrowSchema(discriminant!.properties[0]!.schema, 'enum')?.enumValues
    })

    expect(values).toStrictEqual([[1], [2]])
  })

  it('keeps a nested discriminator in an allOf child from collapsing to never', async () => {
    const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            Foo: {
              type: 'object',
              required: ['$type'],
              properties: { $type: { type: 'string' } },
              discriminator: { propertyName: '$type', mapping: { FooBar: '#/components/schemas/Bar', FooBaz: '#/components/schemas/Baz' } },
            },
            Bar: {
              allOf: [
                ref('Foo'),
                {
                  type: 'object',
                  required: ['$type'],
                  properties: { $type: { type: 'string' }, bar: { type: 'string' } },
                  discriminator: { propertyName: '$type', mapping: { BarQux: '#/components/schemas/Qux' } },
                },
              ],
            },
            Baz: { allOf: [ref('Foo'), { type: 'object', properties: { baz: { type: 'string' } } }] },
            Qux: { allOf: [ref('Bar'), { type: 'object', properties: { qux: { type: 'string' } } }] },
          },
        },
      },
    })

    const typeValues = (name: string) =>
      ast
        .narrowSchema(
          node.schemas.find((schema) => schema.name === name)!,
          'intersection',
        )
        ?.members?.flatMap((member) => ast.narrowSchema(member, 'object')?.properties ?? [])
        .filter((property) => property.name === '$type')
        .map((property) => ast.narrowSchema(property.schema, 'enum')?.enumValues ?? property.schema.type)

    const foo = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Foo')!,
      'object',
    )
    const fooValues = ast.narrowSchema(foo!.properties[0]!.schema, 'enum')?.enumValues

    expect(fooValues).toStrictEqual(['FooBar', 'BarQux', 'FooBaz'])
    expect(typeValues('Bar')).toStrictEqual(['string'])
    expect(typeValues('Qux')).toStrictEqual([['BarQux']])
  })

  it('keeps a nested discriminator in a child of a oneOf parent from collapsing to never', async () => {
    const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            Foo: {
              oneOf: [ref('Bar'), ref('Baz')],
              discriminator: { propertyName: '$type', mapping: { FooBar: '#/components/schemas/Bar', FooBaz: '#/components/schemas/Baz' } },
            },
            Bar: {
              allOf: [
                ref('Foo'),
                {
                  type: 'object',
                  properties: { $type: { type: 'string' } },
                  discriminator: { propertyName: '$type', mapping: { BarQux: '#/components/schemas/Qux' } },
                },
              ],
            },
            Baz: { allOf: [ref('Foo'), { type: 'object', properties: { baz: { type: 'string' } } }] },
            Qux: { type: 'object', properties: { qux: { type: 'string' } } },
          },
        },
      },
    })

    const members = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Bar')!,
      'intersection',
    )?.members
    const values = members
      ?.flatMap((member) => ast.narrowSchema(member, 'object')?.properties ?? [])
      .map((property) => ast.narrowSchema(property.schema, 'enum')?.enumValues ?? property.schema.type)

    expect(values).toStrictEqual(['string', ['FooBar']])
  })

  it('names a ref to a component whose key holds ~ and / after the component itself', async () => {
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        paths: {},
        components: {
          schemas: {
            Tilde: { type: 'object', properties: { t: { $ref: '#/components/schemas/a~1b~0c' } } },
            'a/b~c': { type: 'string' },
          },
        },
      },
    })

    const tilde = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Tilde')!,
      'object',
    )
    const ref = ast.narrowSchema(tilde!.properties[0]!.schema, 'ref')

    expect([ref?.name, ref?.schema?.type]).toStrictEqual(['a/b~c', 'string'])
    expect(node.schemas.map((schema) => schema.name)).toContain('a/b~c')
  })

  it('resolves a $ref cycle between aliases, or an alias to itself, to unknown instead of a self-referencing type', async () => {
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.0',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            Baz: { $ref: '#/components/schemas/Qux' },
            Qux: { description: 'circular', $ref: '#/components/schemas/Baz' },
            Pet: { type: 'object', properties: { id: { type: 'string' } } },
            Dog: { $ref: '#/components/schemas/Pet' },
            Self: { $ref: '#/components/schemas/Self' },
          },
        },
      },
    })

    expect(Object.fromEntries(node.schemas.map((schema) => [schema.name, schema.type]))).toStrictEqual({
      Baz: 'unknown',
      Qux: 'unknown',
      Self: 'unknown',
      Pet: 'object',
      Dog: 'object',
    })
  })

  it('keeps a single-member allOf around a union ref as a ref instead of treating it as a cycle', async () => {
    const node = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.0.3',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            Pet: { oneOf: [{ type: 'string' }, { type: 'number' }] },
            Wrapped: { allOf: [{ $ref: '#/components/schemas/Pet' }] },
          },
        },
      },
    })

    expect(node.schemas.find((schema) => schema.name === 'Wrapped')?.type).toBe('ref')
  })

  it('lifts inline enums to named root schemas and refs them for enums: root', async () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['available', 'sold'] } }],
            responses: { '200': { description: 'ok' } },
          },
        },
      },
      components: {
        schemas: {
          Pet: { type: 'object', properties: { status: { type: 'string', enum: ['available', 'sold'] } } },
        },
      },
    } as const

    const node = await adapterOas({ validate: false, enums: 'root' }).parse({ type: 'data', data: spec })

    expect(node.schemas.map((schema) => schema.name)).toStrictEqual(['PetStatusEnum', 'ListPetsStatus', 'Pet'])
    expect(node.schemas[0]).toMatchObject({ type: 'enum', name: 'PetStatusEnum', enumValues: ['available', 'sold'] })
    expect(node.meta?.enumNames).toStrictEqual(['PetStatusEnum', 'ListPetsStatus'])

    const pet = ast.narrowSchema(
      node.schemas.find((schema) => schema.name === 'Pet')!,
      'object',
    )
    expect(pet?.properties[0]?.schema).toMatchObject({ type: 'ref', name: 'PetStatusEnum', ref: '#/components/schemas/PetStatusEnum' })

    const status = node.operations[0]?.parameters.find((parameter) => parameter.name === 'status')
    expect(status?.schema).toMatchObject({ type: 'ref', name: 'ListPetsStatus', ref: '#/components/schemas/ListPetsStatus' })
  })

  it('keeps inline enums on their property for enums: inline (default)', async () => {
    const spec = {
      openapi: '3.0.0',
      info: { title: 'Pets', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Pet: { type: 'object', properties: { status: { type: 'string', enum: ['available', 'sold'] } } },
        },
      },
    } as const

    const node = await adapterOas({ validate: false }).parse({ type: 'data', data: spec })

    expect(node.schemas.map((schema) => schema.name)).toStrictEqual(['Pet'])
    expect(node.meta?.enumNames).toStrictEqual([])
    const pet = ast.narrowSchema(node.schemas[0]!, 'object')
    expect(pet?.properties[0]?.schema).toMatchObject({ type: 'enum', name: 'PetStatusEnum', enumValues: ['available', 'sold'] })
  })
})

describe('adapterOas options', () => {
  it('keeps the options it was created with, before defaults', () => {
    expect(adapterOas().options).toStrictEqual({})
    expect(adapterOas({ unknownType: 'any' }).options).toStrictEqual({ unknownType: 'any' })
  })
})

describe('adapterOas ref targetName', () => {
  it('stamps schema and operation refs to a collision-renamed schema with the renamed name', async () => {
    const adapter = adapterOas()

    // `Order` exists in both `schemas` and `requestBodies`, so the schema is renamed to `OrderSchema`.
    // A `$ref` to it must resolve to `OrderSchema`, not the bare `Order` (whose file is never emitted).
    const node = await adapter.parse({
      type: 'data',
      data: {
        openapi: '3.0.0',
        info: { title: 'test', version: '1.0.0' },
        paths: {
          '/orders/{orderId}': {
            get: {
              operationId: 'getOrder',
              responses: {
                '200': {
                  description: 'ok',
                  content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            Order: { type: 'object', properties: { id: { type: 'string' } } },
            OrderList: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
          },
          requestBodies: {
            Order: { content: { 'application/json': { schema: { type: 'object', properties: { userId: { type: 'string' } } } } } },
          },
        },
      },
    })

    expect(node.schemas.map((schema) => schema.name)).toContain('OrderSchema')

    const orderList = node.schemas.find((schema) => schema.name === 'OrderList')
    const items = ast.narrowSchema(orderList!, 'array')?.items ?? []
    const schemaRef = ast.narrowSchema(items[0]!, 'ref')

    expect(schemaRef?.targetName).toBe('OrderSchema')
    expect(ast.resolveRefName(schemaRef)).toBe('OrderSchema')

    const responseRef = ast.narrowSchema(node.operations[0]!.responses[0]!.content![0]!.schema!, 'ref')

    expect(responseRef?.targetName).toBe('OrderSchema')
    expect(ast.resolveRefName(responseRef)).toBe('OrderSchema')
  })
})
