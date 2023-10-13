import pathParser from 'node:path'
import path from 'node:path'

import { format } from '../../mocks/format.ts'
import { createRoot } from '../client/createRoot.ts'
import { File } from './File.tsx'

describe('<File/>', () => {
  const mocksPath = path.resolve(__dirname, '../../mocks')

  test('render File', () => {
    const Component = () => {
      return <File fileName="fileName" path="path" />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toStrictEqual('')
  })

  test.todo('render File with Import and Export')

  test('render File with source', () => {
    const Component = () => {
      return (
        <File fileName="fileName" path="path">
          <File.Source>test</File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toStrictEqual('test')
  })
  test('render File with source and path, print', async () => {
    const Component = () => {
      return (
        <File fileName="fileName" path="path">
          <File.Source path={pathParser.resolve(mocksPath, './test.ts')} print></File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(format(root.output)).toStrictEqual(
      format(`export function test() {
      return true
    }`),
    )
  })
})
