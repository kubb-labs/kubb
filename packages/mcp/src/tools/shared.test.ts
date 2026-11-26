import process from 'node:process'
import * as v from 'valibot'
import { describe, expect, it, vi } from 'vitest'
import { registryIdSchema, toConfigArgs } from './shared.ts'

describe('registryIdSchema', () => {
  it.each(['plugin-zod', 'kubb-labs/plugin-zod'])('accepts %s', (id) => {
    expect(v.safeParse(registryIdSchema, id).success).toBe(true)
  })

  it.each(['--help', '-y', 'a b', 'owner/slug/extra', '../plugin'])('refuses %s, which could reach the CLI as a flag or a path', (id) => {
    expect(v.safeParse(registryIdSchema, id).success).toBe(false)
  })
})

describe('toConfigArgs', () => {
  it('passes no arguments when the config is omitted', async () => {
    expect(await toConfigArgs(undefined)).toEqual({ args: [] })
  })

  it('passes an absolute --config path for a config inside the working directory', async () => {
    using _ = vi.spyOn(process, 'cwd').mockReturnValue('/project')

    expect(await toConfigArgs('kubb.config.ts')).toEqual({ args: ['--config', '/project/kubb.config.ts'] })
  })
})
