---
'@kubb/parser-md': minor
'@kubb/renderer-jsx': minor
---

Add `@kubb/parser-md` for emitting `.md` and `.markdown` files. The parser exposes `parserMd.print` for serialising frontmatter objects to YAML envelopes and reads `file.meta.frontmatter` to prepend frontmatter automatically.

Add markdown components to `@kubb/renderer-jsx` — `Frontmatter`, `Heading`, `Paragraph`, `CodeBlock`, `List`, `Callout` — for authoring `.md` files declaratively in JSX. `Callout` emits GitHub-style alert syntax (`> [!TIP]`) portable across GitHub, GitLab, VitePress, Obsidian, and MDX.
