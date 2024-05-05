import { createRoot } from '../client/createRoot.ts'
import { Parser } from './Parser.tsx'

describe('<Parser/>', () => {
  test('render Parser with language typescript', () => {
    const Component = () => {
      return <Parser language="typescript">export const test = 2;</Parser>
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('export const test = 2;')
  })

  test('render Parser with language text', () => {
    const Component = () => {
      return <Parser language="text">test</Parser>
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('test')
  })
})
