import { createRoot } from '../createRoot.ts'
import { Const } from './Const.tsx'

describe('<Const/>', () => {
  test('render Const', () => {
    const Component = () => {
      return <Const name="data">"blue"</Const>
    }
    const root = createRoot()
    const renderOutput = root.render(<Component />)

    expect(root.output).toEqual(renderOutput.output)
    expect(root.output).toMatchSnapshot()
  })

  test('render Const with const assertion', () => {
    const Component = () => {
      return (
        <Const name="data" asConst>
          "blue"
        </Const>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchSnapshot()
  })
})
