import { getParams } from './getParams.ts'
import { mockParams } from '../../../mocks/mockParams.ts'

describe('getParams callable(Function.Call)', () => {
  test.each(mockParams)('$name', async ({ name, params }) => {
    expect(getParams(params, { type: 'call' })).toMatchSnapshot()
  })
})

describe('getParams not callable(Function)', () => {
  test.each(mockParams)('$name', async ({ name, params }) => {
    expect(getParams(params, { type: 'constructor' })).toMatchSnapshot()
  })
})
