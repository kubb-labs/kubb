import { expect, it } from 'vitest'
import { runtime } from './runtime.ts'

it('detects Node when no Bun or Deno global is present', () => {
  expect(runtime.name).toBe('node')
  expect(runtime.version).toBe(process.versions.node)
})
