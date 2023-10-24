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
      },
    ])
  })

  test('render File with Import and Export and print imports/exports', async () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Import name={'React'} path="react" print />
          <File.Export asAlias path="./index.ts" print />
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(await format(root.output)).toStrictEqual(
      await format(`
import React from 'react'
export * from './index.ts'
  `),
    )
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

    expect(await format(root.output)).toStrictEqual(
      await format(`export function test() {
      return true
    }`),
    )
  })

  test('render File with multiple sources', async () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Source path={path.resolve(mocksPath, './test.ts')} print></File.Source>
          <File.Source print removeComments>
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

    expect(await format(root.output)).toStrictEqual(
      await format(`export function test() {
      return true
    }
    const test = 2;
    `),
    )
  })

  test('render multiple Files', async () => {
    const Component = () => {
      return (
        <>
          <File baseName="test.ts" path="./">
            <File.Source print removeComments>
              {`
            const test = 1;
            `}
              <File.Import name="node" path="node" />
            </File.Source>
          </File>
          <File baseName="test2.ts" path="./">
            <File.Source print removeComments>
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

    expect(await format(root.output)).toStrictEqual(
      await format(`
      const test = 1
      const test2 = 2
    `),
    )

    expect(await format(root.file?.source)).toStrictEqual(
      await format(`
    const test = 1
    const test2 = 2
    `),
    )

    expect(root.file?.imports).toStrictEqual([{
      'isTypeOnly': undefined,
      'name': 'node',
      'path': 'node',
    }])

    expect(root.files.length).toBe(2)

    expect(await format(root.files[0]?.source)).toStrictEqual(
      await format(`
    const test = 1
    `),
    )

    expect(root.files[0]?.imports).toStrictEqual([{
      'isTypeOnly': undefined,
      'name': 'node',
      'path': 'node',
    }])

    expect(await format(root.files[1]?.source)).toStrictEqual(
      await format(`
    const test2 = 2
    `),
    )
  })
})
