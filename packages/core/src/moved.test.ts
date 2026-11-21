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
  it.each(Object.entries(calls))('%s throws KUBB_MOVED_TO_KIT', (name, call) => {
    expect(call).toThrow(
      expect.objectContaining({
        diagnostic: expect.objectContaining({ code: Diagnostics.code.movedToKit, message: `\`${name}\` moved from @kubb/core to @kubb/kit.` }),
      }),
    )
  })
})
