import { describe, expect, it } from 'vitest'
import { parseFromConfig } from '../load/index.ts'
import type { Document } from '../types.ts'
import { resolveBaseUrl, resolveServerUrl } from './server.ts'

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
  it('returns the server URL at the given index', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const url = resolveBaseUrl({ document, server: { index: 0 } })
    expect(url).toBe('https://api.example.com/v1')
  })

  it('returns null when no server index is provided', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const url = resolveBaseUrl({ document, server: {} })
    expect(url).toBeNull()
  })

  it('returns null when no server is provided', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const url = resolveBaseUrl({ document })
    expect(url).toBeNull()
  })

  it('returns null when the server index is out of range', async () => {
    const document = await parseFromConfig({ type: 'data', data: minimalSpec })
    const url = resolveBaseUrl({ document, server: { index: 99 } })
    expect(url).toBeNull()
  })

  it('substitutes server variables into the resolved URL', async () => {
    const document = await parseFromConfig({
      type: 'data',
      data: {
        ...minimalSpec,
        servers: [{ url: 'https://api.{env}.example.com', variables: { env: { default: 'dev' } } }],
      },
    })
    const url = resolveBaseUrl({ document, server: { index: 0, variables: { env: 'prod' } } })
    expect(url).toBe('https://api.prod.example.com')
  })
})

describe('resolveServerUrl', () => {
  it('returns the url unchanged when there are no variables', () => {
    expect(resolveServerUrl({ url: 'https://api.example.com' })).toBe('https://api.example.com')
  })

  it('replaces a variable with the provided override', () => {
    expect(
      resolveServerUrl(
        {
          url: 'https://{env}.api.example.com',
          variables: { env: { default: 'dev', enum: ['dev', 'prod'] } },
        },
        { env: 'prod' },
      ),
    ).toBe('https://prod.api.example.com')
  })

  it('falls back to the variable default when no override is given', () => {
    expect(
      resolveServerUrl({
        url: 'https://{env}.api.example.com',
        variables: { env: { default: 'dev' } },
      }),
    ).toBe('https://dev.api.example.com')
  })

  it('leaves the placeholder unreplaced when no override and no default', () => {
    expect(
      resolveServerUrl({
        url: 'https://{env}.api.example.com',
        variables: { env: { default: '' } },
      }),
    ).toBe('https://.api.example.com')
  })

  it('replaces multiple variables', () => {
    expect(
      resolveServerUrl(
        {
          url: 'https://{env}.api.example.com/{version}',
          variables: { env: { default: 'dev' }, version: { default: 'v1' } },
        },
        { env: 'prod', version: 'v2' },
      ),
    ).toBe('https://prod.api.example.com/v2')
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
