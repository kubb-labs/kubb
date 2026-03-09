import { resolveServerUrl } from './resolveServerUrl.ts'
import { describe, expect, it } from 'vitest'

describe('resolveServerUrl', () => {
  it('returns url as-is when no variables are defined', () => {
    expect(resolveServerUrl({ url: 'http://localhost:3000' })).toBe('http://localhost:3000')
  })

  it('substitutes variables with their defaults when no overrides provided', () => {
    expect(
      resolveServerUrl({
        url: 'https://api.{env}.example.com',
        variables: { env: { default: 'dev' } },
      }),
    ).toBe('https://api.dev.example.com')
  })

  it('substitutes variables with user-provided overrides', () => {
    expect(
      resolveServerUrl(
        {
          url: 'https://api.{env}.example.com',
          variables: { env: { default: 'dev', enum: ['dev', 'staging', 'prod'] } },
        },
        { env: 'prod' },
      ),
    ).toBe('https://api.prod.example.com')
  })

  it('handles multiple variables, mixing overrides and defaults', () => {
    expect(
      resolveServerUrl(
        {
          url: 'https://{region}.{env}.example.com',
          variables: {
            region: { default: 'us', enum: ['us', 'eu'] },
            env: { default: 'dev' },
          },
        },
        { env: 'prod' },
      ),
    ).toBe('https://us.prod.example.com')
  })

  it('substitutes all occurrences of the same variable', () => {
    expect(
      resolveServerUrl(
        {
          url: 'https://{env}.example.com/{env}/api',
          variables: { env: { default: 'dev' } },
        },
        { env: 'staging' },
      ),
    ).toBe('https://staging.example.com/staging/api')
  })

  it('throws when override value is not in the enum', () => {
    expect(() =>
      resolveServerUrl(
        {
          url: 'https://{region}.example.com',
          variables: { region: { default: 'us', enum: ['us', 'eu'] } },
        },
        { region: 'ap' },
      ),
    ).toThrow("Invalid server variable value 'ap' for 'region' when resolving https://{region}.example.com. Valid values are: us, eu.")
  })

  it('skips variable when no default and no override provided', () => {
    expect(
      resolveServerUrl({
        url: 'https://{region}.example.com',
        variables: { region: {} },
      }),
    ).toBe('https://{region}.example.com')
  })

  it('handles numeric default values', () => {
    expect(
      resolveServerUrl({
        url: 'http://localhost:{port}/api',
        variables: { port: { default: 3000 } },
      }),
    ).toBe('http://localhost:3000/api')
  })

  it('handles numeric enum values with string override', () => {
    expect(
      resolveServerUrl(
        {
          url: 'http://localhost:{port}/api',
          variables: { port: { default: 3000, enum: [3000, 8080] } },
        },
        { port: '8080' },
      ),
    ).toBe('http://localhost:8080/api')
  })
})
