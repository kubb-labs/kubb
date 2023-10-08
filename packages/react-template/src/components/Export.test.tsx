import { render } from '../render.ts'
import { Export } from './Export.tsx'

describe('<Export/>', () => {
  test('render Export without print', () => {
    const Component = () => {
      return <Export path="kubb" />
    }
    const { exports } = render(<Component />)
    expect(exports).toStrictEqual([
      {
        asAlias: undefined,
        isTypeOnly: undefined,
        name: undefined,
        path: 'kubb',
      },
    ])
  })
  test('render Export with print', () => {
    const Component = () => {
      return <Export path="kubb" print />
    }
    const { output, exports } = render(<Component />)
    expect(output).toMatch('export * from "kubb"')
    expect(exports).toStrictEqual([])
  })
})
