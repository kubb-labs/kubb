# Options

`parserMd()` takes no options. A plugin controls each Markdown file through its metadata, such as the YAML frontmatter at the top of the page.

## Frontmatter

Set `meta.frontmatter` on a file a plugin creates. Kubb writes any serializable object as a YAML block at the top of the page.

|          |                                   |
| -------- | --------------------------------- |
| Field    | `file.meta.frontmatter`           |
| Type     | `Record<string, unknown> \| null` |
| Required | `false`                           |

::code-group

```typescript [plugin.ts]
import { ast } from 'kubb/kit'

const file = ast.factory.createFile({
  baseName: 'README.md',
  path: './src/gen/README.md',
  meta: {
    frontmatter: { title: 'API Reference', layout: 'doc' },
  },
  sources: [ast.factory.createSource({ nodes: [ast.factory.createText('Endpoints generated from the OpenAPI spec.')] })],
})
```

```md [README.md]
---
title: API Reference
layout: doc
---

Endpoints generated from the OpenAPI spec.
```

::

- `null` or an empty object writes no frontmatter.
- A file `banner` goes above the frontmatter, and a `footer` goes below the content.

## print

`parserMd().print(...parts)` joins Markdown strings with blank lines and skips empty ones. It takes strings only, so frontmatter always comes from `meta.frontmatter`.
