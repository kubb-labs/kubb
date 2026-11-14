import { describe, expect, it } from 'vitest'
import { createRefs } from '../refs.ts'
import type { Document } from '../types.ts'
import { toAuthRequirements, toAuthSchemes } from './security.ts'

function documentWith(securitySchemes: Record<string, unknown>): Document {
  return { openapi: '3.2.0', info: { title: 'Auth', version: '1' }, paths: {}, components: { securitySchemes } } as Document
}

describe('toAuthSchemes', () => {
  it('maps every scheme type a client can place', () => {
    const schemes = {
      key: { type: 'apiKey', in: 'header', name: 'X-Key', description: 'Key', deprecated: true },
      bearer: { type: 'http', scheme: 'Bearer', bearerFormat: 'JWT' },
      oidc: { type: 'openIdConnect', openIdConnectUrl: 'https://id.example.com' },
      oauth: {
        type: 'oauth2',
        oauth2MetadataUrl: 'https://auth.example.com/meta',
        flows: { clientCredentials: { tokenUrl: 'https://auth.example.com/token', scopes: { read: 'Read' }, extra: 1 } },
      },
      mtls: { type: 'mutualTLS' },
      shared: { $ref: '#/components/securitySchemes/bearer' },
    }

    expect(toAuthSchemes(schemes, createRefs(documentWith(schemes)))).toStrictEqual([
      { name: 'key', description: 'Key', deprecated: true, credential: { type: 'apiKey', in: 'header', name: 'X-Key' } },
      { name: 'bearer', credential: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      { name: 'oidc', credential: { type: 'openIdConnect', url: 'https://id.example.com' } },
      {
        name: 'oauth',
        credential: {
          type: 'oauth2',
          flows: { clientCredentials: { tokenUrl: 'https://auth.example.com/token', scopes: { read: 'Read' } } },
          metadataUrl: 'https://auth.example.com/meta',
        },
      },
      { name: 'mtls', credential: { type: 'mutualTLS' } },
      { name: 'shared', credential: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    ])
  })

  it('leaves out a scheme a client cannot place', () => {
    const schemes = {
      body: { type: 'apiKey', in: 'body', name: 'key' },
      unnamed: { type: 'apiKey', in: 'query' },
      noScheme: { type: 'http' },
      unknown: { type: 'magic' },
    }

    expect(toAuthSchemes(schemes, createRefs(documentWith(schemes)))).toStrictEqual([])
    expect(toAuthSchemes(undefined, createRefs(documentWith({})))).toStrictEqual([])
  })
})

describe('toAuthRequirements', () => {
  it('turns a 3.2 scheme URI into the scheme name and keeps scopes', () => {
    const document = documentWith({ 'a/b': { type: 'mutualTLS' }, plain: { type: 'mutualTLS' } })
    const requirements = [{ 'https://example.com/openapi.json#/components/securitySchemes/a~1b': ['read', 1], plain: [] }, {}, null, 'skip']

    expect(toAuthRequirements(requirements, document)).toStrictEqual([[{ scheme: 'a/b', scopes: ['read', '1'] }, { scheme: 'plain' }], []])
  })
})
