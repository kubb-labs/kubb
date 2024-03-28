import { createRoot } from '../client/createRoot.ts'
import { Editor } from './Editor.tsx'

describe('<Editor/>', () => {
  test('render Editor with language typescript', () => {
    const Component = () => {
      return <Editor language="typescript">export const test = 2;</Editor>
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('export const test = 2;')
  })

  test('render Editor with language text', () => {
    const Component = () => {
      return <Editor language="text">test</Editor>
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('test')
  })
})
