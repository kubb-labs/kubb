import { format } from '../../mocks/format.ts'
import { createRoot } from '../client/createRoot.ts'
import { Type } from './Type.tsx'

describe('<Type/>', () => {
  test('render Function', async () => {
    const Component = () => {
      return (
        <Type name="Data">
          string
        </Type>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render Function with comments', async () => {
    const Component = () => {
      return (
        <Type name="Data" export JSDoc={{ comments: ['@deprecated'] }}>
          number | string
        </Type>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })
})
