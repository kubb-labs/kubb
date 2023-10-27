import { createRoot } from '../client/createRoot.ts'
import { Export } from './Export.tsx'

describe('<Export/>', () => {
  test('render Export with print', () => {
    const Component = () => {
      return <Export path="kubb" print />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('export * from "kubb"')
  })
})
