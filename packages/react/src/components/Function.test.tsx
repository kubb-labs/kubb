import { format } from '../../mocks/format.ts'
import { createRoot } from '../client/createRoot.ts'
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

    expect(await format(root.output)).toMatch(
      await format(`
        export async function getData() {
            return 2;
        };

       `),
    )
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

    expect(await format(root.output)).toMatch(
      await format(`
      export const getData = async () => {
        return 2;
      };

       `),
    )
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

    expect(await format(root.output)).toMatch(
      await format(`
      export async function getData<TData>(): Promise<number> {
          return 2;
      };

       `),
    )
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

    expect(await format(root.output)).toMatch(
      await format(`
      export const getData = async <TData>(): Promise<number> => {
        return 2;
      };

       `),
    )
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

    expect(await format(root.output)).toMatch(await format(`export const getData = async <TData>(): Promise<number> => 2;`))
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
