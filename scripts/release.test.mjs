import { describe, expect, it } from 'vitest'
import { parseStaged } from './release.mjs'

describe('parseStaged', () => {
  it('returns name/version pairs from a JSON array payload', () => {
    const output = JSON.stringify([
      { name: '@kubb/core', version: '5.0.0-beta.81' },
      { name: 'kubb', version: '5.0.0-beta.81' },
    ])

    expect(parseStaged(output)).toStrictEqual([
      { name: '@kubb/core', version: '5.0.0-beta.81' },
      { name: 'kubb', version: '5.0.0-beta.81' },
    ])
  })

  it('drops JSON entries missing a name or version', () => {
    const output = JSON.stringify([{ name: '@kubb/core', version: '5.0.0-beta.81' }, { name: 'kubb' }, { version: '1.0.0' }])

    expect(parseStaged(output)).toStrictEqual([{ name: '@kubb/core', version: '5.0.0-beta.81' }])
  })

  it('falls back to scanning `+ <name>@<version>` lines when the payload is not JSON', () => {
    const output = ['Packages: +2', '+ @kubb/core@5.0.0-beta.81', '+ kubb@5.0.0-beta.81', 'Done'].join('\n')

    expect(parseStaged(output)).toStrictEqual([
      { name: '@kubb/core', version: '5.0.0-beta.81' },
      { name: 'kubb', version: '5.0.0-beta.81' },
    ])
  })

  it('returns an empty array when nothing was staged', () => {
    expect(parseStaged('No packages to publish')).toStrictEqual([])
  })
})
