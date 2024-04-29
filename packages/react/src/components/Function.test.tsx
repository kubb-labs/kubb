import { format } from '../../mocks/format.ts'
import { createRoot } from '../client/createRoot.ts'
import type { Params } from '../shared/utils/getParams.ts'
import { Function } from './Function.tsx'

describe('<Function/>', () => {
  test('render Function', async () => {
    const Component = () => {
      return (
        <Function name="getData" export async>
          return 2;
        </Function>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render Function with comments', async () => {
    const Component = () => {
      return (
        <Function name="getData" export async JSDoc={{ comments: ['@deprecated'] }}>
          return 2;
        </Function>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render ArrowFunction', async () => {
    const Component = () => {
      return (
        <Function.Arrow name="getData" export async>
          return 2;
        </Function.Arrow>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render Function Generics', async () => {
    const Component = () => {
      return (
        <Function name="getData" export async generics={['TData']} returnType="number">
          return 2;
        </Function>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render ArrowFunction Generics', async () => {
    const Component = () => {
      return (
        <Function.Arrow name="getData" export async generics={['TData']} returnType="number">
          return 2;
        </Function.Arrow>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render ArrowFunction SingleLine', async () => {
    const Component = () => {
      return (
        <Function.Arrow name="getData" export async generics={['TData']} singleLine returnType="number">
          2;
        </Function.Arrow>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render multiple functions', async () => {
    const Component = () => {
      return (
        <>
          <Function name="getData" export async generics={['TData']} returnType="number">
            2;
          </Function>

          <Function name="getData" export async generics={['TData']} returnType="number">
            3;
          </Function>
        </>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render CallFunction', async () => {
    const Component = () => {
      return <Function.Call name="test" fnName="getData" />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })
  test('render CallFunction async', async () => {
    const Component = () => {
      return <Function.Call name="test" fnName="getData" async />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render CallFunction with generics', async () => {
    const Component = () => {
      return <Function.Call name="test" fnName="getData" generics={['TFoo', 'TBar']} />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render CallFunction async with generics and params', async () => {
    const Component = () => {
      return <Function.Call name="test" fnName="getData" generics={['TFoo', 'TBar']} params={'foo, bar'} async />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  const paramsTest: Array<{ name: string; params: Params }> = [
    {
      name: 'empty',
      params: {
        name: {},
      },
    },
    {
      name: 'string',
      params: {
        name: {
          type: 'string',
        },
      },
    },
    {
      name: 'optional string',
      params: {
        name: {
          type: 'string',
          optional: true,
        },
      },
    },
    {
      name: 'default string',
      params: {
        name: {
          type: 'string',
          default: 'test',
        },
      },
    },
    {
      name: 'name and address',
      params: {
        name: {
          type: 'string',
        },
        address: {
          type: 'string',
        },
      },
    },
    {
      name: 'name[optional], age[optional] and address',
      params: {
        name: {
          type: 'string',
          optional: true,
        },
        age: {
          type: 'number',
          optional: true,
        },
        address: {
          type: 'string',
        },
      },
    },
    {
      name: 'name[optional] age, address[optional] and country[Belgium]',
      params: {
        name: {
          type: 'string',
          optional: true,
        },
        age: {
          type: 'number',
        },
        address: {
          type: 'string',
          optional: true,
        },
        country: {
          type: 'string',
          default: '"Belgium"',
        },
      },
    },
    {
      name: 'params[with name] with age, address[optional] and country',
      params: {
        data: {
          type: 'Data',
          children: {
            age: {
              type: 'number',
            },
            address: {
              type: 'string',
              optional: true,
            },
            country: {
              type: 'string',
            },
          },
        },
      },
    },
    {
      name: 'params[without name] with age, address[optional] and country',
      params: {
        data: {
          children: {
            age: {
              type: 'number',
            },
            address: {
              type: 'string',
              optional: true,
            },
            country: {
              type: 'string',
            },
          },
        },
      },
    },
    {
      name: 'params[without name and default] with age[optional, 90] address[optional] and country[optional, Belgium]',
      params: {
        data: {
          default: '{}',
          children: {
            age: {
              type: 'number',
              default: '90',
              optional: true,
            },
            address: {
              type: 'string',
              optional: true,
            },
            country: {
              type: 'string',
              default: "'Belgium'",
              optional: true,
            },
          },
        },
      },
    },
    {
      name: 'params[without name] with age[optional, 20] address[optional] and country[optional, Belgium]',
      params: {
        data: {
          children: {
            age: {
              type: 'number',
              default: '20',
              optional: true,
            },
            address: {
              type: 'string',
              optional: true,
            },
            country: {
              type: 'string',
              default: '"Belgium"',
              optional: true,
            },
          },
        },
      },
    },
    {
      name: 'params[without name and mode inline] with age[optional, 20] address[optional] and country[optional, Belgium]',
      params: {
        data: {
          mode: 'inline',
          children: {
            age: {
              type: 'number',
              default: '20',
              optional: true,
            },
            address: {
              type: 'string',
              optional: true,
            },
            country: {
              type: 'string',
              default: '"Belgium"',
              optional: true,
            },
          },
        },
      },
    },
    {
      name: 'params[without name and mode inline] with age[20] address and country[Belgium]',
      params: {
        data: {
          mode: 'inline',
          children: {
            age: {
              type: 'number',
              default: '20',
            },
            address: {
              type: 'string',
            },
            country: {
              type: 'string',
              default: '"Belgium"',
            },
          },
        },
      },
    },
    {
      name: 'params[without name and mode inlineSpread] with age[20] address and country[Belgium]',
      params: {
        data: {
          mode: 'inlineSpread',
          children: {
            age: {
              type: 'number',
              default: '20',
            },
            address: {
              type: 'string',
            },
            country: {
              type: 'string',
              default: '"Belgium"',
            },
          },
        },
      },
    },
  ]

  test.each(paramsTest)('$name', async ({ name, params }) => {
    const Component = () => {
      return (
        <Function.Arrow name="getData" params={params} returnType="number">
          {`// ${name}`}
          <br />
          return 2;
        </Function.Arrow>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  // test('render Function ServerComponent(beta)', async () => {
  //   const Component = async () => {
  //     const data = await Promise.resolve('return 2;')
  //     return (
  //       <Function name="getData" export async generics={['TData']} returnType="number">
  //         {data}
  //       </Function>
  //     )
  //   }
  //   const { output } = render(<Component />)

  //   expect(await format(output)).toMatch(
  //     await format(`
  //     export async function getData<TData>(): number {
  //         return 2;
  //     };

  //      `),
  //   )
  // })
})
