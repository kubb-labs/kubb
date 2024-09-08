import { mockParams } from '../../mocks/mockParams.ts'
import { getFunctionParams } from './getFunctionParams.ts'

describe('[params] getFunctionParams call(Function.Call)', () => {
  test.each(mockParams)('$name', async ({ params }) => {
    expect(getFunctionParams(params, { type: 'call' })).toMatchSnapshot()
  })
})

describe('[params] getFunctionParams constructor (Function)', () => {
  test.each(mockParams)('$name', async ({ params }) => {
    expect(getFunctionParams(params, { type: 'constructor' })).toMatchSnapshot()
  })
})
