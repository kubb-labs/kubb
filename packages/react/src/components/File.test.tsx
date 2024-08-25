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

    expect(root.files).toMatchInlineSnapshot(`
      [
        {
          "baseName": "test.ts",
          "exports": [
            {
              "asAlias": true,
              "extName": undefined,
              "isTypeOnly": false,
              "name": undefined,
              "path": "./index.ts",
              "print": undefined,
            },
          ],
          "extName": "ts",
          "id": undefined,
          "imports": [
            {
              "extName": undefined,
              "isNameSpace": undefined,
              "isTypeOnly": false,
              "name": "React",
              "path": "react",
              "print": undefined,
              "root": undefined,
            },
          ],
          "meta": undefined,
          "name": "test",
          "override": undefined,
          "path": "path",
          "source": "",
        },
      ]
    `)
  })

  test('do not render File', () => {
    const enable = false
    const Component = () => {
      return (
        <>
          {enable && (
            <File baseName="test.ts" path="path">
              <File.Import name={'React'} path="react" />
              <File.Export asAlias path="./index.ts" />
            </File>
          )}
        </>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.files).toMatchInlineSnapshot('[]')
  })

  test('render File with Export inside Source', () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Source>
            <File.Export name={'test'} />
          </File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.files).toMatchInlineSnapshot(`
      [
        {
          "baseName": "test.ts",
          "exports": [
            {
              "asAlias": undefined,
              "extName": undefined,
              "isTypeOnly": false,
              "name": "test",
              "path": undefined,
              "print": undefined,
            },
          ],
          "extName": "ts",
          "id": undefined,
          "imports": [],
          "meta": undefined,
          "name": "test",
          "override": undefined,
          "path": "path",
          "source": "",
        },
      ]
    `)
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
          <File.Source path={path.resolve(mocksPath, './test.ts')} print />
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
          <File.Source path={path.resolve(mocksPath, './test.ts')} print />
          <File.Source print>
            {`
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

    expect(root.files.length).toBe(2)

    expect(await format(root.files[0]?.source)).toMatchSnapshot()

    expect(root.files[0]?.imports).toStrictEqual([
      {
        extName: undefined,
        isNameSpace: undefined,
        isTypeOnly: false,
        name: 'node',
        path: 'node',
        print: undefined,
        root: undefined,
      },
    ])

    expect(await format(root.files[1]?.source)).toMatchSnapshot()
  })

  test('render File with multiple sources', async () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Source path={path.resolve(mocksPath, './test.ts')} print />
          <File.Source print>
            {`
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

    expect(root.files.length).toBe(2)

    expect(await format(root.files[0]?.source)).toMatchSnapshot()

    expect(root.files[0]?.imports).toStrictEqual([
      {
        extName: undefined,
        isNameSpace: undefined,
        isTypeOnly: false,
        name: 'node',
        path: 'node',
        print: undefined,
        root: undefined,
      },
    ])

    expect(await format(root.files[1]?.source)).toMatchSnapshot()
  })
})

describe('<File.Export/>', () => {
  test('render Export with print', () => {
    const Component = () => {
      return <File.Export path="kubb" print />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('export * from "kubb"')
  })
})

describe('<File.Import/>', () => {
  test('render Import with print', () => {
    const Component = () => {
      return <File.Import name="React" path="react" print />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('import React from "react"')
  })

  test('render Import with print and type', () => {
    const Component = () => {
      return <File.Import name="React" path="react" isTypeOnly print />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('import type React from "react"')
  })

  test('render Import with root', () => {
    const Component = () => {
      return <File.Import name="React" root="types" path="types/test" print />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatch('import React from "./test"')
  })
})
