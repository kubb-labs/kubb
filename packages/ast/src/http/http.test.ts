import { describe, expect, it, test } from 'vitest'
import type { ResponseNode, StatusCode } from '../nodes/response.ts'
import type { ParameterNode } from '../nodes/parameter.ts'
import { createContent, createOperation, createProperty, createRequestBody, createResponse, createSchema } from '../nodes/index.ts'
import type { SchemaNode } from '../nodes/schema.ts'
import { getKind } from '../mediaType/index.ts'
import type { ContentNode } from '../nodes/content.ts'
import type { HttpOperationNode, OperationNode } from '../nodes/operation.ts'
import { getBaseURL, getRequestGroups, groupParameters, requestBody, responses, status } from './index.ts'

// Like the adapter, a body-less response keeps one entry with an empty `contentType`.
function response(statusCode: StatusCode, withBody = false): ResponseNode {
  return { kind: 'Response', statusCode, content: [{ kind: 'Content', contentType: withBody ? 'application/json' : '' }] } as ResponseNode
}

describe('http.status', () => {
  it.each([
    ['201', 2],
    ['2xx', 2],
    [404, 4],
    ['default', null],
  ] as const)('class(%s) is %s', (code, expected) => {
    expect(status.getClass(code)).toBe(expected)
  })

  it('tells successes from errors', () => {
    expect(status.isSuccess('2xx')).toBe(true)
    expect(status.isError('5xx')).toBe(true)
    expect(status.isError('default')).toBe(false)
    expect(status.isSuccess('default')).toBe(false)
  })
})

describe('http.responses', () => {
  it('lists success responses', () => {
    expect(responses.filterSuccess({ responses: [response('200'), response('404'), response('2xx')] }).map((r) => r.statusCode)).toEqual(['200', '2xx'])
  })

  it('prefers a body, then an exact code', () => {
    expect(responses.findPrimary({ responses: [response('204'), response('2xx', true), response('201', true)] })?.statusCode).toBe('201')
    expect(responses.findPrimary({ responses: [response('2xx'), response('204')] })?.statusCode).toBe('204')
    expect(responses.findPrimary({ responses: [response('204'), response('200', true)] })?.statusCode).toBe('200')
    expect(responses.findPrimary({ responses: [response('404')] })).toBeNull()
  })

  it('lists error responses', () => {
    expect(responses.filterError({ responses: [response('200'), response('404'), response('5xx'), response('default')] }).map((r) => r.statusCode)).toEqual([
      '404',
      '5xx',
    ])
  })

  it('collects the ref names the response bodies import', () => {
    const pet = createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' })
    const error = createSchema({ type: 'ref', name: 'Error', ref: '#/components/schemas/Error' })
    const withSchema = (statusCode: StatusCode, schema: ReturnType<typeof createSchema>) =>
      createResponse({ statusCode, content: [createContent({ contentType: 'application/json', schema })] })

    expect(responses.getImportedNames([withSchema('200', pet), response('204'), withSchema('404', error)])).toEqual(['Pet', 'Error'])
  })
})

describe('http.requestBody', () => {
  it('gives the first entry schema, or undefined without a body', () => {
    const schema = createSchema({ type: 'string' })
    const body = createRequestBody({ content: [createContent({ contentType: 'text/plain', schema })] })

    expect(requestBody.getSchema({ requestBody: body })).toBe(schema)
    expect(requestBody.getSchema({ requestBody: undefined })).toBeUndefined()
  })
})

describe('http.getBaseURL', () => {
  it('keeps only absolute, untemplated URLs', () => {
    expect(getBaseURL({ url: 'https://api.example.com/v2' })).toBe('https://api.example.com/v2')
    expect(getBaseURL({ url: '/v2' })).toBeUndefined()
    expect(getBaseURL({ url: 'https://{env}.example.com' })).toBeUndefined()
    expect(getBaseURL({ url: 'https://dev.example.com', variables: { env: { default: 'dev' } } })).toBeUndefined()
    expect(getBaseURL(undefined)).toBeUndefined()
  })
})

describe('http.status.toCode', () => {
  it.each([
    ['2xx', 200],
    ['4xx', 400],
    ['default', 200],
    ['201', 201],
  ] as const)('toCode(%s) is %s', (code, expected) => {
    expect(status.toCode(code)).toBe(expected)
  })
})

