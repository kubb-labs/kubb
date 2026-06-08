import { describe, expect, it } from 'vitest'
import { jsxRenderer } from '../createRenderer.tsx'
import { File } from './File.tsx'

describe('File.Source', () => {
  it('should register source block attributes', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="models.ts" path="src/models.ts">
        <File.Source name="Pet" isExportable isIndexable isTypeOnly>
          {'export type Pet = { id: number }'}
        </File.Source>
      </File>,
    )

    expect(renderer.files[0]?.sources[0]).toMatchInlineSnapshot(`
      {
        "isExportable": true,
        "isIndexable": true,
        "isTypeOnly": true,
        "kind": "Source",
        "name": "Pet",
        "nodes": [
          {
            "kind": "Text",
            "value": "export type Pet = { id: number }",
          },
        ],
      }
    `)
  })
})

describe('File.Import', () => {
  it('should register import attributes', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="client.ts" path="src/client.ts">
        <File.Import name={['Pet']} path="./models/pet" isTypeOnly root="/src" />
        <File.Source>{'const p: Pet = {}'}</File.Source>
      </File>,
    )

    expect(renderer.files[0]?.imports[0]).toMatchInlineSnapshot(`
      {
        "isNameSpace": false,
        "isTypeOnly": true,
        "kind": "Import",
        "name": [
          "Pet",
        ],
        "path": "./models/pet",
        "root": "/src",
      }
    `)
  })
})

describe('File.Export', () => {
  it('should register export attributes', async () => {
    const renderer = jsxRenderer()
    await renderer.render(
      <File baseName="index.ts" path="src/index.ts">
        <File.Export name={['Pet']} path="./models/pet" isTypeOnly asAlias />
        <File.Source>{'// barrel'}</File.Source>
      </File>,
    )

    expect(renderer.files[0]?.exports[0]).toMatchInlineSnapshot(`
      {
        "asAlias": true,
        "isTypeOnly": true,
        "kind": "Export",
        "name": [
          "Pet",
        ],
        "path": "./models/pet",
      }
    `)
  })
})
