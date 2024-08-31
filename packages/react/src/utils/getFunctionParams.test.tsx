import { mockParams } from '../../mocks/mockParams.ts'
import { getFunctionParams } from './getFunctionParams.ts'

describe('[params] getFunctionParams callable(Function.Call)', () => {
  test.each(mockParams)('$name', async ({ name, params }) => {
    expect(getFunctionParams(params, { type: 'call' })).toMatchSnapshot()
  })
})

describe('[params] getFunctionParams not callable(Function)', () => {
  test.each(mockParams)('$name', async ({ name, params }) => {
    expect(getFunctionParams(params, { type: 'constructor' })).toMatchSnapshot()
  })
})