describe('http.groupParameters', () => {
  it('groups by location and keeps the first of a repeated name', () => {
    const param = (name: string, location: ParameterNode['in']) => ({ kind: 'Parameter', name, in: location }) as ParameterNode
    const groups = groupParameters({ parameters: [param('id', 'path'), param('q', 'query'), param('q', 'query'), param('x', 'header'), param('s', 'cookie')] })
    expect(Object.fromEntries(Object.entries(groups).map(([key, list]) => [key, list.map((p) => p.name)]))).toEqual({
      path: ['id'],
      query: ['q'],
      header: ['x'],
      cookie: ['s'],
    })
  })

  it('builds the groups once per node', () => {
    const node = { parameters: [{ kind: 'Parameter', name: 'id', in: 'path' } as ParameterNode] }
    expect(groupParameters(node)).toBe(groupParameters(node))
  })
})

describe('http.groupParameters querystring', () => {
  it('puts a whole querystring parameter in the query group after the query parameters', () => {
    const param = (name: string, location: ParameterNode['in']) => ({ kind: 'Parameter', name, in: location }) as ParameterNode
    expect(
      groupParameters({ parameters: [param('filter', 'querystring'), param('page', 'query'), param('page', 'querystring')] }).query.map((p) => p.name),
    ).toEqual(['page', 'filter'])
  })
})

describe('http.status with a response', () => {
  it('reads the status code from the response', () => {
    expect(status.isSuccess({ statusCode: '201' })).toBe(true)
    expect(status.isError({ statusCode: '4xx' })).toBe(true)
    expect(status.toCode({ statusCode: 'default' })).toBe(200)
  })
})

describe('http.getRequestGroups', () => {
  const param = (name: string, location: ParameterNode['in'], required = false) =>
    ({ kind: 'Parameter', name, in: location, required, schema: createSchema({ type: 'string' }) }) as ParameterNode
  const schema = createSchema({ type: 'string' })

  it('summarizes the groups, required members and body media types', () => {
    const node = {
      parameters: [param('id', 'path', true), param('q', 'query'), param('session', 'cookie', true)],
      requestBody: createRequestBody({
        required: true,
        content: [createContent({ contentType: 'application/json', schema }), createContent({ contentType: 'multipart/form-data', schema })],
      }),
    }

    expect(getRequestGroups(node)).toStrictEqual({
      path: true,
      query: true,
      body: true,
      headers: false,
      cookies: true,
      required: { path: true, query: false, headers: false, body: true },
      isOptional: false,
      contentTypes: ['application/json', 'multipart/form-data'],
      hasContentTypeChoice: true,
    })
    expect(getRequestGroups(node)).toBe(getRequestGroups(node))
  })

  it('is optional when only cookies are required', () => {
    expect(getRequestGroups({ parameters: [param('session', 'cookie', true)] }).isOptional).toBe(true)
  })
})

describe('http.responses.getStream', () => {
  const stream = (contentType: string, extra: Partial<ContentNode> = {}) => createContent({ contentType, stream: {}, ...extra })
  const operation = (...content: Array<ContentNode>) => ({ responses: [createResponse({ statusCode: '200', content })] })

  it('is null without a stream', () => {
    expect(responses.getStream(operation(createContent({ contentType: 'application/json', schema: createSchema({ type: 'string' }) })))).toBeNull()
  })

  it('reads a JSON Lines response', () => {
    expect(responses.getStream(operation(stream('application/jsonl')))).toStrictEqual({
      shape: 'line',
      textEvents: false,
      hasEventStream: false,
      hasVariant: false,
    })
  })

  it('keeps string data of an event stream as text', () => {
    const data = createSchema({ type: 'string' })
    expect(responses.getStream(operation(stream('text/event-stream', { schema: data, stream: { schema: data, shape: 'data' } })))).toMatchObject({
      shape: 'data',
      textEvents: true,
      hasEventStream: true,
    })
  })

  it('flags a stream variant next to another content type', () => {
    const schema = createSchema({ type: 'string' })
    expect(responses.getStream(operation(createContent({ contentType: 'application/json', schema }), stream('application/jsonl', { schema })))).toMatchObject({
      shape: null,
      hasVariant: true,
    })
  })
})

