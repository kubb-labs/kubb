import { describe, expect, it } from 'vitest'
import { routeStudioFlags } from './index.ts'

describe('routeStudioFlags', () => {
  it.each([
    [
      ['studio', '--url', 'http://localhost:3000'],
      ['studio', 'connect', '--url', 'http://localhost:3000'],
    ],
    [
      ['studio', '--open', '--config', './kubb.config.ts'],
      ['studio', 'connect', '--open', '--config', './kubb.config.ts'],
    ],
  ])('routes %j to studio connect', (args, expected) => {
    expect(routeStudioFlags(args)).toStrictEqual(expected)
  })

  it.each([
    [['studio']],
    [['studio', 'login', '--url', 'http://localhost:3000']],
    [['studio', '--help']],
    [['studio', '-h']],
    [['generate', '--config', 'kubb.config.ts']],
  ])('leaves %j unchanged', (args) => {
    expect(routeStudioFlags(args)).toStrictEqual(args)
  })
})
