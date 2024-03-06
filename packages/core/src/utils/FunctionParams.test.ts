import { FunctionParams } from './FunctionParams.ts'

describe('objectToParameters', () => {
  test('if object is resolved to a string with parameters', () => {
    expect(new FunctionParams().add([{ name: 'firstName' }]).toString()).toEqual('firstName')
    expect(new FunctionParams().add([{ name: 'firstName' }, { name: 'lastName' }]).toString()).toEqual('firstName, lastName')
  })

  test('if object is resolved to a string with typed generics', () => {
    expect(new FunctionParams().add([{ type: 'TData', default: 'User' }]).toString()).toEqual('TData = User')
    expect(
      new FunctionParams()
        .add([
          { type: 'TData', default: 'User' },
          { type: 'TVariables', default: 'Variables' },
        ])
        .toString(),
    ).toEqual('TData = User, TVariables = Variables')
    expect(new FunctionParams().add([{ type: 'TData' }, { type: 'TVariables' }]).toString()).toEqual('TData, TVariables')
    expect(
      new FunctionParams()
        .add([
          { type: 'TData', default: 'User' },
          { type: 'TVariables', default: 'Variables', enabled: false },
        ])
        .toString(),
    ).toEqual('TData = User')
  })

  test('if object is resolved to a string with typed parameters', () => {
    expect(new FunctionParams().add([{ name: 'firstName', type: 'User["firstName"]' }]).toString()).toEqual('firstName: User["firstName"]')
    expect(
      new FunctionParams()
        .add([
          { name: 'firstName', type: 'User["firstName"]' },
          { name: 'lastName', type: 'User["lastName"]' },
        ])
        .toString(),
    ).toEqual('firstName: User["firstName"], lastName: User["lastName"]')
  })

  test('if object is resolved to a string with typed parameters and optional paramters', () => {
    expect(
      new FunctionParams()
        .add([
          { name: 'firstName', type: 'User["firstName"]', required: false },
          { name: 'lastName', type: 'User["lastName"]' },
        ])
        .toString(),
    ).toEqual('lastName: User["lastName"], firstName?: User["firstName"]')
    expect(
      new FunctionParams()
        .add([
          { name: 'firstName', type: 'User["firstName"]', required: false },
          { name: 'lastName', type: 'User["lastName"]', required: false },
        ])
        .toString(),
    ).toEqual('firstName?: User["firstName"], lastName?: User["lastName"]')

    expect(
      new FunctionParams()
        .add([
          { name: 'firstName', type: 'User["firstName"]', default: '{}' },
          { name: 'lastName', type: 'User["lastName"]', required: false },
        ])
        .toString(),
    ).toEqual('lastName?: User["lastName"], firstName: User["firstName"] = {}')
  })

  test('if object is resolved to a string with array typed parameters', () => {
    expect(
      new FunctionParams().add([
        [{ name: 'id' }],
        { name: 'params' },
      ]).toString(),
    ).toEqual('{ id }, params')
    expect(
      new FunctionParams()
        .add([
          [{ name: 'id' }, { name: 'data' }],
          { name: 'params' },
        ])
        .toString(),
    ).toEqual('{ id, data }, params')
    expect(
      new FunctionParams()
        .add([
          [{ name: 'id', type: 'Id' }, { name: 'data', type: 'Data' }],
          { name: 'params', type: 'Params' },
        ])
        .toString(),
    ).toEqual('{ id, data }?: { id: Id, data: Data }, params: Params')
  })
})
