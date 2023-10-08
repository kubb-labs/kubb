import { render } from '../render.ts'
import { Text } from './Text.tsx'

describe('<Text/>', () => {
  test('render', () => {
    const Component = () => {
      return <Text>hallo</Text>
    }
    const { output } = render(<Component />)
    expect(output).toBe('hallo')
  })
})
