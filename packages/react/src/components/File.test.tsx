import path from 'node:path'

import { format } from '../../mocks/format.ts'
import { createRoot } from '../client/createRoot.ts'
import { File } from './File.tsx'

describe('<File/>', () => {
  const mocksPath = path.resolve(__dirname, '../../mocks')

  test('render File', () => {
    const Component = () => {
      return <File baseName="test.ts" path="path" />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toStrictEqual('')
  })

  test('render File with Import and Export', () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Import name={'React'} path="react" />
          <File.Export asAlias path="./index.ts" />
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.file?.exports).toStrictEqual([
      {
        asAlias: true,
        isTypeOnly: undefined,
        name: undefined,
        path: './index.ts',
      },
    ])

    expect(root.file?.imports).toStrictEqual([
      {
        isTypeOnly: undefined,
        name: 'React',
        path: 'react',
        root: undefined,
      },
    ])
  })

  test('render File with Import and Export and print imports/exports', async () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Import name={'React'} path="react" print />
          <br />
          <File.Export asAlias path="./index.ts" print />
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render File with source', () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
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
        <File baseName="test.ts" path="path">
          <File.Source path={path.resolve(mocksPath, './test.ts')} print></File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render File with multiple sources', async () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Source path={path.resolve(mocksPath, './test.ts')} print></File.Source>
          <File.Source print>
            {`
            // comment that should be removed
            const test = 2;
            `}
          </File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render multiple Files', async () => {
    const Component = () => {
      return (
        <>
          <File baseName="test.ts" path="./">
            <File.Source print>
              {`
            const test = 1;
            `}
              <File.Import name="node" path="node" />
            </File.Source>
          </File>
          <File baseName="test2.ts" path="./">
            <File.Source print>
              {`
            const test2 = 2;
            `}
            </File.Source>
          </File>
        </>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()

    expect(await format(root.file?.source)).toMatchSnapshot()

    expect(root.file?.imports).toStrictEqual([{
      'isTypeOnly': undefined,
      'name': 'node',
      'path': 'node',
      'root': undefined,
    }])

    expect(root.files.length).toBe(2)

    expect(await format(root.files[0]?.source)).toMatchSnapshot()

    expect(root.files[0]?.imports).toStrictEqual([{
      'isTypeOnly': undefined,
      'name': 'node',
      'path': 'node',
      'root': undefined,
    }])

    expect(await format(root.files[1]?.source)).toMatchSnapshot()
  })

  test('render File with multiple sources', async () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Source path={path.resolve(mocksPath, './test.ts')} print></File.Source>
          <File.Source print>
            {`
            // comment that should be removed
            const test = 2;
            `}
          </File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()
  })

  test('render multiple Files', async () => {
    const Component = () => {
      return (
        <>
          <File baseName="test.ts" path="./">
            <File.Source print>
              {`
            const test = 1;
            `}
              <File.Import name="node" path="node" />
            </File.Source>
          </File>
          <File baseName="test2.ts" path="./">
            <File.Source print>
              {`
            const test2 = 2;
            `}
            </File.Source>
          </File>
        </>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toMatchSnapshot()

    expect(await format(root.file?.source)).toMatchSnapshot()

    expect(root.file?.imports).toStrictEqual([{
      'isTypeOnly': undefined,
      'name': 'node',
      'path': 'node',
      'root': undefined,
    }])

    expect(root.files.length).toBe(2)

    expect(await format(root.files[0]?.source)).toMatchSnapshot()

    expect(root.files[0]?.imports).toStrictEqual([{
      'isTypeOnly': undefined,
      'name': 'node',
      'path': 'node',
      'root': undefined,
    }])

    expect(await format(root.files[1]?.source)).toMatchSnapshot()
  })
})
