import { createRoot } from '../createRoot.ts'
import { Text } from './Text.tsx'

describe('<Text/>', () => {
  test('render', () => {
    const Component = () => {
      return <Text>hallo</Text>
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toBe('hallo')
  })
})
