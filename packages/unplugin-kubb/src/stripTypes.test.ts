import { describe, expect, it } from 'vitest'
import { stripTypes } from './stripTypes.ts'

async function load(source: string): Promise<Record<string, unknown>> {
  return import(`data:text/javascript,${encodeURIComponent(stripTypes(source, 'test.ts'))}`)
}

describe('stripTypes', () => {
  it('removes types, interfaces and type-only syntax', () => {
    const code = stripTypes(
      'export type Pet = { id: number }\nexport interface Tag { name: string }\nexport const pet = { id: 1 } as const satisfies Pet\n',
      'pet.ts',
    )

    expect(code).toBe('export const pet = { id: 1 };')
  })

  it('compiles enums to the same objects as tsc', async () => {
    const mod = await load(
      "export enum Status { Active = 'active', Archived = 'archived' }\nexport const enum Level { Low = -1, Mid, High = 10, Top }\nenum Local { A }\nexport const local = Local.A\n",
    )

    expect(mod.Status).toEqual({ Active: 'active', Archived: 'archived' })
    expect(mod.Level).toEqual({ Low: -1, '-1': 'Low', Mid: 0, 0: 'Mid', High: 10, 10: 'High', Top: 11, 11: 'Top' })
    expect(mod.local).toBe(0)
  })

  it('keeps quoted member names', async () => {
    const mod = await load("export enum Color { '#fff' = 'white', 'x-y' = 1 }\n")

    expect(mod.Color).toEqual({ '#fff': 'white', 'x-y': 1, 1: 'x-y' })
  })

  it('throws on invalid source', () => {
    expect(() => stripTypes('export const = 1', 'broken.ts')).toThrow(/broken\.ts/)
  })
})
