import path from 'node:path'

import { getExports } from './api.ts'

describe('api', () => {
  test('Get exports', () => {
    const file = path.resolve(__dirname, '../mocks/export.ts')
    expect(getExports(file)).toStrictEqual([{ name: 'test', isTypeOnly: false }, { name: 'Test', isTypeOnly: true }, {
      name: 'TestInterface',
      isTypeOnly: true,
    }])
  })

  test('Get exports without extName', () => {
    const file = path.resolve(__dirname, '../mocks/export')
    expect(getExports(file)).toStrictEqual([{ name: 'test', isTypeOnly: false }, { name: 'Test', isTypeOnly: true }, {
      name: 'TestInterface',
      isTypeOnly: true,
    }])
  })

  test('Get exports from folder', () => {
    const file = path.resolve(__dirname, '../mocks/exportDir/index')
    expect(getExports(file)).toStrictEqual([{ name: 'Test', isTypeOnly: true }, { name: 'test', isTypeOnly: false }])
  })
})
