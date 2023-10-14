import pathParser from 'node:path'
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
