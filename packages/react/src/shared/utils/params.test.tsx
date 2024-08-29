import { mockParams } from '../../../mocks/mockParams.ts'
import { getParams } from './getParams.ts'

describe('[params] getParams callable(Function.Call)', () => {
  test.each(mockParams)('$name', async ({ name, params }) => {
    expect(getParams(params, { type: 'call' })).toMatchSnapshot()
  })
})

describe('[params] getParams not callable(Function)', () => {
  test.each(mockParams)('$name', async ({ name, params }) => {
    expect(getParams(params, { type: 'constructor' })).toMatchSnapshot()
  })
})
