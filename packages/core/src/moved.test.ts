import { describe, expect, it } from 'vitest'
import { Diagnostics } from './Diagnostics.ts'
import * as moved from './moved.ts'

const calls: Record<string, () => unknown> = {
  addGenerator: () => moved.addGenerator(),
  setResolver: () => moved.setResolver(),
  setMacros: () => moved.setMacros(),
  addMacro: () => moved.addMacro(),
  createResolver: () => moved.createResolver(),
  defineResolver: () => moved.defineResolver(),
  defineGenerator: () => moved.defineGenerator(),
  toFilePath: () => moved.toFilePath(),
  Resolver: () => new moved.Resolver(),
  'Resolver.merge': () => moved.Resolver.merge(),
}

describe('moved-to-kit stubs', () => {
  it('imports without throwing', () => {
    expect(Object.keys(moved)).toHaveLength(9)
  })

  it.each(Object.entries(calls))('%s throws KUBB_MOVED_TO_KIT with the docs URL', (name, call) => {
    let thrown: unknown
    try {
      call()
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(Diagnostics.Error)
    const { diagnostic } = thrown as InstanceType<typeof Diagnostics.Error>
    expect(diagnostic.code).toBe('KUBB_MOVED_TO_KIT')
    expect(diagnostic.message).toBe(`\`${name}\` moved from @kubb/core to @kubb/kit.`)
    expect(diagnostic.help).toContain('https://kubb.dev/docs/5.x/reference/diagnostics#kubb-moved-to-kit')
  })
})
