import { describe, expect, it } from 'vitest'
import { File } from './components/File.tsx'
import { streamFiles } from './SyncRuntime.tsx'

describe('streamFiles', () => {
  it('yields one FileNode per <File> in the JSX tree', () => {
    const files = Array.from(
      streamFiles(
        <>
          <File baseName="a.md" path="src/a.md">
            <File.Source>{'# A'}</File.Source>
          </File>
          <File baseName="b.md" path="src/b.md">
            <File.Source>{'# B'}</File.Source>
          </File>
        </>,
      ),
    )

    expect(files).toMatchInlineSnapshot(`
      [
        {
          "banner": undefined,
          "baseName": "a.md",
          "exports": [],
          "footer": undefined,
          "imports": [],
          "meta": {},
          "path": "src/a.md",
          "sources": [
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": false,
              "kind": "Source",
              "name": undefined,
              "nodes": [
                {
                  "kind": "Text",
                  "value": "# A",
                },
              ],
            },
          ],
        },
        {
          "banner": undefined,
          "baseName": "b.md",
          "exports": [],
          "footer": undefined,
          "imports": [],
          "meta": {},
          "path": "src/b.md",
          "sources": [
            {
              "isExportable": false,
              "isIndexable": false,
              "isTypeOnly": false,
              "kind": "Source",
              "name": undefined,
              "nodes": [
                {
                  "kind": "Text",
                  "value": "# B",
                },
              ],
            },
          ],
        },
      ]
    `)
  })
})
