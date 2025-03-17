import { createRoot } from '../createRoot.ts'
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

    expect(root.output).toMatchSnapshot()
  })

  test('render default Function', async () => {
    const Component = () => {
      return (
        <Function name="getData" export async default>
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

  test('render default ArrowFunction', async () => {
    const Component = () => {
      return (
        <Function.Arrow name="getData" export async default>
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
})
