import { render } from './render.ts'
import { Text, Function } from './components/index.ts'
import { format } from '../mocks/format.ts'

describe('Render', () => {
  test('render Text', () => {
    const Component = () => {
      return <Text>hallo</Text>
    }
    const { output } = render(<Component />)
    expect(output).toBe('hallo')
  })
  test('render Function', async () => {
    const Component = () => {
      return (
        <Function name="getData" export async>
          return 2;
        </Function>
      )
    }
    const { output } = render(<Component />)

    expect(await format(output)).toMatch(
      await format(`
        export async function getData() {
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
    const { output } = render(<Component />)

    expect(await format(output)).toMatch(
      await format(`
      export async function getData<TData>(): number {
          return 2;
      };
        
       `),
    )
  })
})
