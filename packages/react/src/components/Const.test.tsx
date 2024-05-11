import { format } from '../../mocks/format.ts'
import { createRoot } from '../client/createRoot.ts'
import { Const } from './Const.tsx'

describe('<Const/>', () => {
  test('render Const', async () => {
    const Component = () => {
      return <Const name="data">"blue"</Const>
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render Const with const assertion', async () => {
    const Component = () => {
      return (
        <Const name="data" asConst>
          "blue"
        </Const>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })
})
