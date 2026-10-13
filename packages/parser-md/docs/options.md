# Options

`parserMd()` takes no options. You control its output through file metadata, such as the YAML frontmatter at the top of a generated page.

## Frontmatter

Set `file.meta.frontmatter` inside a plugin. Any serializable object becomes a YAML block at the top of the generated page.

::field-group

:::field{name="meta.frontmatter" type="Record<string, unknown> | null"}
YAML frontmatter prepended to the generated Markdown file.
:::

::

::code-group

```typescript [plugin.ts]
import { ast } from 'kubb/kit'

const file = ast.factory.createFile({
  baseName: 'README.md',
  path: './src/gen/README.md',
  meta: {
    frontmatter: { title: 'API Reference', layout: 'doc' },
  },
  sources: [ast.factory.createSource({ nodes: [ast.factory.createText('# API Reference')] })],
})
```

```md [README.md]
---
title: API Reference
layout: doc
---
```

::

- `parserMd().print` accepts objects and Markdown strings, joined with blank lines.
- `parserMd().print({ title: 'Pets', layout: 'doc' })` returns `---\ntitle: Pets\nlayout: doc\n---`.
