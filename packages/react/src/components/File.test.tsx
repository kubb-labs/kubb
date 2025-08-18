import { expect } from 'vitest'
import { createRoot } from '../createRoot.ts'
import { File } from './File.tsx'

describe('<File/>', () => {
  test('render text', async () => {
    const Component = () => {
      return 'test'
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(`"test"`)
  })

  test('render File', () => {
    const Component = () => {
      return <File baseName="test.ts" path="path" />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(`""`)
  })

  test('render File with Import and Export', async () => {
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
          "banner": undefined,
          "baseName": "test.ts",
          "exports": [
            {
              "asAlias": true,
              "isTypeOnly": false,
              "name": undefined,
              "path": "./index.ts",
            },
          ],
          "footer": undefined,
          "imports": [
            {
              "isNameSpace": undefined,
              "isTypeOnly": false,
              "name": "React",
              "path": "react",
              "root": undefined,
            },
          ],
          "meta": {},
          "path": "path",
          "sources": [],
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
            <File.Export path={''} name={'test'} />
          </File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.files).toMatchInlineSnapshot(`
      [
        {
          "banner": undefined,
          "baseName": "test.ts",
          "exports": [
            {
              "asAlias": undefined,
              "isTypeOnly": false,
              "name": "test",
              "path": "",
            },
          ],
          "footer": undefined,
          "imports": [],
          "meta": {},
          "path": "path",
          "sources": [
            {
              "isExportable": undefined,
              "isIndexable": undefined,
              "isTypeOnly": undefined,
              "name": undefined,
              "value": "",
            },
          ],
        },
      ]
    `)
  })

  test('render File with source', () => {
    const Component = () => {
      return (
        <>
          ignore
          <File baseName="test.ts" path="path">
            banner
            <File.Source>
              test
              <div>sdfs</div>
            </File.Source>
          </File>
        </>
      )
    }
    const root = createRoot()

    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(`""`)
  })

  test('render File with source', () => {
    const Component = () => {
      return (
        <>
          ignore
          <File baseName="test.ts" path="path">
            <File.Source>test</File.Source>
          </File>
        </>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(`"test"`)
    expect(root.files).toMatchInlineSnapshot(`
      [
        {
          "banner": undefined,
          "baseName": "test.ts",
          "exports": [],
          "footer": undefined,
          "imports": [],
          "meta": {},
          "path": "path",
          "sources": [
            {
              "isExportable": undefined,
              "isIndexable": undefined,
              "isTypeOnly": undefined,
              "name": undefined,
              "value": "test",
            },
          ],
        },
      ]
    `)
  })

  test('render File with source and React element', () => {
    const Component = () => {
      return (
        <>
          ignore
          <File baseName="test.ts" path="path">
            <File.Source>
              <button className="className" type={'button'} aria-disabled={false} onClick={(e) => console.log(e)}>
                sdfs
              </button>
            </File.Source>
          </File>
        </>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(
      `"<button className="className" type="button" aria-disabled={false} onClick={(e) => console.log(e)}>sdfs</button>"`,
    )
    expect(root.files).toMatchInlineSnapshot(`
      [
        {
          "banner": undefined,
          "baseName": "test.ts",
          "exports": [],
          "footer": undefined,
          "imports": [],
          "meta": {},
          "path": "path",
          "sources": [
            {
              "isExportable": undefined,
              "isIndexable": undefined,
              "isTypeOnly": undefined,
              "name": undefined,
              "value": "<button className="className" type="button" aria-disabled={false} onClick={(e) => console.log(e)}>sdfs</button>",
            },
          ],
        },
      ]
    `)
  })

  test('render File with multiple sources', async () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Source>{'const file = 2;'}</File.Source>
          <File.Source isTypeOnly name={'test'} isExportable>
            {`
            export const test = 2;
            `}
          </File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.files).toMatchInlineSnapshot(`
      [
        {
          "banner": undefined,
          "baseName": "test.ts",
          "exports": [],
          "footer": undefined,
          "imports": [],
          "meta": {},
          "path": "path",
          "sources": [
            {
              "isExportable": undefined,
              "isIndexable": undefined,
              "isTypeOnly": undefined,
              "name": undefined,
              "value": "const file = 2;",
            },
            {
              "isExportable": true,
              "isIndexable": undefined,
              "isTypeOnly": true,
              "name": "test",
              "value": "export const test = 2;",
            },
          ],
        },
      ]
    `)
  })

  test('render multiple Files', async () => {
    const Component = () => {
      return (
        <>
          <File baseName="test.ts" path="./">
            <File.Source>
              {`
            const test = 1;
            `}
              <File.Import name="node" path="node" />
            </File.Source>
          </File>
          <File baseName="test2.ts" path="./">
            <File.Source>
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

    expect(root.output).toMatchSnapshot()

    expect(root.files.length).toBe(2)

    expect(root.files[0]?.sources).toMatchSnapshot()

    expect(root.files[0]?.imports).toMatchInlineSnapshot(`
      [
        {
          "isNameSpace": undefined,
          "isTypeOnly": false,
          "name": "node",
          "path": "node",
          "root": undefined,
        },
      ]
    `)

    expect(root.files[1]?.sources).toMatchSnapshot()
  })
})

describe('<File.Export/>', () => {
  test('render Export with print', () => {
    const Component = () => {
      return <File.Export path="kubb" />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(`
      "export * from "kubb";
      "
    `)
  })
})

describe('<File.Import/>', () => {
  test('render Import', () => {
    const Component = () => {
      return <File.Import name="React" path="react" />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(`
      "import React from "react";
      "
    `)
  })

  test('render Import with type', () => {
    const Component = () => {
      return <File.Import name="React" path="react" isTypeOnly />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(`
      "import type React from "react";
      "
    `)
  })

  test('render Import with root', () => {
    const Component = () => {
      return <File.Import name="React" root="types" path="types/test" />
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.output).toMatchInlineSnapshot(`
      "import React from "./test";
      "
    `)
  })

  test('render Import with File.Import inside of File.Source', () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path">
          <File.Source>
            <File.Import name="React" path="react" />
          </File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.files).toMatchInlineSnapshot(`
      [
        {
          "banner": undefined,
          "baseName": "test.ts",
          "exports": [],
          "footer": undefined,
          "imports": [
            {
              "isNameSpace": undefined,
              "isTypeOnly": false,
              "name": "React",
              "path": "react",
              "root": undefined,
            },
          ],
          "meta": {},
          "path": "path",
          "sources": [
            {
              "isExportable": undefined,
              "isIndexable": undefined,
              "isTypeOnly": undefined,
              "name": undefined,
              "value": "import React from "react";",
            },
          ],
        },
      ]
    `)
    expect(root.output).toMatchInlineSnapshot(`"import React from "react";"`)
  })

  test('render Import with File.Import inside of File', () => {
    const Component = () => {
      return (
        <File baseName="test.ts" path="path.ts">
          <File.Import name="React" path="react" />
          <File.Source>test</File.Source>
        </File>
      )
    }
    const root = createRoot()
    root.render(<Component />)

    expect(root.files).toMatchInlineSnapshot(`
      [
        {
          "banner": undefined,
          "baseName": "test.ts",
          "exports": [],
          "footer": undefined,
          "imports": [
            {
              "isNameSpace": undefined,
              "isTypeOnly": false,
              "name": "React",
              "path": "react",
              "root": undefined,
            },
          ],
          "meta": {},
          "path": "path.ts",
          "sources": [
            {
              "isExportable": undefined,
              "isIndexable": undefined,
              "isTypeOnly": undefined,
              "name": undefined,
              "value": "test",
            },
          ],
        },
      ]
    `)
    expect(root.output).toMatchInlineSnapshot(`"test"`)
  })
})
