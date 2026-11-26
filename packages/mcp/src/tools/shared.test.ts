import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { registryIdSchema } from './shared.ts'

describe('registryIdSchema', () => {
  it.each(['plugin-zod', 'kubb-labs/plugin-zod'])('accepts %s', (id) => {
    expect(v.safeParse(registryIdSchema, id).success).toBe(true)
  })

  it.each(['--help', '-y', 'a b', 'owner/slug/extra', '../plugin'])('refuses %s, which could reach the CLI as a flag or a path', (id) => {
    expect(v.safeParse(registryIdSchema, id).success).toBe(false)
  })
})
