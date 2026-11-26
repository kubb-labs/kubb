import { describe, expect, it } from 'vitest'
import { createRenamer } from './renamer.ts'

describe('Renamer', () => {
  it('returns the name as it is when it is free', () => {
    expect(createRenamer().assign({ name: 'Pet' })).toBe('Pet')
  })

  it('adds 2, 3 and so on while a name is taken', () => {
    const renamer = createRenamer()

    expect([renamer.assign({ name: 'Pet' }), renamer.assign({ name: 'Pet' }), renamer.assign({ name: 'Pet' })]).toStrictEqual(['Pet', 'Pet2', 'Pet3'])
  })

  it('never assigns a reserved name', () => {
    const renamer = createRenamer()
    renamer.reserve({ name: 'Response' })

    expect(renamer.assign({ name: 'Response', owner: 'models' })).toBe('Response2')
  })

  it('lets the same owner take a name it already holds', () => {
    const renamer = createRenamer()
    renamer.bind({ name: 'Options', owner: '@kubb/client' })

    expect(renamer.assign({ name: 'Options', owner: '@kubb/client' })).toBe('Options')
    expect(renamer.assign({ name: 'Options', owner: './models.ts' })).toBe('Options2')
  })

  it('keeps a bound name when it is reserved later', () => {
    const renamer = createRenamer()
    renamer.bind({ name: 'Pet', owner: 'models' })
    renamer.reserve({ name: 'Pet' })

    expect(renamer.assign({ name: 'Pet', owner: 'models' })).toBe('Pet')
  })

  it('needs every emitted name free and claims them all', () => {
    const renamer = createRenamer()
    renamer.reserve({ name: 'StatusKey' })
    const emits = (name: string) => [name, `${name}Key`]

    expect(renamer.assign({ name: 'Status', emits })).toBe('Status2')
    expect(renamer.assign({ name: 'Status2Key' })).toBe('Status2Key2')
  })
})
