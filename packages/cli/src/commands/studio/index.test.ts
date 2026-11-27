import { parseArgs, resolveArgs } from 'gunshi'
import { describe, expect, it } from 'vitest'
import { command as connectCommand } from './connect.ts'
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

describe('studio connect flags', () => {
  it('parses the command kubb_studio_connect hands out: write access only, no browser', () => {
    const tokens = parseArgs(['--allow-write', '--no-open', '--url', 'https://kubb.studio'])
    const { values } = resolveArgs(connectCommand.args!, tokens, { toKebab: true })

    expect(values).toMatchObject({ allowWrite: true, open: false, url: 'https://kubb.studio', allowRead: false, allowExec: false, allowConfigEdit: false })
  })
})