describe('http.responses.getUnion', () => {
  const resolver = { response: { status: (_: unknown, statusCode: StatusCode) => `Status${statusCode}` } }
  const node = (...items: Array<ResponseNode>) =>
    ({ operationId: 'x', method: 'GET', path: '/', protocol: 'http', responses: items }) as unknown as HttpOperationNode
  const withSchema = (statusCode: StatusCode) =>
    createResponse({ statusCode, content: [createContent({ contentType: 'application/json', schema: createSchema({ type: 'string' }) })] })

  it('unions the success responses with a body', () => {
    const union = responses.getUnion(node(withSchema('200'), response('204'), withSchema('404')), resolver)
    expect(union).toMatchObject({ type: 'union', members: [{ type: 'ref', name: 'Status200' }] })
  })

  it('falls back to every response with a body, or null', () => {
    expect(responses.getUnion(node(withSchema('404')), resolver)).toMatchObject({ members: [{ name: 'Status404' }] })
    expect(responses.getUnion(node(response('204')), resolver)).toBeNull()
  })
})
describe('http.responses.getStream on stream responses', () => {
  const textEvents = (node: OperationNode) => responses.getStream(node)?.textEvents ?? false

  function nodeWithResponseContentType(mediaType: string): OperationNode {
    return createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [
        createResponse({
          statusCode: '200',
          content: [createContent({ contentType: mediaType, schema: createSchema({ type: 'object' }), stream: {} })],
        }),
      ],
    })
  }

  test('reads text/event-stream as a stream, ignoring a charset suffix', () => {
    expect(Boolean(responses.getStream(nodeWithResponseContentType('text/event-stream'))?.shape)).toBe(true)
    expect(Boolean(responses.getStream(nodeWithResponseContentType('text/event-stream; charset=utf-8'))?.shape)).toBe(true)
  })

  test('keeps an operation that declares another content type next to text/event-stream a normal call', () => {
    const node = createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [
        createResponse({
          statusCode: '200',
          content: [
            createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) }),
            createContent({ contentType: 'text/event-stream', schema: createSchema({ type: 'string' }) }),
          ],
        }),
      ],
    })

    expect(Boolean(responses.getStream(node)?.shape)).toBe(false)
    expect(Boolean(responses.getStream(node)?.hasEventStream)).toBe(true)
    expect(responses.getStream(node)?.shape ?? null).toBeNull()
  })

  test('ignores a schema-less text/event-stream next to another content type', () => {
    const node = createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [
        createResponse({
          statusCode: '200',
          content: [
            createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) }),
            createContent({ contentType: 'text/event-stream' }),
          ],
        }),
      ],
    })

    expect(Boolean(responses.getStream(node)?.hasEventStream)).toBe(false)
  })

  test('finds a stream media type next to another content type on any success response', () => {
    const operation = (contentTypes: Array<string>, schema: SchemaNode | null = createSchema({ type: 'object' })) =>
      createOperation({
        operationId: 'getUpdates',
        method: 'GET',
        path: '/updates',
        responses: [
          createResponse({ statusCode: '200', description: 'no body' }),
          createResponse({ statusCode: '202', content: contentTypes.map((contentType) => createContent({ contentType, schema: schema ?? undefined })) }),
        ],
      })

    expect(Boolean(responses.getStream(operation(['application/json', 'application/jsonl']))?.hasVariant)).toBe(true)
    expect(Boolean(responses.getStream(operation(['application/json', 'text/event-stream; charset=utf-8']))?.hasVariant)).toBe(true)
    expect(Boolean(responses.getStream(operation(['application/json', 'application/geo+json-seq']))?.hasVariant)).toBe(true)
    expect(Boolean(responses.getStream(operation(['application/json', 'application/xml']))?.hasVariant)).toBe(false)
    // A lone stream is a stream operation, and a variant without a schema is not typed.
    expect(Boolean(responses.getStream(operation(['application/jsonl']))?.hasVariant)).toBe(false)
    expect(Boolean(responses.getStream(operation(['application/json', 'application/jsonl'], null))?.hasVariant)).toBe(false)
  })

  test('reads the item shape of the stream', () => {
    const textItem = createOperation({
      operationId: 'streamLines',
      method: 'GET',
      path: '/lines',
      responses: [
        createResponse({
          statusCode: '200',
          content: [createContent({ contentType: 'text/event-stream', schema: createSchema({ type: 'string' }), stream: {} })],
        }),
      ],
    })
    const member = (name: string, data: SchemaNode) =>
      createSchema({
        type: 'object',
        properties: [
          createProperty({ name: 'event', required: true, schema: createSchema({ type: 'enum', enumValues: [name] }) }),
          createProperty({ name: 'data', schema: data }),
        ],
      })
    const union = createSchema({
      type: 'union',
      members: [member('delta', createSchema({ type: 'object' })), member('ping', createSchema({ type: 'string' }))],
    })
    const typedEvents = createOperation({
      operationId: 'streamChat',
      method: 'POST',
      path: '/chat',
      responses: [
        createResponse({
          statusCode: '200',
          content: [createContent({ contentType: 'text/event-stream', schema: union, stream: { schema: union, shape: 'event' } })],
        }),
      ],
    })

    expect(responses.getStream(textItem)?.shape ?? null).toBe('data')
    expect(responses.getStream(typedEvents)?.shape ?? null).toBe('event')
  })

  test('keeps event data as text only when every event types it as a string', () => {
    const sse = (schema: SchemaNode | undefined, stream: ContentNode['stream'] = {}) =>
      createOperation({
        operationId: 'streamEvents',
        method: 'GET',
        path: '/events',
        responses: [createResponse({ statusCode: '200', content: [createContent({ contentType: 'text/event-stream', schema, stream })] })],
      })
    const string = createSchema({ type: 'string' })
    const event = (data: SchemaNode) => createSchema({ type: 'object', properties: [createProperty({ name: 'data', schema: data })] })
    const events = (...members: Array<SchemaNode>) => createSchema({ type: 'union', members: members.map(event) })

    expect(textEvents(sse(string))).toBe(true)
    expect(textEvents(sse(string, { schema: string, shape: 'data' }))).toBe(true)
    expect(textEvents(sse(event(string), { schema: event(string), shape: 'event' }))).toBe(true)
    expect(textEvents(sse(undefined, { schema: events(string, string), shape: 'event' }))).toBe(true)
    // Only some events type `data` as a string: named events keep theirs as text, an unnamed one cannot be told apart.
    const named = (name: string, data: SchemaNode) =>
      createSchema({
        type: 'object',
        properties: [
          createProperty({ name: 'event', schema: createSchema({ type: 'enum', enumValues: [name] }) }),
          createProperty({ name: 'data', schema: data }),
        ],
      })
    const mixed = createSchema({ type: 'union', members: [named('note', string), named('tick', createSchema({ type: 'object' }))] })
    expect(textEvents(sse(undefined, { schema: mixed, shape: 'event' }))).toStrictEqual(['note'])
    // A discriminator intersects each event with its pinned name.
    const pinned = createSchema({ type: 'intersection', members: [event(string), named('note', string)] })
    expect(textEvents(sse(undefined, { schema: pinned, shape: 'event' }))).toBe(true)
    // A schema-less stream reads as a blob and keeps the JSON-parse default.
    expect(textEvents(sse(createSchema({ type: 'blob', primitive: 'string' })))).toBe(false)
    expect(textEvents(sse(createSchema({ type: 'object' })))).toBe(false)
    expect(textEvents(sse(undefined, { schema: events(string, createSchema({ type: 'object' })), shape: 'event' }))).toBe(false)
    expect(textEvents(nodeWithResponseContentType('application/json'))).toBe(false)
  })

  test.each([
    ['application/jsonl', 'line'],
    ['application/x-ndjson', 'line'],
    ['application/json-seq', 'line'],
    ['multipart/mixed', null],
    // No stream handler in the client runtime reads this type.
    ['application/x-jsonlines', null],
  ])('reads %s the adapter marks as a stream as %s', (contentType, shape) => {
    const schema = createSchema({ type: 'object' })
    const node = createOperation({
      operationId: 'streamLogs',
      method: 'GET',
      path: '/logs',
      responses: [
        createResponse({
          statusCode: '200',
          content: [createContent({ contentType: contentType, schema: schema, stream: { schema } })],
        }),
      ],
    })

    expect(responses.getStream(node)?.shape ?? null).toBe(shape)
  })

  test('keeps JSON and binary responses a normal call', () => {
    expect(Boolean(responses.getStream(nodeWithResponseContentType('application/json'))?.shape)).toBe(false)
    expect(Boolean(responses.getStream(nodeWithResponseContentType('application/json'))?.hasEventStream)).toBe(false)
    expect(Boolean(responses.getStream(nodeWithResponseContentType('application/octet-stream'))?.shape)).toBe(false)
  })

  test('keeps a binary body next to an event stream a normal call', () => {
    const node = nodeWithResponseContents([
      { contentType: 'audio/mpeg', schemaType: 'blob' },
      { contentType: 'text/event-stream; charset=utf-8', schemaType: 'object' },
    ])

    expect(Boolean(responses.getStream(node)?.shape)).toBe(false)
    expect(Boolean(responses.getStream(node)?.hasEventStream)).toBe(true)
  })
})

function nodeWithResponseContents(entries: Array<{ contentType: string; schemaType: 'blob' | 'object' }>): OperationNode {
  return createOperation({
    operationId: 'speech',
    method: 'POST',
    path: '/speech',
    responses: [
      createResponse({
        statusCode: '200',
        content: entries.map((entry) => createContent({ contentType: entry.contentType, schema: createSchema({ type: entry.schemaType }), stream: {} })),
      }),
    ],
  })
}

describe('mediaType.getKind on stream entries', () => {
  test.each([
    ['text/event-stream without framing', { contentType: 'text/event-stream; charset=utf-8' }, 'eventStream'],
    ['JSON Lines without framing', { contentType: 'application/jsonl', stream: {} }, 'lineStream'],
    ['multipart/mixed with an item schema', { contentType: 'multipart/mixed', stream: {} }, null],
    ['plain JSON', { contentType: 'application/json' }, 'json'],
  ] as const)('%s', (_, entry, expected) => {
    expect(getKind(entry)).toBe(expected)
  })
})
