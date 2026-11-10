import { describe, expect, it } from 'vitest'
import type { Document } from '../types.ts'
import { resolveBaseUrl, resolveServerUrl, toInputServers } from './server.ts'

const minimalSpec: Document = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com/v1' }],
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
    },
  },
}

describe('resolveBaseUrl', () => {
  it('returns the server URL at the given index', () => {
    expect(resolveBaseUrl({ document: minimalSpec, server: { index: 0 } })).toBe('https://api.example.com/v1')
  })

  it.each([
    { title: 'no server index is provided', server: {} },
    { title: 'no server is provided', server: undefined },
    { title: 'the server index is out of range', server: { index: 99 } },
  ])('returns null when $title', ({ server }) => {
    expect(resolveBaseUrl({ document: minimalSpec, server })).toBeNull()
  })
})

describe('resolveServerUrl', () => {
  it('replaces variables from the override, falling back to the variable default', () => {
    expect(
      resolveServerUrl(
        {
          url: 'https://{env}.api.example.com/{version}',
          variables: { env: { default: 'dev', enum: ['dev', 'prod'] }, version: { default: 'v1' } },
        },
        { env: 'prod' },
      ),
    ).toBe('https://prod.api.example.com/v1')
  })

  it('throws when an override value is not in the allowed enum list', () => {
    expect(() =>
      resolveServerUrl(
        {
          url: 'https://{env}.api.example.com',
          variables: { env: { default: 'dev', enum: ['dev', 'prod'] } },
        },
        { env: 'staging' },
      ),
    ).toThrow("Invalid server variable value 'staging' for 'env'")
  })
})

describe('toInputServers', () => {
  it('keeps the OpenAPI 3.2 server name', () => {
    expect(toInputServers([{ url: 'https://api.example.com', name: 'production' }, { url: 'https://staging.example.com' }])).toStrictEqual([
      { url: 'https://api.example.com', name: 'production', description: undefined },
      { url: 'https://staging.example.com', description: undefined },
    ])
  })
})
