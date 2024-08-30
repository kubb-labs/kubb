import { createRoot } from '../client/createRoot.ts'
import { Function } from './Function.tsx'
import { mockParams } from '../../mocks/mockParams.ts'

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

    expect(root.output).toMatchSnapshot()
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

    expect(root.output).toMatchSnapshot()
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

    expect(root.output).toMatchSnapshot()
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

    expect(root.output).toMatchSnapshot()
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

    expect(root.output).toMatchSnapshot()
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

    expect(root.output).toMatchSnapshot()
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

    expect(root.output).toMatchSnapshot()
  })

  test('render CallFunction', async () => {
    const to = <Function name="getData" />
    const Component = () => {
      return <Function.Call name="test" to={to} />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchSnapshot()
  })
  test('render CallFunction async', async () => {
    const to = <Function name="getData" async />
    const Component = () => {
      return <Function.Call name="test" to={to} />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchSnapshot()
  })

  test('render CallFunction with generics', async () => {
    const to = <Function name="getData" generics={['TFoo', 'TBar']} />
    const Component = () => {
      return <Function.Call name="test" to={to} />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchSnapshot()
  })

  test('render CallFunction async with generics and params', async () => {
    const to = <Function name="getData" generics={['TFoo', 'TBar']} params={'foo, bar'} async />
    const Component = () => {
      return <Function.Call name="test" to={to} />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchSnapshot()
  })

  test.each(mockParams)('$name', async ({ name, params }) => {
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

    expect(root.output).toMatchSnapshot()
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
